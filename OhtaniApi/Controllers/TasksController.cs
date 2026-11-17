using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OhtaniApi.Data;    // Finds AppDbContext
using OhtaniApi.Models;  // Finds DailyLog and User
using System.Security.Claims;

namespace OhtaniApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTodayTasks()
        {
            // 1. Identify the user from their Google token
            var googleId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
            
            if (user == null) return Unauthorized();

            // 2. Find their daily log for today
            var todayLog = await _context.DailyLogs
                .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Date.Date == DateTime.UtcNow.Date);
                
            return Ok(todayLog ?? new DailyLog()); // Return empty log if none exists today
        }

        [HttpPost]
        public async Task<IActionResult> SaveTodayTasks([FromBody] DailyLog incomingLog)
        {
            var googleId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
            
            if (user == null) return Unauthorized();

            var existingLog = await _context.DailyLogs
                .FirstOrDefaultAsync(d => d.UserId == user.Id && d.Date.Date == DateTime.UtcNow.Date);

            if (existingLog != null)
            {
                // 3a. If a clipboard for today already exists, just erase and rewrite the tasks on it
                existingLog.LockedTasksJson = incomingLog.LockedTasksJson;
                existingLog.CustomTasksJson = incomingLog.CustomTasksJson;
            }
            else
            {
                // 3b. If no clipboard exists for today, create a new one
                incomingLog.UserId = user.Id;
                incomingLog.Date = DateTime.UtcNow;
                _context.DailyLogs.Add(incomingLog);
            }
            
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}