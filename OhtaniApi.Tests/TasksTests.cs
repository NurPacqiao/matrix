using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using OhtaniApi.Contracts;
using OhtaniApi.Models;

namespace OhtaniApi.Tests;

public sealed class TasksTests
{
    private static object Body(string? date, params string[] locked) => new
    {
        date,
        lockedTasks = locked.Select(text => new { text, isCompleted = true, amount = 5 }),
        customTasks = Array.Empty<object>(),
    };

    private static async Task<string[]> LockedAsync(HttpClient client, string query = "") =>
        [.. (await client.GetFromJsonAsync<TasksResponse>($"/api/tasks{query}"))!.LockedTasks.Select(t => t.Text)];

    [Fact]
    public async Task Just_after_local_midnight_the_new_day_does_not_overwrite_the_old_one()
    {
        using var api = new ApiFactory(); // 23:30 UTC on the 23rd = 00:30 on the 24th in Warsaw
        var client = await api.SignedInClientAsync();
        await client.PostAsJsonAsync("/api/tasks", Body("2026-11-23", "monday"));

        Assert.Empty(await LockedAsync(client, "?date=2026-11-24"));
        await client.PostAsJsonAsync("/api/tasks", Body("2026-11-24", "tuesday"));

        Assert.Equal(["monday"], await LockedAsync(client, "?date=2026-11-23"));
        Assert.Equal(["tuesday"], await LockedAsync(client, "?date=2026-11-24"));
        var history = await client.GetFromJsonAsync<List<DayLogResponse>>("/api/tasks/history");
        Assert.Equal(["2026-11-23", "2026-11-24"], history!.Select(d => d.Date));
    }

    [Fact]
    public async Task Older_clients_without_a_date_use_the_utc_day()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();

        await client.PostAsJsonAsync("/api/tasks", new { lockedTasks = new[] { new { text = "x" } }, customTasks = Array.Empty<object>() });

        Assert.Equal(["x"], await LockedAsync(client));
        Assert.Equal(["x"], await LockedAsync(client, "?date=2026-11-23"));
    }

    [Theory]
    [InlineData("2026-11-21")]
    [InlineData("2026-11-25")]
    public async Task Days_further_out_than_any_time_zone_are_rejected(string date)
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();

        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/tasks", Body(date, "x"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync($"/api/tasks?date={date}")).StatusCode);
    }

    [Fact]
    public async Task Saving_twice_keeps_one_log_with_the_latest_tasks()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();

        await client.PostAsJsonAsync("/api/tasks", Body("2026-11-23", "first"));
        await client.PostAsJsonAsync("/api/tasks", Body("2026-11-23", "second"));

        Assert.Equal(["second"], await LockedAsync(client));
        await api.WithDbAsync(async db => Assert.Equal(1, await db.DailyLogs.CountAsync()));
    }

    [Fact]
    public async Task Logs_saved_before_the_migration_are_found_and_updated_in_place()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();
        await api.WithDbAsync(async db =>
        {
            var user = await db.Users.SingleAsync();
            db.DailyLogs.Add(new DailyLog
            {
                UserId = user.Id,
                Date = new DateTime(2026, 11, 23, 18, 4, 5, DateTimeKind.Utc),
                LockedTasksJson = """["plain string", { "text": "object", "isCompleted": true }]""",
            });
            await db.SaveChangesAsync();
        });

        Assert.Equal(["plain string", "object"], await LockedAsync(client));
        await client.PostAsJsonAsync("/api/tasks", Body("2026-11-23", "new"));

        await api.WithDbAsync(async db => Assert.Equal(1, await db.DailyLogs.CountAsync()));
    }

    [Fact]
    public async Task Users_only_see_their_own_logs()
    {
        using var api = new ApiFactory { AllowedEmails = [ApiFactory.OwnerEmail, "second@example.com"] };
        var owner = await api.SignedInClientAsync();
        var second = await api.SignedInClientAsync("second@example.com");
        await owner.PostAsJsonAsync("/api/tasks", Body("2026-11-23", "private"));

        Assert.Empty(await LockedAsync(second));
        Assert.Empty((await second.GetFromJsonAsync<List<DayLogResponse>>("/api/tasks/history"))!);
    }

    [Fact]
    public async Task Oversized_or_null_lists_are_rejected()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();

        var tooMany = Body("2026-11-23", [.. Enumerable.Repeat("x", 201)]);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/tasks", tooMany)).StatusCode);

        var tooLong = Body("2026-11-23", new string('x', 2_001));
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/tasks", tooLong)).StatusCode);

        var nulls = new { lockedTasks = (object?)null, customTasks = (object?)null };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/tasks", nulls)).StatusCode);
    }
}
