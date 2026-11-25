using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OhtaniApi.Configuration;
using OhtaniApi.Data;
using OhtaniApi.Models;

namespace OhtaniApi.Services;

public enum LoginStatus
{
    Success,
    InvalidToken,
    NotAllowed,
}

public sealed record LoginResult(LoginStatus Status, string? Token = null);

public sealed class AuthService(
    AppDbContext db,
    IGoogleTokenVerifier google,
    TokenService tokens,
    TimeProvider clock,
    IOptions<GoogleSignInOptions> options,
    ILogger<AuthService> logger)
{
    public async Task<LoginResult> LoginAsync(string idToken, CancellationToken ct = default)
    {
        var identity = await google.VerifyAsync(idToken);
        if (identity is null) return new LoginResult(LoginStatus.InvalidToken);

        var user = await FindUserAsync(identity, ct);
        if (!IsAllowed(identity, alreadyRegistered: user is not null))
        {
            logger.LogWarning("Refused sign-in from a Google account that isn't allowed here");
            return new LoginResult(LoginStatus.NotAllowed);
        }

        user ??= await RegisterAsync(identity, ct);
        return new LoginResult(LoginStatus.Success, tokens.CreateToken(user));
    }

    // This is a personal app: without this check any Google account could sign in
    // and fill the database.
    private bool IsAllowed(GoogleIdentity identity, bool alreadyRegistered)
    {
        var allowed = options.Value.AllowedEmails;
        if (allowed.Length == 0) return alreadyRegistered;

        return identity.EmailVerified
            && allowed.Any(email => string.Equals(email.Trim(), identity.Email, StringComparison.OrdinalIgnoreCase));
    }

    private Task<User?> FindUserAsync(GoogleIdentity identity, CancellationToken ct) =>
        db.Users.AsNoTracking().OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.GoogleId == identity.Subject, ct);

    private async Task<User> RegisterAsync(GoogleIdentity identity, CancellationToken ct)
    {
        var user = new User
        {
            Email = identity.Email,
            GoogleId = identity.Subject,
            CreatedAt = clock.GetUtcNow().UtcDateTime,
        };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
            return user;
        }
        catch (DbUpdateException)
        {
            // A second sign-in at the same moment won the race; use the row it created
            db.ChangeTracker.Clear();
            var existing = await FindUserAsync(identity, ct);
            if (existing is null) throw;
            return existing;
        }
    }
}
