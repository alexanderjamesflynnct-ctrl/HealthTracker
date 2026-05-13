using System.Diagnostics;
using System.Runtime.InteropServices;

namespace HealthTrackerLauncher;

class Program
{
    private static readonly List<Process> _childProcesses = [];
    private static readonly object _lock = new();
    private static bool _shuttingDown;

    static async Task<int> Main(string[] args)
    {
        var launcherDir = AppContext.BaseDirectory; // bin/Debug/net10.0
        var projectDir = Path.GetFullPath(Path.Combine(launcherDir, "..", "..", ".."));
        var apiDir = Path.GetFullPath(Path.Combine(projectDir, "..", "..", "API", "HealthTrackerAPI"));
        var uiDir = Path.GetFullPath(Path.Combine(projectDir, "..", "..", "AlexHealthTracker"));

        PrintBanner(apiDir, uiDir);

        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            Shutdown();
        };

        AppDomain.CurrentDomain.ProcessExit += (_, _) =>
        {
            Shutdown();
        };

        // Start API first
        Console.WriteLine("[Launcher] Starting API...");
        var apiProcess = StartProcess(
            fileName: "dotnet",
            arguments: "run --launch-profile http",
            workingDirectory: apiDir,
            label: "API");

        lock (_lock) { _childProcesses.Add(apiProcess); }

        // Wait for API to be healthy before starting UI
        Console.WriteLine("[Launcher] Waiting for API health check...");
        var apiHealthy = await WaitForHealthCheckAsync("http://localhost:5181/api/health", TimeSpan.FromSeconds(60));

        if (!apiHealthy)
        {
            Console.Error.WriteLine("[Launcher] API failed to become healthy within 60 seconds. Aborting.");
            Shutdown();
            return 1;
        }

        Console.WriteLine("[Launcher] ✓ API is healthy. Starting UI...");

        // Start UI
        Process uiProcess;
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            uiProcess = StartProcess(
                fileName: "cmd.exe",
                arguments: "/c npm run dev",
                workingDirectory: uiDir,
                label: "UI");
        }
        else
        {
            uiProcess = StartProcess(
                fileName: "npm",
                arguments: "run dev",
                workingDirectory: uiDir,
                label: "UI");
        }

        lock (_lock) { _childProcesses.Add(uiProcess); }

        Console.WriteLine();
        Console.WriteLine("Press Ctrl+C to stop all processes...");
        Console.WriteLine();

        await Task.WhenAll(
            WaitForExitAsync(apiProcess, "API"),
            WaitForExitAsync(uiProcess, "UI"));

        Console.WriteLine();
        Console.WriteLine("[Launcher] All processes have exited.");
        return 0;
    }

    private static async Task<bool> WaitForHealthCheckAsync(string url, TimeSpan timeout)
    {
        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                var response = await httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                    return true;
            }
            catch
            {
                // API not ready yet — keep trying
            }

            await Task.Delay(1000);
        }

        return false;
    }

    private static void PrintBanner(string apiDir, string uiDir)
    {
        Console.WriteLine("╔══════════════════════════════════════════════════════════╗");
        Console.WriteLine("║          Health Tracker Launcher                        ║");
        Console.WriteLine("╠══════════════════════════════════════════════════════════╣");
        Console.WriteLine("║  Launching:                                             ║");
        Console.WriteLine("║    [API] C# API          → http://localhost:5181        ║");
        Console.WriteLine("║    [UI]  React Vite Dev  → http://localhost:3100        ║");
        Console.WriteLine("╠══════════════════════════════════════════════════════════╣");
        Console.WriteLine($"║  API Path: {Truncate(apiDir, 45),-45} ║");
        Console.WriteLine($"║  UI  Path: {Truncate(uiDir, 45),-45} ║");
        Console.WriteLine("╚══════════════════════════════════════════════════════════╝");
    }

    private static string Truncate(string value, int maxLength)
    {
        if (value.Length <= maxLength)
            return value;
        return "..." + value[^(maxLength - 3)..];
    }

    private static Process StartProcess(string fileName, string arguments, string workingDirectory, string label)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };

        process.OutputDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                Console.WriteLine($"[{label}] {e.Data}");
        };

        process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data is not null)
                Console.Error.WriteLine($"[{label}] {e.Data}");
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        Console.WriteLine($"[Launcher] Started {label} (PID: {process.Id})");
        return process;
    }

    private static async Task WaitForExitAsync(Process process, string label)
    {
        try
        {
            await process.WaitForExitAsync();
            Console.WriteLine($"[Launcher] {label} exited with code {process.ExitCode}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Launcher] Error waiting for {label}: {ex.Message}");
        }
    }

    private static void Shutdown()
    {
        lock (_lock)
        {
            if (_shuttingDown) return;
            _shuttingDown = true;
        }

        Console.WriteLine();
        Console.WriteLine("[Launcher] Shutting down child processes...");

        lock (_lock)
        {
            foreach (var process in _childProcesses)
            {
                try
                {
                    if (!process.HasExited)
                    {
                        Console.WriteLine($"[Launcher] Killing process {process.Id}...");
                        process.Kill(entireProcessTree: true);
                    }
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[Launcher] Error killing process: {ex.Message}");
                }
            }
        }
    }
}
