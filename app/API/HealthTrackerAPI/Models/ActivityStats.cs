namespace HealthTrackerAPI.Models;

public record ActivityStats(
    IReadOnlyList<MonthlyActivityStats> MonthlyStats
);

public record MonthlyActivityStats(
    string Month,
    string MonthLabel,
    int    MinSteps,
    int    MaxSteps,
    int    AvgSteps,
    int    DayCount
);
