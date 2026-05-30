using Microsoft.AspNetCore.Mvc;

namespace HealthTrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Tags("Health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    [EndpointSummary("Ping endpoint")]
    public IActionResult GetHealth() => Ok(new { status = "ok" });
}