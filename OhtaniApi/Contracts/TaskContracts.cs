using System.ComponentModel.DataAnnotations;

namespace OhtaniApi.Contracts;

/// <summary>A single to-do item, as stored in the daily log and sent to the client.</summary>
public sealed record TaskItem
{
    [MaxLength(2_000)] public string Text { get; init; } = string.Empty;
    public bool IsCompleted { get; init; }

    // Daily plan tasks: which matrix item (1-64) and direction (1-8) it came from
    public int? MatrixId { get; init; }
    public int? DirectionId { get; init; }

    // Daily plan tasks: which progression track (e.g. "thesis") and which step of it
    [MaxLength(50)] public string? TrackId { get; init; }
    public int? Step { get; init; }

    // Daily plan tasks: Pomodoros the task is worth, and for counted tasks (pages,
    // applications) the day's target and the amount actually logged
    public int? Pomos { get; init; }
    public int? Target { get; init; }
    public int? Amount { get; init; }
}

public sealed record SaveTasksRequest
{
    /// <summary>The user's local day. Older clients leave it out and get the UTC day.</summary>
    public DateOnly? Date { get; init; }

    [MaxLength(200)] public List<TaskItem> LockedTasks { get; init; } = [];
    [MaxLength(200)] public List<TaskItem> CustomTasks { get; init; } = [];
}

public sealed record TasksResponse(List<TaskItem> LockedTasks, List<TaskItem> CustomTasks);

public sealed record DayLogResponse(string Date, List<TaskItem> LockedTasks, List<TaskItem> CustomTasks);
