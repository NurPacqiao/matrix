using System.Security.Claims;

namespace OhtaniApi.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Our own User.Id. Every token we issue carries it, and only we can sign one.</summary>
    public static int GetUserId(this ClaimsPrincipal principal) =>
        int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new InvalidOperationException("The token has no usable user id.");
}
