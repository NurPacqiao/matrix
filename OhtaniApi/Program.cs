using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OhtaniApi.Configuration;
using OhtaniApi.Controllers;
using OhtaniApi.Data;
using OhtaniApi.Services;

const string CorsPolicy = "Frontend";

var builder = WebApplication.CreateBuilder(args);

// Matrix and task lists are a few KB; the 30 MB default only helps an attacker
builder.WebHost.ConfigureKestrel(kestrel => kestrel.Limits.MaxRequestBodySize = 1024 * 1024);

// ---- Configuration: fail at startup instead of on the first request ----
builder.Services.AddOptions<JwtOptions>()
    .BindConfiguration(JwtOptions.SectionName)
    .ValidateDataAnnotations()
    .Validate(o => o.HasStrongKey(), $"Jwt:Key must be at least {JwtOptions.MinKeyBytes} bytes.")
    .ValidateOnStart();
builder.Services.AddOptions<GoogleSignInOptions>()
    .BindConfiguration(GoogleSignInOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ---- Data ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---- Application services ----
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IGoogleTokenVerifier, GoogleTokenVerifier>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DailyLogService>();
builder.Services.AddScoped<MatrixService>();

// ---- Security ----
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((bearer, jwt) =>
    {
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Value.Issuer,
            ValidAudience = jwt.Value.Audience,
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            IssuerSigningKey = jwt.Value.CreateSigningKey(),
        };
    });

// Every endpoint needs a signed-in user unless it explicitly opts out
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.AddRateLimiter(limiter =>
{
    limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    limiter.AddFixedWindowLimiter(AuthController.LoginRateLimit, window =>
    {
        window.PermitLimit = 30;
        window.Window = TimeSpan.FromMinutes(1);
    });
});

builder.Services.AddCors(cors => cors.AddPolicy(CorsPolicy, policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"])
    .WithHeaders("Authorization", "Content-Type")
    .WithMethods("GET", "POST")));

builder.Services.AddProblemDetails();
builder.Services.AddControllers();

var app = builder.Build();

app.UseExceptionHandler(new ExceptionHandlerOptions
{
    // Keep e.g. 413 for an oversized body instead of reporting a server error
    StatusCodeSelector = e => e is BadHttpRequestException bad ? bad.StatusCode : StatusCodes.Status500InternalServerError,
});
app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

// Lets the host (and you) check the API is up without signing in
app.MapMethods("/", ["GET", "HEAD"], () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.Run();

// Visible to the integration tests
public partial class Program;
