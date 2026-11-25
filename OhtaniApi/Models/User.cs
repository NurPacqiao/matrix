namespace OhtaniApi.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string GoogleId { get; set; } = string.Empty; // Google's stable account id
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string MatrixJson { get; set; } = "[]";
}
