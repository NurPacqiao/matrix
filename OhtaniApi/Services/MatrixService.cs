using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OhtaniApi.Data;

namespace OhtaniApi.Services;

public sealed class MatrixService(AppDbContext db)
{
    public Task<string?> GetAsync(int userId, CancellationToken ct = default) =>
        db.Users.Where(u => u.Id == userId).Select(u => (string?)u.MatrixJson).FirstOrDefaultAsync(ct);

    /// <summary>False when the user no longer exists.</summary>
    public async Task<bool> SaveAsync(int userId, string matrixJson, CancellationToken ct = default)
    {
        var updated = await db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(set => set.SetProperty(u => u.MatrixJson, matrixJson), ct);
        return updated > 0;
    }

    /// <summary>The client always sends an object. Anything else would wipe the grid.</summary>
    public static bool IsValid(string matrixJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(matrixJson);
            return doc.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
