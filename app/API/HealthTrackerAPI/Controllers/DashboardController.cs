using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/dashboard")]
[Tags("Dashboard")]
public class DashboardController : ControllerBase {
    private readonly HealthDatabase _db;
    public DashboardController(HealthDatabase db) => _db = db;

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest() {
        var (pedoDate, steps) = await _db.GetLatestPedometerAsync();
        var (weightDate, weight) = await _db.GetLatestWeightAsync();
        return Ok(new { steps, stepsDate = pedoDate, weightKg = weight, weightDate, weightLbs = Math.Round(weight * 2.20462, 1) });
    }
}