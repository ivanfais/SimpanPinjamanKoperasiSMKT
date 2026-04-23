using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;
using KoperasiQu.API.Domain.Enums;
using KoperasiQu.API.Domain.Exceptions;
using KoperasiQu.API.Domain.Interfaces;

namespace KoperasiQu.API.Application.Services;

/// <summary>
/// Autentikasi khusus anggota koperasi via NIK + PIN 6 digit.
/// Menghasilkan JWT dengan role "Member" — terpisah dari JWT Admin.
/// </summary>
public class MemberAuthService(IUnitOfWork uow, IConfiguration config) : IMemberAuthService
{
    // ── Login ─────────────────────────────────────────────────────────────────
    public async Task<MemberLoginResponse> LoginAsync(MemberLoginRequest request, CancellationToken ct = default)
    {
        var member = await uow.Members.GetByNationalIdAsync(request.NationalId, ct)
            ?? throw new UnauthorizedAccessException("NIK tidak ditemukan.");

        if (member.Status != MemberStatus.Active)
            throw new UnauthorizedAccessException("Akun tidak aktif. Hubungi admin koperasi.");

        // PIN belum diset → arahkan ke set PIN
        if (string.IsNullOrEmpty(member.PinHash))
            throw new DomainException("PIN belum diatur. Silakan hubungi admin koperasi untuk aktivasi.");

        if (!BCrypt.Net.BCrypt.Verify(request.Pin, member.PinHash))
            throw new UnauthorizedAccessException("NIK atau PIN salah.");

        var expiry = DateTime.UtcNow.AddDays(7); // Token member berlaku 7 hari
        var token  = GenerateJwt(member.Id, member.Name, member.NationalId, expiry);

        return new MemberLoginResponse(
            token,
            member.Id,
            member.Name,
            member.NationalId,
            member.PhoneNumber,
            member.BaseLimit,
            member.Status.ToString(),
            member.CreditScore,
            expiry);
    }

    // ── Change PIN ────────────────────────────────────────────────────────────
    public async Task ChangePinAsync(ChangePinRequest request, CancellationToken ct = default)
    {
        if (request.NewPin.Length < 6 || !request.NewPin.All(char.IsDigit))
            throw new DomainException("PIN baru harus 6 digit angka.");

        var member = await uow.Members.GetByNationalIdAsync(request.NationalId, ct)
            ?? throw new KeyNotFoundException("Anggota tidak ditemukan.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPin, member.PinHash))
            throw new UnauthorizedAccessException("PIN lama tidak sesuai.");

        member.PinHash   = BCrypt.Net.BCrypt.HashPassword(request.NewPin);
        member.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
    }

    // ── Set Initial PIN (by Admin) ────────────────────────────────────────────
    public async Task SetInitialPinAsync(SetInitialPinRequest request, CancellationToken ct = default)
    {
        if (request.Pin.Length < 6 || !request.Pin.All(char.IsDigit))
            throw new DomainException("PIN harus 6 digit angka.");

        var member = await uow.Members.GetByIdAsync(request.MemberId, ct)
            ?? throw new KeyNotFoundException("Anggota tidak ditemukan.");

        member.PinHash   = BCrypt.Net.BCrypt.HashPassword(request.Pin);
        member.UpdatedAt = DateTime.UtcNow;
        await uow.SaveChangesAsync(ct);
    }

    // ── JWT Generator (role: Member) ──────────────────────────────────────────
    private string GenerateJwt(Guid memberId, string name, string nik, DateTime expiry)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,  memberId.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim("nik",                        nik),
            new Claim(ClaimTypes.Role,              "Member"),
            new Claim(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString()),
        };

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: creds));
    }
}
