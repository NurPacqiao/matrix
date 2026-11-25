using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OhtaniApi.Contracts;
using OhtaniApi.Services;

namespace OhtaniApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public sealed class AuthController(AuthService auth) : ControllerBase
{
    public const string LoginRateLimit = "login";

    [HttpPost("login")]
    [EnableRateLimiting(LoginRateLimit)]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request.Token, ct);
        return result.Status switch
        {
            LoginStatus.Success => new LoginResponse(result.Token!),
            LoginStatus.NotAllowed => Problem("This account can't use this app.", statusCode: StatusCodes.Status403Forbidden),
            _ => Problem("Invalid Google token.", statusCode: StatusCodes.Status401Unauthorized),
        };
    }
}
