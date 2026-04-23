using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Enums;

namespace KoperasiQu.API.Domain.Interfaces;

public interface ILoanRepository
{
    Task<Loan?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Loan?> GetByIdWithMemberAsync(Guid id, CancellationToken ct = default);
    Task<Loan?> GetDetailAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Loan>> GetAllAsync(
        LoanStatus? status, 
        DateTime? startDate = null, 
        DateTime? endDate = null, 
        CancellationToken ct = default);
    Task<IEnumerable<Loan>> GetPendingAsync(CancellationToken ct = default);
    Task<IEnumerable<Loan>> GetByMemberAsync(Guid memberId, CancellationToken ct = default);
    Task<bool> HasActiveLoanAsync(Guid memberId, CancellationToken ct = default);
    Task AddAsync(Loan loan, CancellationToken ct = default);

    // Stats
    Task<int> CountByStatusAsync(LoanStatus status, CancellationToken ct = default);
    Task<decimal> SumAmountByStatusAsync(LoanStatus status, CancellationToken ct = default);
}

public interface IInstallmentRepository
{
    Task<Installment?> GetByIdWithLoanAsync(Guid id, CancellationToken ct = default);
    Task<decimal> SumCollectedSinceAsync(DateTime since, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<Installment> installments, CancellationToken ct = default);
}

public interface IMemberRepository
{
    Task<IEnumerable<Member>> GetAllAsync(CancellationToken ct = default);
    Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Member?> GetByIdWithLoansAsync(Guid id, CancellationToken ct = default);
    Task<Member?> GetByNationalIdAsync(string nationalId, CancellationToken ct = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task<bool> NationalIdExistsAsync(string nationalId, CancellationToken ct = default);
    Task<int> CountAsync(CancellationToken ct = default);
    Task AddAsync(Member member, CancellationToken ct = default);
}

public interface IAdminRepository
{
    Task<AdminUser?> GetByUsernameAsync(string username, CancellationToken ct = default);
}

public interface IAuditRepository
{
    Task AddAsync(LoanAuditLog log, CancellationToken ct = default);
    Task<IEnumerable<LoanAuditLog>> GetByLoanIdAsync(Guid loanId, CancellationToken ct = default);
}

/// <summary>
/// Unit of Work — koordinasi transaksi lintas repository
/// </summary>
public interface IUnitOfWork
{
    ILoanRepository Loans { get; }
    IInstallmentRepository Installments { get; }
    IMemberRepository Members { get; }
    IAdminRepository Admins { get; }
    IAuditRepository AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync(CancellationToken ct = default);
    Task CommitAsync(CancellationToken ct = default);
    Task RollbackAsync(CancellationToken ct = default);
}
