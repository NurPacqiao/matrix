using Microsoft.EntityFrameworkCore;
using OhtaniApi.Models; // We will create this next

namespace OhtaniApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // These represent the actual tables in your Neon database
        public DbSet<User> Users { get; set; }
        public DbSet<DailyLog> DailyLogs { get; set; }
    }
}