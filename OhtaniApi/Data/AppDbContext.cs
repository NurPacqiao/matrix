using Microsoft.EntityFrameworkCore;
using OhtaniApi.Models;

namespace OhtaniApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<DailyLog> DailyLogs => Set<DailyLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.GoogleId).IsUnique();

        modelBuilder.Entity<DailyLog>(log =>
        {
            // One log per user per day. Also serves every lookup the API makes.
            log.HasIndex(d => new { d.UserId, d.Date }).IsUnique();
            log.HasOne<User>().WithMany().HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
