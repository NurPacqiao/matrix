using System.ComponentModel.DataAnnotations;

namespace OhtaniApi.Contracts;

public sealed record MatrixRequest
{
    // The real matrix is around 15 KB; this only stops runaway payloads
    [Required, MaxLength(200_000)] public string MatrixJson { get; init; } = string.Empty;
}

public sealed record MatrixResponse(string MatrixJson);
