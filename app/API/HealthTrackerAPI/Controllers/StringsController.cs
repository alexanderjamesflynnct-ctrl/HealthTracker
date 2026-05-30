using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Strings")]
public class StringsController : ControllerBase
{
    private readonly HealthDatabase _db;
    public StringsController(HealthDatabase db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string lang = "en") => Ok(await _db.GetAllStringsAsync(lang));

    [HttpGet("audit")]
    public async Task<IActionResult> GetAudit() => Ok(await _db.GetStringAuditLogAsync());

    [HttpPut("{page}/{uniqueId}")]
    public async Task<IActionResult> Upsert(string page, string uniqueId, [FromBody] UpsertStringRequest req, [FromQuery] string lang = "en")
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        await _db.UpsertStringAsync(page, uniqueId, req.Value, lang, ip);
        return Ok(new { page, uniqueId, lang, value = req.Value });
    }
}