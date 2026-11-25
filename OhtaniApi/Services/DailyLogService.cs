using Microsoft.EntityFrameworkCore;
using OhtaniApi.Contracts;
using OhtaniApi.Data;
using OhtaniApi.Models;

namespace OhtaniApi.Services;

public sealed class DailyLogService(AppDbContext db, TimeProvider clock)
{
    public const int MaxHistoryDays = 400;

    private DateOnly UtcToday => DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);

    /// <summary>
    /// The day to work on, or null when it isn't plausible. Every time zone is within a day
    /// of UTC, so anything further out is a client bug and must not touch older logs.
    /// </summary>
    public DateOnly? ResolveDay(DateOnly? requested)
    {
        if (requested is not { } day) return UtcToday;
        return Math.Abs(day.DayNumber - UtcToday.DayNumber) <= 1 ? day : null;
    }

    public async Task<TasksResponse> GetAsync(int userId, DateOnly day, CancellationToken ct = default)
    {
        var log = await LogsFor(userId, day).AsNoTracking().FirstOrDefaultAsync(ct);
        return new TasksResponse(TaskJson.Parse(log?.LockedTasksJson), TaskJson.Parse(log?.CustomTasksJson));
    }

    public async Task SaveAsync(int userId, DateOnly day, SaveTasksRequest request, CancellationToken ct = default)
    {
        var lockedJson = TaskJson.Serialize(request.LockedTasks);
        var customJson = TaskJson.Serialize(request.CustomTasks);

        if (await TryUpdateAsync(userId, day, lockedJson, customJson, ct)) return;

        db.DailyLogs.Add(new DailyLog
        {
            UserId = userId,
            Date = StartOf(day),
            LockedTasksJson = lockedJson,
            CustomTasksJson = customJson,
        });
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Another request created today's log first (unique index); update that one instead
            db.ChangeTracker.Clear();
            if (!await TryUpdateAsync(userId, day, lockedJson, customJson, ct)) throw;
        }
    }

    /// <summary>The last <paramref name="days"/> days of logs, oldest first.</summary>
    public async Task<List<DayLogResponse>> GetHistoryAsync(int userId, int days, CancellationToken ct = default)
    {
        var since = StartOf(UtcToday.AddDays(-(Math.Clamp(days, 1, MaxHistoryDays) - 1)));

        var logs = await db.DailyLogs
            .AsNoTracking()
            .Where(d => d.UserId == userId && d.Date >= since)
            .OrderBy(d => d.Date)
            .ToListAsync(ct);

        return logs.ConvertAll(log => new DayLogResponse(
            log.Date.ToString("yyyy-MM-dd"),
            TaskJson.Parse(log.LockedTasksJson),
            TaskJson.Parse(log.CustomTasksJson)));
    }

    private async Task<bool> TryUpdateAsync(int userId, DateOnly day, string lockedJson, string customJson, CancellationToken ct)
    {
        var log = await LogsFor(userId, day).FirstOrDefaultAsync(ct);
        if (log is null) return false;

        log.LockedTasksJson = lockedJson;
        log.CustomTasksJson = customJson;
        await db.SaveChangesAsync(ct);
        return true;
    }

    // A range rather than an exact match: logs from before the migration carry a time of day
    private IQueryable<DailyLog> LogsFor(int userId, DateOnly day)
    {
        var start = StartOf(day);
        var end = start.AddDays(1);
        return db.DailyLogs
            .Where(d => d.UserId == userId && d.Date >= start && d.Date < end)
            .OrderBy(d => d.Id);
    }

    private static DateTime StartOf(DateOnly day) => day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
}
