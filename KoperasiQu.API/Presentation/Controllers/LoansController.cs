using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;

namespace KoperasiQu.API.Presentation.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize] // Baik Admin maupun Member bisa akses, difilter per-action
public class LoansController(ILoanService loanService) : ControllerBase
{
    // ── Admin only ──────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<DashboardStatsDto>> Dashboard(CancellationToken ct) =>
        Ok(await loanService.GetDashboardStatsAsync(ct));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<LoanSummaryDto>>> GetAll(
        [FromQuery] string? status, 
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate, 
        CancellationToken ct) =>
        Ok(await loanService.GetAllLoansAsync(status, startDate, endDate, ct));

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<LoanSummaryDto>>> GetPending(CancellationToken ct) =>
        Ok(await loanService.GetPendingLoansAsync(ct));

    [HttpPost("{loanId:guid}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDetailDto>> Approve(
        Guid loanId, [FromBody] ApproveLoanRequest request, CancellationToken ct) 
    {
        var adminRole = User.Claims.FirstOrDefault(c => c.Type == "AdminRole")?.Value ?? "Staff";
        return Ok(await loanService.ApproveLoanAsync(request with { LoanId = loanId, AdminRole = adminRole }, ct));
    }

    [HttpPost("{loanId:guid}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LoanDetailDto>> Reject(
        Guid loanId, [FromBody] RejectLoanRequest request, CancellationToken ct) =>
        Ok(await loanService.RejectLoanAsync(request with { LoanId = loanId }, ct));

    // ── Member + Admin ──────────────────────────────────────────────────────

    /// <summary>Member hanya bisa lihat pinjaman miliknya sendiri</summary>
    [HttpGet("member/{memberId:guid}")]
    [Authorize(Roles = "Member,Admin")]
    public async Task<ActionResult<IEnumerable<LoanSummaryDto>>> GetByMember(
        Guid memberId, CancellationToken ct) =>
        Ok(await loanService.GetMemberLoansAsync(memberId, ct));

    [HttpGet("{loanId:guid}")]
    [Authorize(Roles = "Member,Admin")]
    public async Task<ActionResult<LoanDetailDto>> GetDetail(Guid loanId, CancellationToken ct) =>
        Ok(await loanService.GetLoanDetailAsync(loanId, ct));

    /// <summary>Member mengajukan pinjaman sendiri</summary>
    [HttpPost("apply")]
    [Authorize(Roles = "Member,Admin")]
    public async Task<ActionResult<LoanDetailDto>> Apply(
        [FromBody] ApplyLoanRequest request, CancellationToken ct)
    {
        var loan = await loanService.ApplyLoanAsync(request, ct);
        return CreatedAtAction(nameof(GetDetail), new { loanId = loan.Id }, loan);
    }

    /// <summary>
    /// Catat pembayaran cicilan.
    /// Admin: catat pembayaran offline. Member: bayar sendiri via simulasi.
    /// </summary>
    [HttpPost("installments/{installmentId:guid}/pay")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<InstallmentDto>> RecordPayment(
        Guid installmentId, [FromBody] RecordPaymentRequest request, CancellationToken ct) =>
        Ok(await loanService.RecordPaymentAsync(request with { InstallmentId = installmentId }, ct));
    /// <summary>Member: Upload struk pembayaran cicilan</summary>
    [HttpPost("installments/{installmentId:guid}/upload-receipt")]
    [Authorize(Roles = "Member,Admin")] // Biasanya member yg upload
    public async Task<ActionResult<InstallmentDto>> UploadReceipt(
        Guid installmentId, IFormFile file, CancellationToken ct) =>
        Ok(await loanService.UploadReceiptAsync(installmentId, file, ct));

    /// <summary>Admin: Verifikasi struk yg sudah diupload dan jadikan LUNAS</summary>
    [HttpPost("installments/{installmentId:guid}/verify-receipt")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InstallmentDto>> VerifyReceipt(
        Guid installmentId, CancellationToken ct) =>
        Ok(await loanService.VerifyPaymentAsync(installmentId, ct));
}
