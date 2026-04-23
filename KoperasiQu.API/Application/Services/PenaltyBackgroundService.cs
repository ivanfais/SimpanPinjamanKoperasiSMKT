using KoperasiQu.API.Domain.Interfaces;
using KoperasiQu.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace KoperasiQu.API.Application.Services;

/// <summary>
/// Worker service berjalan otomatis di background untuk mencari cicilan yang overdue
/// dan menerapkan denda Rp 5.000 per hari.
/// </summary>
public class PenaltyBackgroundService(IServiceProvider serviceProvider, ILogger<PenaltyBackgroundService> logger) : BackgroundService
{
    private const decimal DailyPenaltyAmount = 5000m;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("PenaltyBackgroundService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ApplyPenaltiesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred while applying penalties.");
            }

            // Simulasi: Di production delay sebaiknya 24 jam (misal jam 00:01). 
            // Untuk testing, kita jalankan setiap 1 menit. 
            // TODO: Gunakan cron/delay waktu yang tepat.
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task ApplyPenaltiesAsync(CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<KoperasiQu.API.Infrastructure.AppDbContext>();

        var today = DateTime.UtcNow.Date;

        // Mencari Installment yang:
        // 1. Belum dibayar
        // 2. Tanggal jatuh temponya sudah lewat
        // 3. Pinjaman terkaitnya berstatus Active
        var overdueInstallments = await context.Installments
            .Include(i => i.Loan)
                .ThenInclude(l => l.Member)
            .Where(i => i.Loan.Status == LoanStatus.Active 
                     && !i.IsPaid 
                     && i.DueDate.Date < today)
            .ToListAsync(ct);

        if (!overdueInstallments.Any())
            return;

        int updatedCount = 0;
        foreach (var inst in overdueInstallments)
        {
            var daysOverdue = (int)(today - inst.DueDate.Date).TotalDays;
            
            // Rumus akumulasi: (Hari Terlambat * Denda per hari) - Denda yg sudah tercatat
            // Agar denda terus nambah Rp 5000 setiap hari jika dicek harian
            var expectedPenalty = daysOverdue * DailyPenaltyAmount;
            
            if (inst.PenaltyAmount < expectedPenalty)
            {
                inst.PenaltyAmount = expectedPenalty;

                // Penalize Credit Score when a new day of delay is added
                if (inst.Loan.Member != null)
                {
                    inst.Loan.Member.CreditScore = Math.Max(0, inst.Loan.Member.CreditScore - 5);
                }

                updatedCount++;
            }
        }

        if (updatedCount > 0)
        {
            await context.SaveChangesAsync(ct);
            logger.LogInformation($"Successfully updated penalties for {updatedCount} installments. Penalty per day: {DailyPenaltyAmount}.");
        }
    }
}
