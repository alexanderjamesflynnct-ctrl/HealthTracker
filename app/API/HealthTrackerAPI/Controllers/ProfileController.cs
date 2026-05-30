using HealthTrackerAPI.Data;
using HealthTrackerAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/profile")]
[Tags("Profile")]
public class ProfileController : ControllerBase {
    private readonly HealthDatabase _db;
    public ProfileController(HealthDatabase db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get() {
        var p = await _db.GetProfileAsync();
        return p == null ? NotFound() : Ok(p);
    }

    [HttpPut]
    public async Task<IActionResult> Upsert([FromBody] UpsertProfileRequest req) {
        if (string.IsNullOrWhiteSpace(req.FirstName) || req.HeightCm <= 0) return BadRequest("Invalid profile data");
        return Ok(await _db.UpsertProfileAsync(req));
    }
}