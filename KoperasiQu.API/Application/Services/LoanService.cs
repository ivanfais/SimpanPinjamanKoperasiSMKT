using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;
using KoperasiQu.API.Application.Mappers;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Enums;
using KoperasiQu.API.Domain.Exceptions;
using KoperasiQu.API.Domain.Interfaces;

namespace KoperasiQu.API.Application.Services;

public class LoanService(IUnitOfWork uow, ILogger<LoanService> logger) : ILoanService
{
    private const decimal DefaultRate = 1.5m;

    // ══════════════════════════════════════
    // APPLY LOAN
    // ══════════════════════════════════════
    public async Task<LoanDetailDto> ApplyLoanAsync(ApplyLoanRequest request, CancellationToken ct = default)
    {
        // Validasi sudah via FluentValidation sebelum masuk ke sini
        var member = await uow.Members.GetByIdAsync(request.MemberId, ct)
            ?? throw new KeyNotFoundException($"Anggota dengan ID {request.MemberId} tidak ditemukan.");

        if (member.Status != MemberStatus.Active)
            throw new MemberInactiveException(member.Name);

        if (member.CreditScore < 50)
            throw new InvalidOperationException("Gagal: Skor kredit Anda di bawah batas minimum (50) karena riwayat keterlambatan.");

        if (request.Amount > member.BaseLimit)
            throw new CreditLimitExceededException(request.Amount, member.BaseLimit);

        if (await uow.Loans.HasActiveLoanAsync(request.MemberId, ct))
            throw new ActiveLoanExistsException();

        // Kalkulasi flat rate
        decimal totalInterest = request.Amount * (DefaultRate / 100m) * request.TenorMonths;
        decimal totalDue      = request.Amount + totalInterest;
        decimal monthlyInst   = Math.Round(totalDue / request.TenorMonths, 2, MidpointRounding.AwayFromZero);

        // Jika skor < 80, berisiko -> masukkan ke antrian Manager langsung
        var initialStatus = member.CreditScore < 80 ? LoanStatus.PendingManager : LoanStatus.Pending;

        var loan = new Loan
        {
            MemberId             = request.MemberId,
            Amount               = request.Amount,
            TenorMonths          = request.TenorMonths,
            InterestRatePerMonth = DefaultRate,
            TotalInterest        = totalInterest,
            TotalAmountDue       = totalDue,
            MonthlyInstallment   = monthlyInst,
            Status               = initialStatus,
            Purpose              = request.Purpose,
        };

        await uow.Loans.AddAsync(loan, ct);
        
        // Audit Log
        await uow.AuditLogs.AddAsync(new LoanAuditLog
        {
            LoanId = loan.Id,
            Action = "Applied",
            Notes  = $"Pinjaman diajukan{(string.IsNullOrEmpty(loan.Purpose) ? "" : $" untuk {loan.Purpose}")}. Skor Kredit: {member.CreditScore}."
        }, ct);

        await uow.SaveChangesAsync(ct);

        logger.LogInformation("[APPLY] LoanId={Id} MemberId={Mid} Amount={Amt}",
            loan.Id, request.MemberId, request.Amount);

        return await GetLoanDetailAsync(loan.Id, ct);
    }

    // ══════════════════════════════════════
    // APPROVE LOAN — Atomic via UoW
    // ══════════════════════════════════════
    public async Task<LoanDetailDto> ApproveLoanAsync(ApproveLoanRequest request, CancellationToken ct = default)
    {
        await uow.BeginTransactionAsync(ct);
        try
        {
            var loan = await uow.Loans.GetByIdWithMemberAsync(request.LoanId, ct)
                ?? throw new KeyNotFoundException($"Pinjaman {request.LoanId} tidak ditemukan.");

            if (loan.Status != LoanStatus.Pending && loan.Status != LoanStatus.PendingManager)
                throw new InvalidLoanStateException(loan.Status.ToString(), "Pending / PendingManager");

            // Multi-tier Approval Logic
            if (loan.Amount > 5_000_000 && request.AdminRole == "Staff")
            {
                loan.Status = LoanStatus.PendingManager;
                loan.ReviewedAt = DateTime.UtcNow;
                loan.ReviewedByAdminId = request.AdminId;

                await uow.AuditLogs.AddAsync(new LoanAuditLog
                {
                    LoanId = loan.Id,
                    AdminId = request.AdminId,
                    Action = "PendingManager",
                    Notes = "Nominal melebihi limit staf (5jt). Menunggu persetujuan Manager."
                }, ct);

                await uow.SaveChangesAsync(ct);
                await uow.CommitAsync(ct);
                logger.LogInformation("[PENDING_MANAGER] LoanId={Id} AdminId={Aid}", loan.Id, request.AdminId);
                return await GetLoanDetailAsync(loan.Id, ct);
            }

            // Default
            loan.Status            = LoanStatus.Active;
            loan.DisbursementDate  = request.DisbursementDate.ToUniversalTime();
            loan.ReviewedAt        = DateTime.UtcNow;
            loan.ReviewedByAdminId = request.AdminId;

            await uow.AuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = loan.Id,
                AdminId = request.AdminId,
                Action = "Approved",
                Notes = $"Pinjaman disetujui. Pencairan tanggal {request.DisbursementDate:dd/MM/yyyy}."
            }, ct);

            var installments = GenerateInstallments(loan, request.DisbursementDate);
            await uow.Installments.AddRangeAsync(installments, ct);

            await uow.SaveChangesAsync(ct);
            await uow.CommitAsync(ct);

            logger.LogInformation("[APPROVE] LoanId={Id} AdminId={Aid} Installments={Count}",
                loan.Id, request.AdminId, installments.Count);

            return await GetLoanDetailAsync(loan.Id, ct);
        }
        catch
        {
            await uow.RollbackAsync(ct);
            throw;
        }
    }

    // ══════════════════════════════════════
    // REJECT LOAN
    // ══════════════════════════════════════
    public async Task<LoanDetailDto> RejectLoanAsync(RejectLoanRequest request, CancellationToken ct = default)
    {
        var loan = await uow.Loans.GetByIdAsync(request.LoanId, ct)
            ?? throw new KeyNotFoundException($"Pinjaman {request.LoanId} tidak ditemukan.");

        if (loan.Status != LoanStatus.Pending)
            throw new InvalidLoanStateException(loan.Status.ToString(), LoanStatus.Pending.ToString());

        loan.Status            = LoanStatus.Rejected;
        loan.RejectionReason   = request.Reason;
        loan.ReviewedAt        = DateTime.UtcNow;
        loan.ReviewedByAdminId = request.AdminId;

        await uow.AuditLogs.AddAsync(new LoanAuditLog
        {
            LoanId = loan.Id,
            AdminId = request.AdminId,
            Action = "Rejected",
            Notes = $"Ditolak: {request.Reason}"
        }, ct);

        await uow.SaveChangesAsync(ct);
        return await GetLoanDetailAsync(loan.Id, ct);
    }

    // ══════════════════════════════════════
    // RECORD PAYMENT — Atomic via UoW
    // ══════════════════════════════════════
    public async Task<InstallmentDto> RecordPaymentAsync(RecordPaymentRequest request, CancellationToken ct = default)
    {
        await uow.BeginTransactionAsync(ct);
        try
        {
            var inst = await uow.Installments.GetByIdWithLoanAsync(request.InstallmentId, ct)
                ?? throw new KeyNotFoundException("Cicilan tidak ditemukan.");

            if (inst.IsPaid)
                throw new DomainException($"Cicilan #{inst.InstallmentNumber} sudah dibayar.");

            if (inst.Loan.Status != LoanStatus.Active)
                throw new DomainException("Pinjaman tidak dalam status aktif.");

            inst.IsPaid      = true;
            inst.AmountPaid  = request.AmountPaid;
            inst.PaidAt      = DateTime.UtcNow;
            inst.PaymentNote = request.Note;

            await uow.AuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = inst.LoanId,
                Action = "ManualPayment",
                Notes = $"Pembayaran manual cicilan #{inst.InstallmentNumber} sebesar {request.AmountPaid:N0}. Catatan: {request.Note ?? "-"}"
            }, ct);

            if (inst.Loan.Installments.All(i => i.Id == inst.Id || i.IsPaid))
            {
                inst.Loan.Status = LoanStatus.Completed;
                
                await uow.AuditLogs.AddAsync(new LoanAuditLog
                {
                    LoanId = inst.LoanId,
                    Action = "Completed",
                    Notes = "Seluruh cicilan telah lunas. Pinjaman Selesai."
                }, ct);

                logger.LogInformation("[COMPLETED] LoanId={Id}", inst.LoanId);
            }

            await uow.SaveChangesAsync(ct);
            await uow.CommitAsync(ct);

            return inst.ToDto();
        }
        catch
        {
            await uow.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<InstallmentDto> UploadReceiptAsync(Guid installmentId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default)
    {
        var inst = await uow.Installments.GetByIdWithLoanAsync(installmentId, ct)
            ?? throw new KeyNotFoundException("Cicilan tidak ditemukan.");

        if (inst.IsPaid) throw new DomainException("Cicilan sudah lunas.");

        // Simpan file gambar
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }

        inst.ReceiptUrl = $"/uploads/{fileName}";
        await uow.SaveChangesAsync(ct);
        return inst.ToDto();
    }

    public async Task<InstallmentDto> VerifyPaymentAsync(Guid installmentId, CancellationToken ct = default)
    {
        await uow.BeginTransactionAsync(ct);
        try
        {
            var inst = await uow.Installments.GetByIdWithLoanAsync(installmentId, ct)
                ?? throw new KeyNotFoundException("Cicilan tidak ditemukan.");

            if (inst.IsPaid) throw new DomainException("Cicilan sudah diverifikasi/lunas sebelumnya.");
            if (string.IsNullOrEmpty(inst.ReceiptUrl)) throw new DomainException("Belum ada bukti pembayaran yang diunggah.");

            inst.IsPaid = true;
            inst.IsVerified = true;
            inst.AmountPaid = inst.AmountToPay + inst.PenaltyAmount;
            inst.PaidAt = DateTime.UtcNow;

            // Reward poin jika lunas tanpa denda tambahan telat, dll (tambah poin jika sudah benar bayar)
            // Note: Membayar dengan denda pun menaikkan poin sbg iktikad baik, tapi pelan pelan (+10 max 100)
            var member = await uow.Members.GetByIdAsync(inst.Loan.MemberId, ct);
            if (member != null)
            {
                member.CreditScore = Math.Min(100, member.CreditScore + 10);
            }

            await uow.AuditLogs.AddAsync(new LoanAuditLog
            {
                LoanId = inst.LoanId,
                Action = "PaymentVerified",
                Notes = $"Cicilan #{inst.InstallmentNumber} lunas & diverifikasi. Skor+: 10."
            }, ct);

            if (inst.Loan.Installments.All(i => i.Id == inst.Id || i.IsPaid))
            {
                inst.Loan.Status = LoanStatus.Completed;

                await uow.AuditLogs.AddAsync(new LoanAuditLog
                {
                    LoanId = inst.LoanId,
                    Action = "Completed",
                    Notes = "Seluruh cicilan telah lunas. Pinjaman Selesai."
                }, ct);
            }

            await uow.SaveChangesAsync(ct);
            await uow.CommitAsync(ct);
            return inst.ToDto();
        }
        catch
        {
            await uow.RollbackAsync(ct);
            throw;
        }
    }

    // ══════════════════════════════════════
    // QUERIES
    // ══════════════════════════════════════
    public async Task<IEnumerable<LoanSummaryDto>> GetPendingLoansAsync(CancellationToken ct = default) =>
        (await uow.Loans.GetPendingAsync(ct)).Select(l => l.ToSummaryDto());

    public async Task<IEnumerable<LoanSummaryDto>> GetAllLoansAsync(
        string? status, 
        DateTime? startDate = null, 
        DateTime? endDate = null, 
        CancellationToken ct = default)
    {
        LoanStatus? parsed = Enum.TryParse<LoanStatus>(status, true, out var s) ? s : null;
        return (await uow.Loans.GetAllAsync(parsed, startDate, endDate, ct)).Select(l => l.ToSummaryDto());
    }

    public async Task<IEnumerable<LoanSummaryDto>> GetMemberLoansAsync(Guid memberId, CancellationToken ct = default) =>
        (await uow.Loans.GetByMemberAsync(memberId, ct)).Select(l => l.ToSummaryDto());

    public async Task<LoanDetailDto> GetLoanDetailAsync(Guid loanId, CancellationToken ct = default)
    {
        var loan = await uow.Loans.GetDetailAsync(loanId, ct)
            ?? throw new KeyNotFoundException($"Pinjaman {loanId} tidak ditemukan.");
        
        var logs = await uow.AuditLogs.GetByLoanIdAsync(loanId, ct);
        
        return loan.ToDetailDto(logs);
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var pending = await uow.Loans.GetPendingAsync(ct);
        var pendingMgr = await uow.Loans.GetAllAsync(LoanStatus.PendingManager, ct: ct);
        var recent = pending.Concat(pendingMgr).OrderByDescending(l => l.AppliedAt).Take(5).Select(l => l.ToSummaryDto());
        var pendingCount = await uow.Loans.CountByStatusAsync(LoanStatus.Pending, ct);
        var pendingMgrCount = await uow.Loans.CountByStatusAsync(LoanStatus.PendingManager, ct);

        return new DashboardStatsDto(
            await uow.Members.CountAsync(ct),
            await uow.Loans.CountByStatusAsync(LoanStatus.Active, ct),
            pendingCount + pendingMgrCount,
            await uow.Loans.SumAmountByStatusAsync(LoanStatus.Active, ct),
            await uow.Installments.SumCollectedSinceAsync(startOfMonth, ct),
            recent);
    }

    // ══════════════════════════════════════
    // PRIVATE — Pure Domain Logic
    // ══════════════════════════════════════
    private static List<Installment> GenerateInstallments(Loan loan, DateTime disbDate)
    {
        var list = new List<Installment>(loan.TenorMonths);
        decimal baseAmt    = loan.MonthlyInstallment;
        decimal totalSoFar = baseAmt * (loan.TenorMonths - 1);

        for (int i = 1; i <= loan.TenorMonths; i++)
        {
            decimal amt = i == loan.TenorMonths
                ? Math.Round(loan.TotalAmountDue - totalSoFar, 2)
                : baseAmt;

            list.Add(new Installment
            {
                LoanId            = loan.Id,
                InstallmentNumber = i,
                DueDate           = disbDate.ToUniversalTime().AddMonths(i),
                AmountToPay       = amt,
            });
        }
        return list;
    }
}
