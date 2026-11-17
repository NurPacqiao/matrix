using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OhtaniApi.Data;
using OhtaniApi.Models;
using System.Security.Claims;

namespace OhtaniApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MatrixController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MatrixController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMatrix()
        {
            // 1. Find the user based on their Google Token
            var googleId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
            
            if (user == null) return Unauthorized();

            // 2. Return their saved Matrix string (or empty brackets if null)
            return Ok(new { matrixJson = user.MatrixJson ?? "[]" });
        }

        [HttpPost]
        public async Task<IActionResult> SaveMatrix([FromBody] MatrixRequest request)
        {
            // 1. Find the user
            var googleId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId);
            
            if (user == null) return Unauthorized();

            // 2. Update their Matrix compartment and save to database
            user.MatrixJson = request.MatrixJson;
            await _context.SaveChangesAsync();
            
            return Ok();
        }
    }

    // A small helper box to catch the incoming JSON string from React
    public class MatrixRequest
    {
        public string MatrixJson { get; set; } = string.Empty;
    }
}