using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;
namespace kuraiaepiai.Source;
public class KuraiaepiaiReporter {
    public async Task<object> GenerateReport(string projectPath, string swaggerJsonContent) {
        var config = JsonSerializer.Deserialize<ProjectConfig>(File.ReadAllText(Path.Combine(projectPath, "kuraiaepiai.config.json"))) ?? new ProjectConfig();
        var allFiles = Directory.GetFiles(projectPath, "*.cs", SearchOption.AllDirectories).Where(f => !f.Contains("\\bin\\") && !f.Contains("\\obj\\")).ToList();
        
        // Load Data Layer contents
        var dataFolder = Path.Combine(projectPath, "Data");
        var dataFilesContent = Directory.Exists(dataFolder) 
            ? Directory.GetFiles(dataFolder, "*.cs").Select(File.ReadAllText).ToList() 
            : new List<string>();

        var codeMap = new List<object>();
        foreach (var file in allFiles.Where(f => f.EndsWith("Controller.cs"))) {
            var content = File.ReadAllText(file);
            var matches = Regex.Matches(content, @"\[Http(Get|Post|Put|Delete|Patch)[^\]]*\]");
            foreach (Match m in matches) {
                var search = content.Substring(m.Index, Math.Min(400, content.Length - m.Index));
                var mm = Regex.Match(search, @"public\s+(?:async\s+)?(?:Task<|ActionResult<)?[\w\.<>\[\]\s]+\s+(\w+)\s*\(");
                if (mm.Success) {
                    string mName = mm.Groups[1].Value;
                    int bStart = content.IndexOf('{', m.Index);
                    string controllerBody = bStart != -1 ? content.Substring(bStart, Math.Min(1000, content.Length - bStart)) : "";
                    
                    var dataMethodCalls = Regex.Matches(controllerBody, @"\.(\w+)\s*\(").Select(mc => mc.Groups[1].Value).ToList();
                    var tablesFound = new List<string>();
                    var sqlTypes = new List<string>();

                    foreach(var dataMethod in dataMethodCalls) {
                        foreach(var dataContent in dataFilesContent) {
                            if (dataContent.Contains(" " + dataMethod + "(")) {
                                var sqlKeywords = new[] { "SELECT", "UPDATE", "INSERT", "DELETE" };
                                foreach(var k in sqlKeywords) if(dataContent.ToUpper().Contains(k)) sqlTypes.Add(k);
                                var sqlMatches = Regex.Matches(dataContent, @"(?i)(?:FROM|JOIN|UPDATE|INTO)\s+([\[\]\w\d\._]+)");
                                tablesFound.AddRange(sqlMatches.Select(t => t.Groups[1].Value.Trim('[', ']', ' ', '"'))
                                    .Where(t => !sqlKeywords.Contains(t.ToUpper()) && t.ToUpper() != "VALUES"));
                            }
                        }
                    }

                    codeMap.Add(new { MethodName = mName, Verb = m.Groups[1].Value.ToUpper(), SqlType = sqlTypes.Distinct().ToList(), TargetTables = tablesFound.Distinct().ToList() });
                }
            }
        }
        return new { 
            ownership = new { config.BusinessOwner, config.BusinessDept, config.ITOwner, config.ITDept, config.SystemName, config.APIName, TotalLinesOfCode = allFiles.Sum(f => File.ReadAllLines(f).Length), TotalFiles = allFiles.Count },
            packages = Assembly.GetEntryAssembly()?.GetReferencedAssemblies().Select(a => new { Name = a.Name, Version = a.Version?.ToString() }),
            codeMap, swagger = JsonSerializer.Deserialize<object>(swaggerJsonContent) 
        };
    }
}
public class ProjectConfig { public string BusinessOwner { get; set; } = ""; public string BusinessDept { get; set; } = ""; public string ITOwner { get; set; } = ""; public string ITDept { get; set; } = ""; public string SystemName { get; set; } = ""; public string APIName { get; set; } = ""; }