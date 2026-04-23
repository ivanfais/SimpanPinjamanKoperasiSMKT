namespace KoperasiQu.API.Application.DTOs;

// ════════════════════════════════════════
// AUTH DTOs — Admin
// ════════════════════════════════════════
public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, string Username, string FullName, DateTime ExpiresAt);

// ════════════════════════════════════════
// AUTH DTOs — Member (Mobile App)
// ════════════════════════════════════════
public record MemberLoginRequest(string NationalId, string Pin);
public record MemberLoginResponse(
    string Token,
    Guid MemberId,
    string Name,
    string NationalId,
    string PhoneNumber,
    decimal BaseLimit,
    string Status,
    int CreditScore,
    DateTime ExpiresAt
);
public record ChangePinRequest(string NationalId, string CurrentPin, string NewPin);
public record SetInitialPinRequest(Guid MemberId, string Pin);

// ════════════════════════════════════════
// MEMBER DTOs
// ════════════════════════════════════════
public record CreateMemberRequest(
    string Name,
    string NationalId,
    string Email,
    string PhoneNumber,
    string Address,
    decimal BaseLimit
);

public record UpdateMemberRequest(
    string Name,
    string PhoneNumber,
    string Address,
    decimal BaseLimit,
    string Status
);

public record MemberDto(
    Guid Id,
    string Name,
    string NationalId,
    string Email,
    string PhoneNumber,
    string Address,
    decimal BaseLimit,
    string Status,
    DateTime JoinedAt,
    int TotalLoans,
    bool HasActiveLoan,
    int CreditScore
);

// ════════════════════════════════════════
// LOAN DTOs
// ════════════════════════════════════════
public record ApplyLoanRequest(
    Guid MemberId,
    decimal Amount,
    int TenorMonths,
    string? Purpose
);

public record ApproveLoanRequest(
    Guid LoanId,
    Guid AdminId,
    DateTime DisbursementDate,
    string AdminRole = "Staff" // Default value
);

public record RejectLoanRequest(
    Guid LoanId,
    Guid AdminId,
    string Reason
);

public record LoanSummaryDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    string MemberPhone,
    decimal Amount,
    int TenorMonths,
    decimal InterestRatePerMonth,
    decimal MonthlyInstallment,
    decimal TotalAmountDue,
    string Status,
    string? Purpose,
    DateTime AppliedAt,
    DateTime? DisbursementDate
);

public record LoanDetailDto(
    Guid Id,
    Guid MemberId,
    string MemberName,
    string MemberPhone,
    decimal Amount,
    int TenorMonths,
    decimal InterestRatePerMonth,
    decimal TotalInterest,
    decimal TotalAmountDue,
    decimal MonthlyInstallment,
    string Status,
    string? Purpose,
    string? RejectionReason,
    DateTime AppliedAt,
    DateTime? DisbursementDate,
    DateTime? ReviewedAt,
    IEnumerable<InstallmentDto> Installments,
    IEnumerable<LoanAuditLogDto> AuditLogs
);

public record LoanAuditLogDto(
    Guid Id,
    Guid? AdminId,
    string AdminName,
    string Action,
    string? Notes,
    DateTime CreatedAt
);

// ════════════════════════════════════════
// INSTALLMENT DTOs
// ════════════════════════════════════════
public record InstallmentDto(
    Guid Id,
    Guid LoanId,
    int InstallmentNumber,
    DateTime DueDate,
    decimal AmountToPay,
    decimal? AmountPaid,
    bool IsPaid,
    DateTime? PaidAt,
    bool IsOverdue,
    decimal PenaltyAmount,
    string? ReceiptUrl,
    bool IsVerified
);

public record RecordPaymentRequest(
    Guid InstallmentId,
    decimal AmountPaid,
    string? Note
);

// ════════════════════════════════════════
// DASHBOARD DTOs
// ════════════════════════════════════════
public record DashboardStatsDto(
    int TotalMembers,
    int TotalActiveLoans,
    int TotalPendingLoans,
    decimal TotalLoanAmountActive,
    decimal TotalCollectedThisMonth,
    IEnumerable<LoanSummaryDto> RecentPendingLoans
);
