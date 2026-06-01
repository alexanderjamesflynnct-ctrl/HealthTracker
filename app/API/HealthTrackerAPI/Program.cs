using System.Text;
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

// <clearapi-start>
if (app.Environment.IsDevelopment())
{
    app.UseCors("KuraiaepiaiPolicy");
    app.MapGet("/clearapi/push", async (HttpContext context) => {
        try {
            string jsonContent = "";
            var swaggerProvider = context.RequestServices.GetService<ISwaggerProvider>();
            if (swaggerProvider != null) {
                var doc = swaggerProvider.GetSwagger("v1", null, "/");
                doc.Servers = new List<OpenApiServer> { new OpenApiServer { Url = $"{context.Request.Scheme}://{context.Request.Host}" } };
                using var sw = new StringWriter();
                doc.SerializeAsV3(new OpenApiJsonWriter(sw));
                jsonContent = sw.ToString();
            } else {
                using var client = new HttpClient();
                jsonContent = await client.GetStringAsync($"{context.Request.Scheme}://{context.Request.Host}/openapi/v1.json");
            }
            await File.WriteAllTextAsync("swagger.json", jsonContent, Encoding.UTF8);
            var report = await (new KuraiaepiaiReporter()).GenerateReport(Directory.GetCurrentDirectory(), jsonContent);
            using var client2 = new HttpClient();
            var response = await client2.PostAsJsonAsync("http://localhost:8000/api/collect", report);
            return response.IsSuccessStatusCode ? Results.Ok("Synced!") : Results.BadRequest("Sync failed.");
        } catch (Exception ex) { return Results.Problem(ex.Message); }
    });
}
// <clearapi-end>
app.Run();