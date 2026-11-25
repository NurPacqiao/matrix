using System.Text.Json;
using OhtaniApi.Contracts;

namespace OhtaniApi.Services;

/// <summary>Reads and writes the task lists stored as JSON text in the daily log.</summary>
public static class TaskJson
{
    // camelCase keys so stored JSON looks like { "text": ..., "isCompleted": ... }
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(List<TaskItem> tasks) => JsonSerializer.Serialize(tasks, Options);

    // Reads both the object format and older logs saved as plain string arrays
    public static List<TaskItem> Parse(string? json)
    {
        var tasks = new List<TaskItem>();
        if (string.IsNullOrWhiteSpace(json)) return tasks;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return tasks;

            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var task = element.ValueKind switch
                {
                    JsonValueKind.String => new TaskItem { Text = element.GetString() ?? string.Empty },
                    JsonValueKind.Object => element.Deserialize<TaskItem>(Options),
                    _ => null,
                };
                if (task is not null) tasks.Add(task);
            }
        }
        catch (JsonException)
        {
            // Corrupt data shouldn't break the page; show what could be read
        }

        return tasks;
    }
}
