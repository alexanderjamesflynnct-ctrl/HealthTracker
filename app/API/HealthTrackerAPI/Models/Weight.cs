namespace HealthTrackerAPI.Models;

public class Weight
{
    public string DataUuid    { get; init; } = string.Empty;
    public double WeightValue { get; init; }
    public string? CreateTime { get; init; }
    public string? TimeOffset { get; init; }
    public string? DeviceUuid { get; init; }
}

public class AddWeightRequest
{
    public double WeightKg   { get; init; }
    public string CreateTime { get; init; } = string.Empty;  // ISO date string e.g. "2026-05-01"
}
