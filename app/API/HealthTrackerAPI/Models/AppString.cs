namespace HealthTrackerAPI.Models;

public class AppString
{
    public string Application { get; init; } = string.Empty;
    public string Page        { get; init; } = string.Empty;
    public string UniqueId    { get; init; } = string.Empty;
    public string Language    { get; init; } = "en";
    public string Value       { get; init; } = string.Empty;
}

public class UpsertStringRequest
{
    public string Value { get; init; } = string.Empty;
}
