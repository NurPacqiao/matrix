using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using OhtaniApi.Configuration;
using OhtaniApi.Models;

namespace OhtaniApi.Services;

public sealed class TokenService(IOptions<JwtOptions> options, TimeProvider clock)
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromDays(7);

    public string CreateToken(User user)
    {
        var jwt = options.Value;
        var now = clock.GetUtcNow().UtcDateTime;

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
            ]),
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            IssuedAt = now,
            NotBefore = now,
            Expires = now + Lifetime,
            SigningCredentials = new SigningCredentials(jwt.CreateSigningKey(), SecurityAlgorithms.HmacSha256),
        });
    }
}
