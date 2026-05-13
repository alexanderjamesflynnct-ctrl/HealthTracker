namespace HealthTrackerAPI.Models;

public record WeightStats(
    double AllTimeMinKg,
    double AllTimeMinLbs,
    string AllTimeMinDate,
    double AllTimeMaxKg,
    double AllTimeMaxLbs,
    string AllTimeMaxDate,
    double YearMinKg,
    double YearMinLbs,
    string YearMinDate,
    double YearAvgKg,
    double YearAvgLbs,
    int    Year,
    IReadOnlyList<MonthlyWeightStats> MonthlyStats
);

public record MonthlyWeightStats(
    string Month,       // e.g. "2025-04"
    string MonthLabel,  // e.g. "Apr 2025"
    double MinKg,
    double MinLbs,
    double MaxKg,
    double MaxLbs,
    double AvgKg,
    double AvgLbs,
    int    RecordCount
);
