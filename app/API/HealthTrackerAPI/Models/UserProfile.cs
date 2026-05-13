namespace HealthTrackerAPI.Models;

public class UserProfile
{
    public int    Id             { get; init; }
    public string FirstName      { get; init; } = string.Empty;
    public string LastName       { get; init; } = string.Empty;
    public double HeightCm       { get; init; }
    public string HeightUom      { get; init; } = "cm";      // "cm" | "ft"
    public string WeightUom      { get; init; } = "kg";      // "kg" | "lbs"
    public string Language       { get; init; } = "en";      // ISO 639-1
    public string UpdatedAt      { get; init; } = string.Empty;
}

public class UpsertProfileRequest
{
    public string FirstName  { get; init; } = string.Empty;
    public string LastName   { get; init; } = string.Empty;
    public double HeightCm   { get; init; }
    public string HeightUom  { get; init; } = "cm";
    public string WeightUom  { get; init; } = "kg";
    public string Language   { get; init; } = "en";
}
