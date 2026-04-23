namespace KoperasiQu.API.Domain.Entities;

/// <summary>
/// Administrator sistem. Dipisah dari Member karena bounded context berbeda.
/// </summary>
public class AdminUser
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public KoperasiQu.API.Domain.Enums.AdminRole Role { get; set; } = KoperasiQu.API.Domain.Enums.AdminRole.Staff;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
}
