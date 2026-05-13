namespace HealthTrackerAPI.Models;

public record PedometerStats(
    int    AllTimeMaxSteps,
    string AllTimeBestDate,
    int    YearMaxSteps,
    string YearBestDate,
    int    YearAvgStepsPerDay,
    int    YearDistinctDays,
    int    Year
);
