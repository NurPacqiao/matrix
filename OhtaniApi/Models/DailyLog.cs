namespace OhtaniApi.Models
{
    public class DailyLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime Date { get; set; }
        public string LockedTasksJson { get; set; } = "[]";
        public string CustomTasksJson { get; set; } = "[]";
    }
}