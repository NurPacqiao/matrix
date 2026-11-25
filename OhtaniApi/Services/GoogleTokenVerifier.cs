using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using OhtaniApi.Configuration;

namespace OhtaniApi.Services;

public sealed class GoogleTokenVerifier(IOptions<GoogleSignInOptions> options) : IGoogleTokenVerifier
{
    public async Task<GoogleIdentity?> VerifyAsync(string idToken)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [options.Value.GoogleClientId],
            });
            return new GoogleIdentity(payload.Subject, payload.Email, payload.EmailVerified);
        }
        // Malformed tokens don't all surface as InvalidJwtException: bad base64 and bad JSON leak through
        catch (Exception e) when (e is InvalidJwtException or FormatException or JsonException)
        {
            return null;
        }
    }
}
