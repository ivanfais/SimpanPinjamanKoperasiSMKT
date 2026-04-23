using KoperasiQu.API.Domain.Enums;

namespace KoperasiQu.API.Domain.Entities;

public class Loan
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid MemberId { get; set; }
    public decimal Amount { get; set; }
    public int TenorMonths { get; set; }
    public decimal InterestRatePerMonth { get; set; }
    public decimal TotalInterest { get; set; }
    public decimal TotalAmountDue { get; set; }
    public decimal MonthlyInstallment { get; set; }
    public LoanStatus Status { get; set; } = LoanStatus.Pending;
    public string? Purpose { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? DisbursementDate { get; set; }
    public DateTime AppliedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByAdminId { get; set; }

    // Navigation Properties
    public Member Member { get; set; } = null!;
    public ICollection<Installment> Installments { get; set; } = new List<Installment>();
}
