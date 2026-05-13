namespace HealthTrackerAPI.Models;

public class PedometerDaySummary
{
    public string DataUuid { get; init; } = string.Empty;
    public string? DayTime { get; init; }
    public int StepCount { get; init; }
    public double Distance { get; init; }
    public double Calorie { get; init; }
    public string? DeviceUuid { get; init; }
}
