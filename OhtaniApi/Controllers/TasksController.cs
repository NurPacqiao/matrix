using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OhtaniApi.Data;    // Finds AppDbContext
using OhtaniApi.Models;  // Finds DailyLog and User
using System.Security.Claims;
using System.Text.Json;

namespace OhtaniApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        // camelCase keys so stored JSON looks like { "text": ..., "isCompleted": ... }
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTodayTasks()
        {
            // 1. Identify the user from their Google token
            var user = await GetCurrentUserAsync();

            if (user == null) return Unauthorized();

            // 2. Find their daily log for today
            var todayLog = await _context.DailyLogs
                .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Date.Date == DateTime.UtcNow.Date);

            // 3. Unpack the stored JSON into task objects (empty lists if none exists today)
            return Ok(new TasksResponse
            {
                LockedTasks = ParseTasks(todayLog?.LockedTasksJson),
                CustomTasks = ParseTasks(todayLog?.CustomTasksJson),
            });
        }

        [HttpPost]
        public async Task<IActionResult> SaveTodayTasks([FromBody] TasksRequest request)
        {
            var user = await GetCurrentUserAsync();

            if (user == null) return Unauthorized();

            var lockedTasksJson = JsonSerializer.Serialize(request.LockedTasks, JsonOptions);
            var customTasksJson = JsonSerializer.Serialize(request.CustomTasks, JsonOptions);

            var existingLog = await _context.DailyLogs
                .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Date.Date == DateTime.UtcNow.Date);

            if (existingLog != null)
            {
                // 4a. If a clipboard for today already exists, just erase and rewrite the tasks on it
                existingLog.LockedTasksJson = lockedTasksJson;
                existingLog.CustomTasksJson = customTasksJson;
            }
            else
            {
                // 4b. If no clipboard exists for today, create a new one
                _context.DailyLogs.Add(new DailyLog
                {
                    UserId = user.Id,
                    Date = DateTime.UtcNow,
                    LockedTasksJson = lockedTasksJson,
                    CustomTasksJson = customTasksJson,
                });
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        // Returns the last N days of logs (oldest first) for stats and the daily picker
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int days = 14)
        {
            var user = await GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            days = Math.Clamp(days, 1, 400);
            var since = DateTime.UtcNow.Date.AddDays(-(days - 1));

            var logs = await _context.DailyLogs
                .Where(d => d.UserId == user.Id && d.Date >= since)
                .OrderBy(d => d.Date)
                .ToListAsync();

            return Ok(logs.Select(l => new DayLogResponse
            {
                Date = l.Date.ToString("yyyy-MM-dd"),
                LockedTasks = ParseTasks(l.LockedTasksJson),
                CustomTasks = ParseTasks(l.CustomTasksJson),
            }));
        }

        // Reads both the new object format and older logs saved as plain string arrays
        private static List<TaskItem> ParseTasks(string? json)
        {
            var tasks = new List<TaskItem>();
            if (string.IsNullOrWhiteSpace(json)) return tasks;

            try
            {
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind != JsonValueKind.Array) return tasks;

                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    if (element.ValueKind == JsonValueKind.String)
                    {
                        tasks.Add(new TaskItem { Text = element.GetString() ?? string.Empty });
                    }
                    else if (element.ValueKind == JsonValueKind.Object)
                    {
                        var task = element.Deserialize<TaskItem>(JsonOptions);
                        if (task != null) tasks.Add(task);
                    }
                }
            }
            catch (JsonException)
            {
                // Corrupt data shouldn't break the page; treat it as no tasks
            }

            return tasks;
        }

        // The JWT from AuthController stores our database User.Id (not the Google id) in NameIdentifier
        private async Task<User?> GetCurrentUserAsync()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idClaim, out var userId)) return null;
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }
    }

    // A single to-do item
    public class TaskItem
    {
        public string Text { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        // Set on daily plan tasks: which matrix item (1-64) and direction (1-8) it came from
        public int? MatrixId { get; set; }
        public int? DirectionId { get; set; }
        // Set on the daily plan: which progression track (e.g. "thesis") and which step of it
        public string? TrackId { get; set; }
        public int? Step { get; set; }
        // Set on the daily plan: Pomodoros the task is worth, and for counted tasks (pages,
        // applications) the day's target and the amount actually logged
        public int? Pomos { get; set; }
        public int? Target { get; set; }
        public int? Amount { get; set; }
    }

    // Small helper boxes for the JSON going to and from React
    public class TasksRequest
    {
        public List<TaskItem> LockedTasks { get; set; } = new();
        public List<TaskItem> CustomTasks { get; set; } = new();
    }

    public class DayLogResponse
    {
        public string Date { get; set; } = string.Empty;
        public List<TaskItem> LockedTasks { get; set; } = new();
        public List<TaskItem> CustomTasks { get; set; } = new();
    }

    public class TasksResponse
    {
        public List<TaskItem> LockedTasks { get; set; } = new();
        public List<TaskItem> CustomTasks { get; set; } = new();
    }
}
