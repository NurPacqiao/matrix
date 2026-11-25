using System.ComponentModel.DataAnnotations;

namespace OhtaniApi.Contracts;

public sealed record LoginRequest
{
    [Required, MaxLength(8_000)] public string Token { get; init; } = string.Empty;
}

public sealed record LoginResponse(string Token);
