using FluentValidation;
using KoperasiQu.API.Application.DTOs;

namespace KoperasiQu.API.Application.Validators;

public class ApplyLoanValidator : AbstractValidator<ApplyLoanRequest>
{
    private static readonly int[] AllowedTenors = [3, 6, 12, 24];

    public ApplyLoanValidator()
    {
        RuleFor(x => x.MemberId)
            .NotEmpty().WithMessage("MemberId wajib diisi.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(500_000).WithMessage("Minimal pinjaman Rp 500.000.")
            .LessThanOrEqualTo(10_000_000).WithMessage("Maksimal pinjaman Rp 10.000.000.");

        RuleFor(x => x.TenorMonths)
            .Must(t => AllowedTenors.Contains(t))
            .WithMessage($"Tenor harus salah satu dari: {string.Join(", ", AllowedTenors)} bulan.");

        RuleFor(x => x.Purpose)
            .MaximumLength(500).WithMessage("Tujuan pinjaman maksimal 500 karakter.")
            .When(x => x.Purpose is not null);
    }
}

public class ApproveLoanValidator : AbstractValidator<ApproveLoanRequest>
{
    public ApproveLoanValidator()
    {
        RuleFor(x => x.LoanId).NotEmpty();
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.DisbursementDate)
            .GreaterThanOrEqualTo(DateTime.UtcNow.Date)
            .WithMessage("Tanggal pencairan tidak boleh di masa lalu.");
    }
}

public class RejectLoanValidator : AbstractValidator<RejectLoanRequest>
{
    public RejectLoanValidator()
    {
        RuleFor(x => x.LoanId).NotEmpty();
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Alasan penolakan wajib diisi.")
            .MinimumLength(10).WithMessage("Alasan minimal 10 karakter.")
            .MaximumLength(500);
    }
}

public class RecordPaymentValidator : AbstractValidator<RecordPaymentRequest>
{
    public RecordPaymentValidator()
    {
        RuleFor(x => x.InstallmentId).NotEmpty();
        RuleFor(x => x.AmountPaid)
            .GreaterThan(0).WithMessage("Nominal pembayaran harus lebih dari 0.");
        RuleFor(x => x.Note)
            .MaximumLength(255)
            .When(x => x.Note is not null);
    }
}

public class CreateMemberValidator : AbstractValidator<CreateMemberRequest>
{
    public CreateMemberValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.NationalId)
            .NotEmpty().MaximumLength(20)
            .Matches(@"^\d{16}$").WithMessage("NIK harus 16 digit angka.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.BaseLimit)
            .GreaterThanOrEqualTo(500_000).WithMessage("BaseLimit minimal Rp 500.000.")
            .LessThanOrEqualTo(10_000_000).WithMessage("BaseLimit maksimal Rp 10.000.000.");
    }
}

public class UpdateMemberValidator : AbstractValidator<UpdateMemberRequest>
{
    private static readonly string[] ValidStatuses = ["Active", "Inactive", "Suspended"];

    public UpdateMemberValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.BaseLimit)
            .GreaterThanOrEqualTo(500_000)
            .LessThanOrEqualTo(10_000_000);
        RuleFor(x => x.Status)
            .Must(s => ValidStatuses.Contains(s))
            .WithMessage("Status tidak valid.");
    }
}
