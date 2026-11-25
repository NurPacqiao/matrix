using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OhtaniApi.Configuration;
using OhtaniApi.Contracts;
using OhtaniApi.Models;
using OhtaniApi.Services;

namespace OhtaniApi.Tests;

public sealed class AuthTests
{
    private static Task<HttpResponseMessage> LoginAsync(ApiFactory api, string token) =>
        api.CreateClient().PostAsJsonAsync("/api/auth/login", new { token });

    [Fact]
    public async Task Owner_can_sign_in_and_is_registered_once()
    {
        using var api = new ApiFactory();

        await api.SignedInClientAsync();
        await api.SignedInClientAsync(ApiFactory.OwnerEmail);

        await api.WithDbAsync(async db => Assert.Equal(1, await db.Users.CountAsync()));
    }

    [Fact]
    public async Task Other_google_accounts_are_refused_and_not_stored()
    {
        using var api = new ApiFactory();

        var response = await LoginAsync(api, "stranger@example.com");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        await api.WithDbAsync(async db => Assert.Equal(0, await db.Users.CountAsync()));
    }

    [Fact]
    public async Task Allow_list_also_locks_out_accounts_that_registered_before_it_existed()
    {
        using var api = new ApiFactory();
        await api.AddUserAsync("stranger@example.com");

        Assert.Equal(HttpStatusCode.Forbidden, (await LoginAsync(api, "stranger@example.com")).StatusCode);
    }

    [Fact]
    public async Task Unverified_email_is_refused()
    {
        using var api = new ApiFactory();
        api.Google.EmailVerified = false;

        Assert.Equal(HttpStatusCode.Forbidden, (await LoginAsync(api, ApiFactory.OwnerEmail)).StatusCode);
    }

    [Fact]
    public async Task Without_an_allow_list_only_existing_accounts_get_in()
    {
        using var api = new ApiFactory { AllowedEmails = [] };
        await api.AddUserAsync(ApiFactory.OwnerEmail);

        Assert.Equal(HttpStatusCode.OK, (await LoginAsync(api, ApiFactory.OwnerEmail)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await LoginAsync(api, "stranger@example.com")).StatusCode);
    }

    [Theory]
    [InlineData("invalid", HttpStatusCode.Unauthorized)]
    [InlineData("", HttpStatusCode.BadRequest)]
    public async Task Bad_tokens_are_rejected(string token, HttpStatusCode expected)
    {
        using var api = new ApiFactory();

        Assert.Equal(expected, (await LoginAsync(api, token)).StatusCode);
    }

    [Theory]
    [InlineData("garbage")]
    [InlineData("a.b.c")]
    [InlineData("YWJj.YWJj.YWJj")]
    [InlineData("eyJhbGciOiJub25lIn0.e30.")]
    public async Task Real_verifier_returns_null_for_malformed_tokens(string token)
    {
        var verifier = new GoogleTokenVerifier(Options.Create(new GoogleSignInOptions { GoogleClientId = "x" }));

        Assert.Null(await verifier.VerifyAsync(token));
    }

    [Theory]
    [InlineData("/api/tasks")]
    [InlineData("/api/tasks/history")]
    [InlineData("/api/matrix")]
    public async Task Data_endpoints_need_a_token(string path)
    {
        using var api = new ApiFactory();

        Assert.Equal(HttpStatusCode.Unauthorized, (await api.CreateClient().GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task Tokens_signed_with_another_key_are_rejected()
    {
        using var api = new ApiFactory();
        var forged = new TokenService(
            Options.Create(new JwtOptions
            {
                Issuer = "test-issuer",
                Audience = "test-audience",
                Key = "some-other-key-that-is-also-32-bytes-long",
            }),
            api.Services.GetRequiredService<TimeProvider>()).CreateToken(new User { Id = 1, Email = ApiFactory.OwnerEmail });
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", forged);

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/tasks")).StatusCode);
    }

    [Fact]
    public async Task Health_check_is_public()
    {
        using var api = new ApiFactory();

        Assert.Equal(HttpStatusCode.OK, (await api.CreateClient().GetAsync("/")).StatusCode);
    }

    [Fact]
    public async Task Login_is_rate_limited()
    {
        using var api = new ApiFactory();
        var client = api.CreateClient();

        var last = HttpStatusCode.OK;
        for (var i = 0; i < 31; i++)
            last = (await client.PostAsJsonAsync("/api/auth/login", new LoginRequest { Token = "invalid" })).StatusCode;

        Assert.Equal(HttpStatusCode.TooManyRequests, last);
    }
}
