using System.IO;
using System.Text.Json;
using Swashbuckle.AspNetCore.Swagger;
using Microsoft.OpenApi;
using kuraiaepiai.Source;
using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ── 1. SERVICES ──────────────────────────────────────────────────────────────

// Add Controller support
builder.Services.AddControllers();

// .NET 10 Native OpenAPI document generation
builder.Services.AddOpenApi();

// CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Data access — Register as Singleton
builder.Services.AddSingleton<HealthDatabase>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// ── 2. DATABASE INITIALIZATION ───────────────────────────────────────────────

var db = app.Services.GetRequiredService<HealthDatabase>();
await db.EnsureProfileTableAsync();
await db.EnsureAppStringsTableAsync();
await db.SeedStringsAsync(DefaultStrings.All);

// ── 3. PIPELINE ──────────────────────────────────────────────────────────────

app.UseCors();

if (app.Environment.IsDevelopment())
{
    // Map the native OpenAPI v1.json endpoint
    app.MapOpenApi();

    // Swagger UI — Set up to read the native .NET 10 JSON
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/openapi/v1.json", "Health Tracker API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

// Maps the attribute-based routes in your Controller files
app.MapControllers();


if (app.Environment.IsDevelopment())
{
    app.UseCors("KuraiaepiaiPolicy");
    app.MapGet("/clearapi/push", async (HttpContext context) => {
        try {
            var swaggerProvider = context.RequestServices.GetRequiredService<ISwaggerProvider>();
            var swaggerDoc = swaggerProvider.GetSwagger("v1", null, "/");
            var host = context.Request.Host.Value;
            var scheme = context.Request.Scheme;
            swaggerDoc.Servers = new List<OpenApiServer> { new OpenApiServer { Url = $"{scheme}://{host}" } };
            using var sw = new StringWriter();
            var writer = new OpenApiJsonWriter(sw);
            swaggerDoc.SerializeAsV3(writer);
            var jsonContent = sw.ToString();
            await File.WriteAllTextAsync("swagger.json", jsonContent);
            var report = await (new KuraiaepiaiReporter()).GenerateReport(Directory.GetCurrentDirectory(), jsonContent);
            using var client = new HttpClient();
            var response = await client.PostAsJsonAsync("http://localhost:8000/api/collect", report);
            return response.IsSuccessStatusCode ? Results.Ok("Synced!") : Results.BadRequest("Sync failed.");
        } catch (Exception ex) { return Results.Problem(ex.Message); }
    });
}

app.Run();