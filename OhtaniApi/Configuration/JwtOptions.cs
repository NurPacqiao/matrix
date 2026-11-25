using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace OhtaniApi.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public const int MinKeyBytes = 32; // HS256 needs a 256-bit key

    [Required] public string Issuer { get; init; } = string.Empty;
    [Required] public string Audience { get; init; } = string.Empty;
    [Required] public string Key { get; init; } = string.Empty;

    // One place for the encoding, so signing and validation can never disagree
    public SymmetricSecurityKey CreateSigningKey() => new(Encoding.UTF8.GetBytes(Key));

    public bool HasStrongKey() => Encoding.UTF8.GetByteCount(Key) >= MinKeyBytes;
}
