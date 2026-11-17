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
            var user = await GetCurrentUserAsync();
            
            if (user == null) return Unauthorized();

            // 2. Return their saved Matrix string (or empty brackets if null)
            return Ok(new { matrixJson = user.MatrixJson ?? "[]" });
        }

        [HttpPost]
        public async Task<IActionResult> SaveMatrix([FromBody] MatrixRequest request)
        {
            // 1. Find the user
            var user = await GetCurrentUserAsync();
            
            if (user == null) return Unauthorized();

            // 2. Update their Matrix compartment and save to database
            user.MatrixJson = request.MatrixJson;
            await _context.SaveChangesAsync();
            
            return Ok();
        }

        // The JWT from AuthController stores our database User.Id (not the Google id) in NameIdentifier
        private async Task<User?> GetCurrentUserAsync()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idClaim, out var userId)) return null;
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }
    }

    // A small helper box to catch the incoming JSON string from React
    public class MatrixRequest
    {
        public string MatrixJson { get; set; } = string.Empty;
    }
}