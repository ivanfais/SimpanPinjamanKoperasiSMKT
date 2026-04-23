using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KoperasiQu.API.Domain.Entities;

public class LoanAuditLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid LoanId { get; set; }

    /// <summary>
    /// Admin yang melakukan action, null jika sistem otomatis
    /// </summary>
    public Guid? AdminId { get; set; }

    /// <summary>
    /// Tindakan yang dilakukan: Applied, Approved, Rejected, Verified
    /// </summary>
    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Loan Loan { get; set; } = null!;
}
