namespace KoperasiQu.API.Domain.Entities;

public class Installment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid LoanId { get; set; }
    public int InstallmentNumber { get; set; }
    public DateTime DueDate { get; set; }
    public decimal AmountToPay { get; set; }
    public decimal? AmountPaid { get; set; }
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAt { get; set; }
    public string? PaymentNote { get; set; }
    
    // Fitur V2
    public decimal PenaltyAmount { get; set; } = 0;
    public string? ReceiptUrl { get; set; }
    public bool IsVerified { get; set; } = false; // Jika true, struk dianggap sah


    // Navigation Properties
    public Loan Loan { get; set; } = null!;
}
