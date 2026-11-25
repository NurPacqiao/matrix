namespace OhtaniApi.Services;

public sealed record GoogleIdentity(string Subject, string Email, bool EmailVerified);

public interface IGoogleTokenVerifier
{
    /// <summary>The identity behind a Google ID token, or null when the token isn't valid for this app.</summary>
    Task<GoogleIdentity?> VerifyAsync(string idToken);
}
