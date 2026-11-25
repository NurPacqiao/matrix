using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using OhtaniApi.Contracts;
using OhtaniApi.Data;
using OhtaniApi.Models;
using OhtaniApi.Services;

namespace OhtaniApi.Tests;

/// <summary>The real API with an in-memory SQLite database, a fixed clock and a fake Google.</summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string OwnerEmail = "owner@example.com";
    public static readonly DateTimeOffset Now = new(2026, 11, 23, 23, 30, 0, TimeSpan.Zero); // 00:30 on the 24th in Warsaw

    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public string[] AllowedEmails { get; init; } = [OwnerEmail];
    public FakeGoogle Google { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Issuer", "test-issuer");
        builder.UseSetting("Jwt:Audience", "test-audience");
        builder.UseSetting("Jwt:Key", "test-only-signing-key-at-least-32-bytes");
        builder.UseSetting("Authentication:GoogleClientId", "test-client");
        for (var i = 0; i < AllowedEmails.Length; i++)
            builder.UseSetting($"Authentication:AllowedEmails:{i}", AllowedEmails[i]);

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
            services.Replace(ServiceDescriptor.Singleton<IGoogleTokenVerifier>(Google));
            services.Replace(ServiceDescriptor.Singleton<TimeProvider>(new FixedClock()));
            // Tokens are issued at the fixed time, so check their lifetime against it too
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
                o.TokenValidationParameters.LifetimeValidator = (notBefore, expires, _, _) =>
                    notBefore <= Now.UtcDateTime && expires > Now.UtcDateTime);
        });
    }

    protected override Microsoft.Extensions.Hosting.IHost CreateHost(Microsoft.Extensions.Hosting.IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        return host;
    }

    public async Task<HttpClient> SignedInClientAsync(string email = OwnerEmail)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Token = email });
        response.EnsureSuccessStatusCode();
        var login = await response.Content.ReadFromJsonAsync<LoginResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login!.Token);
        return client;
    }

    public async Task WithDbAsync(Func<AppDbContext, Task> action)
    {
        using var scope = Services.CreateScope();
        await action(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public Task AddUserAsync(string email) => WithDbAsync(async db =>
    {
        db.Users.Add(new User { Email = email, GoogleId = FakeGoogle.SubjectFor(email) });
        await db.SaveChangesAsync();
    });

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }

    private sealed class FixedClock : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => Now;
    }
}

/// <summary>Treats the token as the email address. "invalid" is rejected like a bad Google token.</summary>
public sealed class FakeGoogle : IGoogleTokenVerifier
{
    public bool EmailVerified { get; set; } = true;

    public static string SubjectFor(string email) => $"google-{email}";

    public Task<GoogleIdentity?> VerifyAsync(string idToken) =>
        Task.FromResult(idToken == "invalid" ? null : new GoogleIdentity(SubjectFor(idToken), idToken, EmailVerified));
}
