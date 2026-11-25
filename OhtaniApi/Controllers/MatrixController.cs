using Microsoft.AspNetCore.Mvc;
using OhtaniApi.Contracts;
using OhtaniApi.Extensions;
using OhtaniApi.Services;

namespace OhtaniApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class MatrixController(MatrixService matrix) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<MatrixResponse>> Get(CancellationToken ct)
    {
        var json = await matrix.GetAsync(User.GetUserId(), ct);
        return json is null ? Unauthorized() : new MatrixResponse(json);
    }

    [HttpPost]
    public async Task<IActionResult> Save(MatrixRequest request, CancellationToken ct)
    {
        if (!MatrixService.IsValid(request.MatrixJson))
        {
            ModelState.AddModelError(nameof(request.MatrixJson), "Must be a JSON object.");
            return ValidationProblem();
        }
        return await matrix.SaveAsync(User.GetUserId(), request.MatrixJson, ct) ? Ok() : Unauthorized();
    }
}
