using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Enums;

namespace KoperasiQu.API.Infrastructure.Persistence.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("Members");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name).IsRequired().HasMaxLength(150);
        builder.Property(m => m.NationalId).IsRequired().HasMaxLength(20);
        builder.Property(m => m.Email).IsRequired().HasMaxLength(100);
        builder.Property(m => m.PhoneNumber).HasMaxLength(20);
        builder.Property(m => m.Address).HasMaxLength(255);
        builder.Property(m => m.BaseLimit).HasPrecision(18, 2);
        builder.Property(m => m.PinHash).IsRequired().HasDefaultValue(string.Empty);
        builder.Property(m => m.Status).HasConversion<string>().HasDefaultValue(MemberStatus.Active);

        builder.HasIndex(m => m.Email).IsUnique();
        builder.HasIndex(m => m.NationalId).IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Members_BaseLimit",
            "`BaseLimit` >= 500000 AND `BaseLimit` <= 10000000"));
    }
}

public class AdminUserConfiguration : IEntityTypeConfiguration<AdminUser>
{
    public void Configure(EntityTypeBuilder<AdminUser> builder)
    {
        builder.ToTable("AdminUsers");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Username).IsRequired().HasMaxLength(100);
        builder.Property(a => a.PasswordHash).IsRequired();
        builder.Property(a => a.FullName).HasMaxLength(150);
        builder.HasIndex(a => a.Username).IsUnique();
    }
}

public class LoanConfiguration : IEntityTypeConfiguration<Loan>
{
    public void Configure(EntityTypeBuilder<Loan> builder)
    {
        builder.ToTable("Loans");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Amount).HasPrecision(18, 2);
        builder.Property(l => l.InterestRatePerMonth).HasPrecision(5, 2);
        builder.Property(l => l.TotalInterest).HasPrecision(18, 2);
        builder.Property(l => l.TotalAmountDue).HasPrecision(18, 2);
        builder.Property(l => l.MonthlyInstallment).HasPrecision(18, 2);
        builder.Property(l => l.Purpose).HasMaxLength(500);
        builder.Property(l => l.RejectionReason).HasMaxLength(500);
        builder.Property(l => l.Status)
            .HasConversion<string>()
            .HasDefaultValue(LoanStatus.Pending);

        builder.HasOne(l => l.Member)
               .WithMany(m => m.Loans)
               .HasForeignKey(l => l.MemberId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(l => new { l.MemberId, l.Status });
    }
}

public class InstallmentConfiguration : IEntityTypeConfiguration<Installment>
{
    public void Configure(EntityTypeBuilder<Installment> builder)
    {
        builder.ToTable("Installments");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.AmountToPay).HasPrecision(18, 2);
        builder.Property(i => i.AmountPaid).HasPrecision(18, 2);
        builder.Property(i => i.PaymentNote).HasMaxLength(255);

        builder.HasOne(i => i.Loan)
               .WithMany(l => l.Installments)
               .HasForeignKey(i => i.LoanId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(i => new { i.LoanId, i.InstallmentNumber }).IsUnique();
        builder.HasIndex(i => new { i.LoanId, i.IsPaid, i.DueDate });
    }
}
