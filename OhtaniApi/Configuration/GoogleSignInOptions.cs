using System.ComponentModel.DataAnnotations;

namespace OhtaniApi.Configuration;

public sealed class GoogleSignInOptions
{
    public const string SectionName = "Authentication";

    [Required] public string GoogleClientId { get; init; } = string.Empty;

    /// <summary>
    /// The only Google accounts that may sign in. When empty, accounts already in the
    /// database keep working but nobody new can register.
    /// </summary>
    public string[] AllowedEmails { get; init; } = [];
}
