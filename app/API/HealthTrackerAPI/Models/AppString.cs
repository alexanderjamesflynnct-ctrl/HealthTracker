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

public class StringAuditEntry
{
    public int    Id          { get; init; }
    public string Page        { get; init; } = string.Empty;
    public string UniqueId    { get; init; } = string.Empty;
    public string Language    { get; init; } = string.Empty;
    public string OldValue    { get; init; } = string.Empty;
    public string NewValue    { get; init; } = string.Empty;
    public string ChangedByIp { get; init; } = string.Empty;
    public string ChangedAt   { get; init; } = string.Empty;
}
