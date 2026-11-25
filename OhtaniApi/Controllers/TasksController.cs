using Microsoft.AspNetCore.Mvc;
using OhtaniApi.Contracts;
using OhtaniApi.Extensions;
using OhtaniApi.Services;

namespace OhtaniApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class TasksController(DailyLogService logs) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TasksResponse>> Get([FromQuery] DateOnly? date, CancellationToken ct) =>
        logs.ResolveDay(date) is { } day ? await logs.GetAsync(User.GetUserId(), day, ct) : DayOutOfRange();

    [HttpPost]
    public async Task<IActionResult> Save(SaveTasksRequest request, CancellationToken ct)
    {
        if (logs.ResolveDay(request.Date) is not { } day) return DayOutOfRange();

        await logs.SaveAsync(User.GetUserId(), day, request, ct);
        return Ok();
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<DayLogResponse>>> History([FromQuery] int days = 14, CancellationToken ct = default) =>
        await logs.GetHistoryAsync(User.GetUserId(), days, ct);

    private ActionResult DayOutOfRange()
    {
        ModelState.AddModelError("date", "Must be within a day of today.");
        return ValidationProblem();
    }
}
