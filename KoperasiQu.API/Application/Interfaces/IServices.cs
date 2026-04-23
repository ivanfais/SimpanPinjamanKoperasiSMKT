using KoperasiQu.API.Application.DTOs;

namespace KoperasiQu.API.Application.Interfaces;

public interface ILoanService
{
    Task<LoanDetailDto> ApplyLoanAsync(ApplyLoanRequest request, CancellationToken ct = default);
    Task<LoanDetailDto> ApproveLoanAsync(ApproveLoanRequest request, CancellationToken ct = default);
    Task<LoanDetailDto> RejectLoanAsync(RejectLoanRequest request, CancellationToken ct = default);
    Task<InstallmentDto> RecordPaymentAsync(RecordPaymentRequest request, CancellationToken ct = default);
    Task<InstallmentDto> UploadReceiptAsync(Guid installmentId, Microsoft.AspNetCore.Http.IFormFile file, CancellationToken ct = default);
    Task<InstallmentDto> VerifyPaymentAsync(Guid installmentId, CancellationToken ct = default);
    Task<IEnumerable<LoanSummaryDto>> GetPendingLoansAsync(CancellationToken ct = default);
    Task<IEnumerable<LoanSummaryDto>> GetAllLoansAsync(
        string? status, 
        DateTime? startDate = null, 
        DateTime? endDate = null, 
        CancellationToken ct = default);
    Task<IEnumerable<LoanSummaryDto>> GetMemberLoansAsync(Guid memberId, CancellationToken ct = default);
    Task<LoanDetailDto> GetLoanDetailAsync(Guid loanId, CancellationToken ct = default);
    Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default);
}

public interface IMemberService
{
    Task<IEnumerable<MemberDto>> GetAllAsync(CancellationToken ct = default);
    Task<MemberDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<MemberDto> CreateAsync(CreateMemberRequest request, CancellationToken ct = default);
    Task<MemberDto> UpdateAsync(Guid id, UpdateMemberRequest request, CancellationToken ct = default);
    Task<MemberDto> ResetScoreAsync(Guid id, CancellationToken ct = default);
}

/// <summary>Auth untuk Admin (username + password)</summary>
public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
}

/// <summary>Auth khusus Member/Anggota (NIK + PIN) untuk Mobile App</summary>
public interface IMemberAuthService
{
    Task<MemberLoginResponse> LoginAsync(MemberLoginRequest request, CancellationToken ct = default);
    Task ChangePinAsync(ChangePinRequest request, CancellationToken ct = default);
    Task SetInitialPinAsync(SetInitialPinRequest request, CancellationToken ct = default);
}
