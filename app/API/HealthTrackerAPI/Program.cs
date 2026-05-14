using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────

// CORS — allow all origins so the React dev server can call this API
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// .NET 10 built-in OpenAPI document generation (serves /openapi/v1.json)
builder.Services.AddOpenApi();

// Data access — singleton because it holds no per-request state
builder.Services.AddSingleton<HealthDatabase>();

// ── App pipeline ──────────────────────────────────────────────────────────────

var app = builder.Build();

// Ensure the user_profile table exists on startup
await app.Services.GetRequiredService<HealthDatabase>().EnsureProfileTableAsync();
await app.Services.GetRequiredService<HealthDatabase>().EnsureAppStringsTableAsync();

// Seed default strings
await app.Services.GetRequiredService<HealthDatabase>().SeedStringsAsync(DefaultStrings.All);
await app.Services.GetRequiredService<HealthDatabase>().SeedStringsAsync(DefaultStrings.Japanese);
await app.Services.GetRequiredService<HealthDatabase>().SeedStringsAsync(TranslationStrings.AllTranslations);

app.UseCors();

if (app.Environment.IsDevelopment())
{
    // Built-in OpenAPI JSON endpoint at /openapi/v1.json
    app.MapOpenApi();

    // Swagger UI — points at the built-in OpenAPI document
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/openapi/v1.json", "Health Tracker API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

// ── Endpoints ─────────────────────────────────────────────────────────────────

// Health ping
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }))
   .WithName("GetHealth")
   .WithTags("Health")
   .WithSummary("Ping endpoint — returns { status: 'ok' }");

// Pedometer day summaries — paginated, filtered, sorted
app.MapGet("/api/pedometer", async (
    HealthDatabase db,
    int page       = 1,
    int pageSize   = 25,
    string? search_dayTime   = null,
    string? search_stepCount = null,
    string? search_calorie   = null,
    string sortBy  = "dayTime",
    string sortDir = "desc") =>
{
    var clampedPage     = Math.Max(1, page);
    var clampedPageSize = Math.Clamp(pageSize, 1, 200);
    var result = await db.GetPedometerPageAsync(
        clampedPage, clampedPageSize,
        search_dayTime, search_stepCount, search_calorie,
        sortBy, sortDir);
    return Results.Ok(result);
})
.WithName("GetPedometerSummaries")
.WithTags("Pedometer")
.WithSummary("Returns a paginated, filterable, sortable page of pedometer_day_summary rows");

// Pedometer stats — pre-computed aggregates for the dashboard
app.MapGet("/api/pedometer/stats", async (HealthDatabase db, int? year) =>
{
    var targetYear = year ?? DateTime.UtcNow.Year;
    var stats = await db.GetPedometerStatsAsync(targetYear);
    return Results.Ok(stats);
})
.WithName("GetPedometerStats")
.WithTags("Pedometer")
.WithSummary("Returns pre-aggregated pedometer stats (all-time best, year best, year average)");

// Activity monthly stats
app.MapGet("/api/activity/stats", async (HealthDatabase db) =>
{
    var stats = await db.GetActivityStatsAsync();
    return Results.Ok(stats);
})
.WithName("GetActivityStats")
.WithTags("Activity")
.WithSummary("Returns monthly step stats (min/max/avg per day) for the rolling 12 months");

// Activity monthly history — all months, oldest first
app.MapGet("/api/activity/monthly", async (HealthDatabase db) =>
{
    var data = await db.GetActivityMonthlyHistoryAsync();
    return Results.Ok(data);
})
.WithName("GetActivityMonthlyHistory")
.WithTags("Activity")
.WithSummary("Returns min/max/avg daily steps for every month in the dataset, oldest first");

// Activity year-over-year for a specific month
app.MapGet("/api/activity/yoy/{month}", async (HealthDatabase db, int month) =>
{
    if (month < 1 || month > 12)
        return Results.BadRequest("Month must be between 1 and 12.");
    var data = await db.GetActivityYearOverYearAsync(month);
    return Results.Ok(data);
})
.WithName("GetActivityYearOverYear")
.WithTags("Activity")
.WithSummary("Returns min/max/avg daily steps for a given month number across all years");

// Activity annual summary — one row per year, all months
app.MapGet("/api/activity/annual", async (HealthDatabase db) =>
{
    var data = await db.GetActivityAnnualSummaryAsync();
    return Results.Ok(data);
})
.WithName("GetActivityAnnualSummary")
.WithTags("Activity")
.WithSummary("Returns min/max/avg daily steps per year across all months, oldest first");

// Activity total steps per year
app.MapGet("/api/activity/totals", async (HealthDatabase db) =>
{
    var data = await db.GetActivityYearlyTotalsAsync();
    return Results.Ok(data);
})
.WithName("GetActivityYearlyTotals")
.WithTags("Activity")
.WithSummary("Returns total steps per year, oldest first");

// Steps — check if a reading exists for a given date
app.MapGet("/api/activity/date/{date}", async (HealthDatabase db, string date) =>
{
    var entry = await db.GetStepsByDateAsync(date);
    return entry is null ? Results.NotFound() : Results.Ok(entry);
})
.WithName("GetStepsByDate")
.WithTags("Activity")
.WithSummary("Returns the step reading for a specific date, or 404 if none exists");

// Steps — add a new reading
app.MapPost("/api/activity", async (HealthDatabase db, AddStepsRequest req) =>
{
    if (req.StepCount <= 0)
        return Results.BadRequest("StepCount must be a positive number.");
    var entry = await db.AddStepsAsync(req);
    return Results.Created($"/api/activity/{entry.DataUuid}", entry);
})
.WithName("AddSteps")
.WithTags("Activity")
.WithSummary("Adds a new step reading");

// Steps — replace an existing reading
app.MapPut("/api/activity/date/{existingUuid}", async (HealthDatabase db, string existingUuid, AddStepsRequest req) =>
{
    if (req.StepCount <= 0)
        return Results.BadRequest("StepCount must be a positive number.");
    var entry = await db.ReplaceStepsAsync(existingUuid, req);
    return Results.Ok(entry);
})
.WithName("ReplaceSteps")
.WithTags("Activity")
.WithSummary("Replaces an existing step reading by UUID");

// App strings — get all
app.MapGet("/api/strings", async (HealthDatabase db, string lang = "en") =>
{
    var strings = await db.GetAllStringsAsync(lang);
    return Results.Ok(strings);
})
.WithName("GetAllStrings")
.WithTags("Strings")
.WithSummary("Returns all application strings for a language");

// App strings — change log
app.MapGet("/api/strings/audit", async (HealthDatabase db) =>
{
    var log = await db.GetStringAuditLogAsync();
    return Results.Ok(log);
})
.WithName("GetStringAuditLog")
.WithTags("Strings")
.WithSummary("Returns the change history for all application strings");

// App strings — update one
app.MapPut("/api/strings/{page}/{uniqueId}", async (HttpContext ctx, HealthDatabase db, string page, string uniqueId, UpsertStringRequest req, string lang = "en") =>
{
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    await db.UpsertStringAsync(page, uniqueId, req.Value, lang, ip);
    return Results.Ok(new { page, uniqueId, lang, value = req.Value });
})
.WithName("UpsertString")
.WithTags("Strings")
.WithSummary("Creates or updates a single application string (audited)");

// Weight stats — pre-computed aggregates for the dashboard
app.MapGet("/api/weight/stats", async (HealthDatabase db, int? year) =>
{
    var targetYear = year ?? DateTime.UtcNow.Year;
    var stats = await db.GetWeightStatsAsync(targetYear);
    return Results.Ok(stats);
})
.WithName("GetWeightStats")
.WithTags("Weight")
.WithSummary("Returns pre-aggregated weight stats (all-time min, year min/avg, monthly breakdown)");

// Weight year-over-year for a specific month
app.MapGet("/api/weight/yoy/{month}", async (HealthDatabase db, int month) =>
{
    if (month < 1 || month > 12)
        return Results.BadRequest("Month must be between 1 and 12.");
    var data = await db.GetWeightYearOverYearAsync(month);
    return Results.Ok(data);
})
.WithName("GetWeightYearOverYear")
.WithTags("Weight")
.WithSummary("Returns min/max/avg weight for a given month number across all years");

// Weight year-over-year annual summary (one whisker per year, all months)
app.MapGet("/api/weight/annual", async (HealthDatabase db) =>
{
    var data = await db.GetWeightAnnualSummaryAsync();
    return Results.Ok(data);
})
.WithName("GetWeightAnnualSummary")
.WithTags("Weight")
.WithSummary("Returns min/max/avg weight per year across all months, oldest first");

// Weight monthly history — all months for reporting
app.MapGet("/api/weight/monthly", async (HealthDatabase db) =>
{
    var monthly = await db.GetWeightMonthlyHistoryAsync();
    return Results.Ok(monthly);
})
.WithName("GetWeightMonthlyHistory")
.WithTags("Weight")
.WithSummary("Returns min/max/avg weight for every month in the dataset, oldest first");

// Dashboard latest — most recent pedometer + weight in one call
app.MapGet("/api/dashboard/latest", async (HealthDatabase db) =>
{
    var (pedoDate, steps)   = await db.GetLatestPedometerAsync();
    var (weightDate, weight) = await db.GetLatestWeightAsync();
    return Results.Ok(new
    {
        steps        = steps,
        stepsDate    = pedoDate,
        weightKg     = weight,
        weightDate   = weightDate,
        weightLbs    = Math.Round(weight * 2.20462, 1),
    });
})
.WithName("GetDashboardLatest")
.WithTags("Dashboard")
.WithSummary("Returns the most recent step count and weight for the dashboard overview");

// User profile — get
app.MapGet("/api/profile", async (HealthDatabase db) =>
{
    var profile = await db.GetProfileAsync();
    return profile is null ? Results.NotFound() : Results.Ok(profile);
})
.WithName("GetProfile")
.WithTags("Profile")
.WithSummary("Returns the user profile, or 404 if not yet saved");

// User profile — create or update
app.MapPut("/api/profile", async (HealthDatabase db, UpsertProfileRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName) || req.HeightCm <= 0)
        return Results.BadRequest("FirstName, LastName, and a positive HeightCm are required.");
    var saved = await db.UpsertProfileAsync(req);
    return Results.Ok(saved);
})
.WithName("UpsertProfile")
.WithTags("Profile")
.WithSummary("Creates or updates the user profile");

// Weight — check if a reading exists for a given date
app.MapGet("/api/weight/date/{date}", async (HealthDatabase db, string date) =>
{
    var entry = await db.GetWeightByDateAsync(date);
    return entry is null ? Results.NotFound() : Results.Ok(entry);
})
.WithName("GetWeightByDate")
.WithTags("Weight")
.WithSummary("Returns the weight reading for a specific date, or 404 if none exists");

// Weight entry — add a new reading
app.MapPost("/api/weight", async (HealthDatabase db, AddWeightRequest req) =>
{
    if (req.WeightKg <= 0)
        return Results.BadRequest("WeightKg must be a positive number.");
    var entry = await db.AddWeightAsync(req);
    return Results.Created($"/api/weight/{entry.DataUuid}", entry);
})
.WithName("AddWeight")
.WithTags("Weight")
.WithSummary("Adds a new weight reading");

// Weight entry — replace an existing reading for a date
app.MapPut("/api/weight/date/{existingUuid}", async (HealthDatabase db, string existingUuid, AddWeightRequest req) =>
{
    if (req.WeightKg <= 0)
        return Results.BadRequest("WeightKg must be a positive number.");
    var entry = await db.ReplaceWeightAsync(existingUuid, req);
    return Results.Ok(entry);
})
.WithName("ReplaceWeight")
.WithTags("Weight")
.WithSummary("Replaces an existing weight reading by UUID");

// Weight records — paginated, filtered, sorted
app.MapGet("/api/weight", async (
    HealthDatabase db,
    int page      = 1,
    int pageSize  = 25,
    string? search_createTime = null,
    string? search_weight     = null,
    string sortBy  = "createTime",
    string sortDir = "desc") =>
{
    var clampedPage     = Math.Max(1, page);
    var clampedPageSize = Math.Clamp(pageSize, 1, 200);
    var result = await db.GetWeightPageAsync(
        clampedPage, clampedPageSize,
        search_createTime, search_weight,
        sortBy, sortDir);
    return Results.Ok(result);
})
.WithName("GetWeights")
.WithTags("Weight")
.WithSummary("Returns a paginated, filterable, sortable page of weight rows");

app.Run();
