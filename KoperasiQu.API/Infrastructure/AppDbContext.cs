using Microsoft.EntityFrameworkCore;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Infrastructure.Persistence.Configurations;

namespace KoperasiQu.API.Infrastructure;

/// <summary>
/// DbContext hanya bertanggung jawab mendaftarkan entity dan
/// mendelegasikan konfigurasi ke IEntityTypeConfiguration terpisah.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Member>      Members      => Set<Member>();
    public DbSet<AdminUser>   AdminUsers   => Set<AdminUser>();
    public DbSet<Loan>        Loans        => Set<Loan>();
    public DbSet<Installment> Installments => Set<Installment>();
    public DbSet<LoanAuditLog> LoanAuditLogs => Set<LoanAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Konfigurasi didelegasikan ke kelas Configuration masing-masing
        modelBuilder.ApplyConfiguration(new MemberConfiguration());
        modelBuilder.ApplyConfiguration(new AdminUserConfiguration());
        modelBuilder.ApplyConfiguration(new LoanConfiguration());
        modelBuilder.ApplyConfiguration(new InstallmentConfiguration());

        modelBuilder.Entity<LoanAuditLog>(e =>
        {
            e.HasOne(a => a.Loan)
             .WithMany()
             .HasForeignKey(a => a.LoanId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
