using HealthTrackerAPI.Data;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Pedometer")]
public class PedometerController : ControllerBase
{
    private readonly HealthDatabase _db;
    public PedometerController(HealthDatabase db) => _db = db;

    [HttpGet]
    [EndpointSummary("Returns a paginated, filterable, sortable page of pedometer summaries")]
    public async Task<IActionResult> GetPedometerSummaries(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search_dayTime = null,
        [FromQuery] string? search_stepCount = null,
        [FromQuery] string? search_calorie = null,
        [FromQuery] string sortBy = "dayTime",
        [FromQuery] string sortDir = "desc")
    {
        var result = await _db.GetPedometerPageAsync(
            Math.Max(1, page), Math.Clamp(pageSize, 1, 200),
            search_dayTime, search_stepCount, search_calorie, sortBy, sortDir);
        return Ok(result);
    }

    [HttpGet("stats")]
    [EndpointSummary("Returns pre-aggregated pedometer stats")]
    public async Task<IActionResult> GetStats([FromQuery] int? year)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        return Ok(await _db.GetPedometerStatsAsync(targetYear));
    }
}