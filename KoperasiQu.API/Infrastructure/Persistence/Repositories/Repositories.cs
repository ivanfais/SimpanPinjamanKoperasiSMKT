using Microsoft.EntityFrameworkCore;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Enums;
using KoperasiQu.API.Domain.Interfaces;

namespace KoperasiQu.API.Infrastructure.Persistence.Repositories;

public class LoanRepository(AppDbContext db) : ILoanRepository
{
    public async Task<Loan?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Loans.FindAsync([id], ct);

    public async Task<Loan?> GetByIdWithMemberAsync(Guid id, CancellationToken ct = default) =>
        await db.Loans.Include(l => l.Member)
                      .FirstOrDefaultAsync(l => l.Id == id, ct);

    public async Task<Loan?> GetDetailAsync(Guid id, CancellationToken ct = default) =>
        await db.Loans
            .Include(l => l.Member)
            .Include(l => l.Installments.OrderBy(i => i.InstallmentNumber))
            .FirstOrDefaultAsync(l => l.Id == id, ct);

    public async Task<IEnumerable<Loan>> GetAllAsync(
        LoanStatus? status, 
        DateTime? startDate = null, 
        DateTime? endDate = null, 
        CancellationToken ct = default)
    {
        var query = db.Loans.Include(l => l.Member).AsQueryable();
        if (status.HasValue) query = query.Where(l => l.Status == status.Value);
        
        if (startDate.HasValue) query = query.Where(l => l.AppliedAt >= startDate.Value);
        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(l => l.AppliedAt <= endOfDay);
        }

        return await query.OrderByDescending(l => l.AppliedAt).ToListAsync(ct);
    }

    public async Task<IEnumerable<Loan>> GetPendingAsync(CancellationToken ct = default) =>
        await db.Loans
            .Where(l => l.Status == LoanStatus.Pending)
            .Include(l => l.Member)
            .OrderBy(l => l.AppliedAt)
            .ToListAsync(ct);

    public async Task<IEnumerable<Loan>> GetByMemberAsync(Guid memberId, CancellationToken ct = default) =>
        await db.Loans
            .Where(l => l.MemberId == memberId)
            .Include(l => l.Member)
            .OrderByDescending(l => l.AppliedAt)
            .ToListAsync(ct);

    public async Task<bool> HasActiveLoanAsync(Guid memberId, CancellationToken ct = default) =>
        await db.Loans.AnyAsync(l => l.MemberId == memberId && l.Status == LoanStatus.Active, ct);

    public async Task AddAsync(Loan loan, CancellationToken ct = default) =>
        await db.Loans.AddAsync(loan, ct);

    public async Task<int> CountByStatusAsync(LoanStatus status, CancellationToken ct = default) =>
        await db.Loans.CountAsync(l => l.Status == status, ct);

    public async Task<decimal> SumAmountByStatusAsync(LoanStatus status, CancellationToken ct = default) =>
        await db.Loans.Where(l => l.Status == status).SumAsync(l => l.Amount, ct);
}

public class InstallmentRepository(AppDbContext db) : IInstallmentRepository
{
    public async Task<Installment?> GetByIdWithLoanAsync(Guid id, CancellationToken ct = default) =>
        await db.Installments
            .Include(i => i.Loan)
                .ThenInclude(l => l.Installments)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<decimal> SumCollectedSinceAsync(DateTime since, CancellationToken ct = default) =>
        await db.Installments
            .Where(i => i.IsPaid && i.PaidAt >= since)
            .SumAsync(i => (decimal?)i.AmountPaid ?? 0, ct);

    public async Task AddRangeAsync(IEnumerable<Installment> installments, CancellationToken ct = default) =>
        await db.Installments.AddRangeAsync(installments, ct);
}

public class MemberRepository(AppDbContext db) : IMemberRepository
{
    public async Task<IEnumerable<Member>> GetAllAsync(CancellationToken ct = default) =>
        await db.Members.Include(m => m.Loans).OrderBy(m => m.Name).ToListAsync(ct);

    public async Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Members.FindAsync([id], ct);

    public async Task<Member?> GetByIdWithLoansAsync(Guid id, CancellationToken ct = default) =>
        await db.Members.Include(m => m.Loans)
                        .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<Member?> GetByNationalIdAsync(string nationalId, CancellationToken ct = default) =>
        await db.Members.FirstOrDefaultAsync(m => m.NationalId == nationalId, ct);

    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default) =>
        await db.Members.AnyAsync(m => m.Email == email, ct);

    public async Task<bool> NationalIdExistsAsync(string nationalId, CancellationToken ct = default) =>
        await db.Members.AnyAsync(m => m.NationalId == nationalId, ct);

    public async Task<int> CountAsync(CancellationToken ct = default) =>
        await db.Members.CountAsync(ct);

    public async Task AddAsync(Member member, CancellationToken ct = default) =>
        await db.Members.AddAsync(member, ct);
}

public class AdminRepository(AppDbContext db) : IAdminRepository
{
    public async Task<AdminUser?> GetByUsernameAsync(string username, CancellationToken ct = default) =>
        await db.AdminUsers.FirstOrDefaultAsync(a => a.Username == username && a.IsActive, ct);
}

public class AuditRepository(AppDbContext db) : IAuditRepository
{
    public async Task AddAsync(LoanAuditLog log, CancellationToken ct = default) =>
        await db.LoanAuditLogs.AddAsync(log, ct);

    public async Task<IEnumerable<LoanAuditLog>> GetByLoanIdAsync(Guid loanId, CancellationToken ct = default) =>
        await db.LoanAuditLogs
            .Where(a => a.LoanId == loanId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
}
