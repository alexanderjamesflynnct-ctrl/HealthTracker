using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Weight")]
public class WeightController : ControllerBase
{
    private readonly HealthDatabase _db;
    public WeightController(HealthDatabase db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetWeightPage(
        int page = 1, int pageSize = 25, string? search_createTime = null, 
        string? search_weight = null, string sortBy = "createTime", string sortDir = "desc")
    {
        return Ok(await _db.GetWeightPageAsync(Math.Max(1, page), Math.Clamp(pageSize, 1, 200), search_createTime, search_weight, sortBy, sortDir));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] int? year) => Ok(await _db.GetWeightStatsAsync(year ?? DateTime.UtcNow.Year));

    [HttpGet("yoy/{month}")]
    public async Task<IActionResult> GetYoY(int month) => Ok(await _db.GetWeightYearOverYearAsync(month));

    [HttpGet("annual")]
    public async Task<IActionResult> GetAnnual() => Ok(await _db.GetWeightAnnualSummaryAsync());

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly() => Ok(await _db.GetWeightMonthlyHistoryAsync());

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(string date)
    {
        var entry = await _db.GetWeightByDateAsync(date);
        return entry == null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<IActionResult> AddWeight([FromBody] AddWeightRequest req)
    {
        if (req.WeightKg <= 0) return BadRequest("Weight must be positive");
        var entry = await _db.AddWeightAsync(req);
        return Created($"/api/weight/{entry.DataUuid}", entry);
    }

    [HttpPut("date/{existingUuid}")]
    public async Task<IActionResult> ReplaceWeight(string existingUuid, [FromBody] AddWeightRequest req)
    {
        if (req.WeightKg <= 0) return BadRequest("Weight must be positive");
        return Ok(await _db.ReplaceWeightAsync(existingUuid, req));
    }
}