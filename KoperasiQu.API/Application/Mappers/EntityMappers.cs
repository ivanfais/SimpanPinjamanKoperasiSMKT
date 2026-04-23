using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Domain.Entities;

namespace KoperasiQu.API.Application.Mappers;

public static class LoanMapper
{
    public static LoanSummaryDto ToSummaryDto(this Loan l) => new(
        l.Id, l.MemberId, l.Member.Name, l.Member.PhoneNumber,
        l.Amount, l.TenorMonths, l.InterestRatePerMonth,
        l.MonthlyInstallment, l.TotalAmountDue,
        l.Status.ToString(), l.Purpose, l.AppliedAt, l.DisbursementDate);

    public static LoanDetailDto ToDetailDto(this Loan l, IEnumerable<LoanAuditLog> logs = null) => new(
        l.Id, l.MemberId, l.Member.Name, l.Member.PhoneNumber,
        l.Amount, l.TenorMonths, l.InterestRatePerMonth,
        l.TotalInterest, l.TotalAmountDue, l.MonthlyInstallment,
        l.Status.ToString(), l.Purpose, l.RejectionReason,
        l.AppliedAt, l.DisbursementDate, l.ReviewedAt,
        l.Installments.Select(i => i.ToDto()),
        logs?.Select(log => log.ToDto()) ?? []);

    public static LoanAuditLogDto ToDto(this LoanAuditLog log) => new(
        log.Id, log.AdminId, "Admin", // Admin name will be handled later or simplified
        log.Action, log.Notes, log.CreatedAt);

    public static InstallmentDto ToDto(this Installment i) => new(
        i.Id, i.LoanId, i.InstallmentNumber, i.DueDate,
        i.AmountToPay, i.AmountPaid, i.IsPaid, i.PaidAt,
        !i.IsPaid && i.DueDate < DateTime.UtcNow,
        i.PenaltyAmount, i.ReceiptUrl, i.IsVerified);
}

public static class MemberMapper
{
    public static MemberDto ToDto(this Member m) => new(
        m.Id, m.Name, m.NationalId, m.Email, m.PhoneNumber, m.Address,
        m.BaseLimit, m.Status.ToString(), m.JoinedAt,
        m.Loans.Count,
        m.Loans.Any(l => l.Status == Domain.Enums.LoanStatus.Active),
        m.CreditScore);
}
