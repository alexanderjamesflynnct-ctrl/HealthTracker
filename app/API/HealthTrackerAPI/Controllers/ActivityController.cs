using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Activity")]
public class ActivityController : ControllerBase
{
    private readonly HealthDatabase _db;
    public ActivityController(HealthDatabase db) => _db = db;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats() => Ok(await _db.GetActivityStatsAsync());

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly() => Ok(await _db.GetActivityMonthlyHistoryAsync());

    [HttpGet("yoy/{month}")]
    public async Task<IActionResult> GetYoY(int month) => 
        (month < 1 || month > 12) ? BadRequest("Invalid month") : Ok(await _db.GetActivityYearOverYearAsync(month));

    [HttpGet("annual")]
    public async Task<IActionResult> GetAnnual() => Ok(await _db.GetActivityAnnualSummaryAsync());

    [HttpGet("totals")]
    public async Task<IActionResult> GetTotals() => Ok(await _db.GetActivityYearlyTotalsAsync());

    [HttpGet("date/{date}")]
    public async Task<IActionResult> GetByDate(string date)
    {
        var entry = await _db.GetStepsByDateAsync(date);
        return entry == null ? NotFound() : Ok(entry);
    }

    [HttpPost]
    public async Task<IActionResult> AddSteps([FromBody] AddStepsRequest req)
    {
        if (req.StepCount <= 0) return BadRequest("Steps must be positive");
        var entry = await _db.AddStepsAsync(req);
        return Created($"/api/activity/{entry.DataUuid}", entry);
    }

    [HttpPut("date/{existingUuid}")]
    public async Task<IActionResult> ReplaceSteps(string existingUuid, [FromBody] AddStepsRequest req)
    {
        if (req.StepCount <= 0) return BadRequest("Steps must be positive");
        return Ok(await _db.ReplaceStepsAsync(existingUuid, req));
    }
}