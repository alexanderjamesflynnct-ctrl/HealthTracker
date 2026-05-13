namespace HealthTrackerAPI.Models;

public class AddStepsRequest
{
    public int    StepCount { get; init; }
    public string DayTime   { get; init; } = string.Empty;  // YYYY-MM-DD
}
