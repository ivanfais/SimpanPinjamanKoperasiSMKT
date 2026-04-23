using Microsoft.EntityFrameworkCore.Storage;
using KoperasiQu.API.Domain.Interfaces;
using KoperasiQu.API.Infrastructure.Persistence.Repositories;

namespace KoperasiQu.API.Infrastructure.Persistence;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    private IDbContextTransaction? _transaction;

    public ILoanRepository        Loans        { get; } = new LoanRepository(db);
    public IInstallmentRepository Installments { get; } = new InstallmentRepository(db);
    public IMemberRepository      Members      { get; } = new MemberRepository(db);
    public IAdminRepository       Admins       { get; } = new AdminRepository(db);
    public IAuditRepository       AuditLogs    { get; } = new AuditRepository(db);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);

    public async Task BeginTransactionAsync(CancellationToken ct = default) =>
        _transaction = await db.Database.BeginTransactionAsync(ct);

    public async Task CommitAsync(CancellationToken ct = default)
    {
        if (_transaction is null) throw new InvalidOperationException("No active transaction.");
        await _transaction.CommitAsync(ct);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackAsync(CancellationToken ct = default)
    {
        if (_transaction is null) return;
        await _transaction.RollbackAsync(ct);
        await _transaction.DisposeAsync();
        _transaction = null;
    }
}
