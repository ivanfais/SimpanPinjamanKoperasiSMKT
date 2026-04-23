using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;

namespace KoperasiQu.API.Presentation.Controllers;

/// <summary>
/// Endpoint autentikasi khusus anggota (Mobile App).
/// Terpisah dari /api/auth yang digunakan Admin.
/// </summary>
[ApiController]
[Route("api/member-auth")]
public class MemberAuthController(IMemberAuthService memberAuthService) : ControllerBase
{
    /// <summary>Login anggota dengan NIK + PIN 6 digit</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<MemberLoginResponse>> Login(
        [FromBody] MemberLoginRequest request, CancellationToken ct)
    {
        var result = await memberAuthService.LoginAsync(request, ct);
        return Ok(result);
    }

    /// <summary>Ganti PIN (perlu autentikasi terlebih dahulu)</summary>
    [HttpPost("change-pin")]
    [Authorize(Roles = "Member")]
    public async Task<IActionResult> ChangePin(
        [FromBody] ChangePinRequest request, CancellationToken ct)
    {
        await memberAuthService.ChangePinAsync(request, ct);
        return Ok(new { message = "PIN berhasil diubah." });
    }

    /// <summary>Set PIN awal oleh Admin untuk anggota baru</summary>
    [HttpPost("set-pin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetInitialPin(
        [FromBody] SetInitialPinRequest request, CancellationToken ct)
    {
        await memberAuthService.SetInitialPinAsync(request, ct);
        return Ok(new { message = "PIN berhasil diatur untuk anggota." });
    }
}
