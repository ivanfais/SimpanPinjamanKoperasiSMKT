using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Interfaces;

namespace KoperasiQu.API.Application.Services;

public class AuthService(IUnitOfWork uow, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var admin = await uow.Admins.GetByUsernameAsync(request.Username, ct)
            ?? throw new UnauthorizedAccessException("Username atau password salah.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
            throw new UnauthorizedAccessException("Username atau password salah.");

        var expiry = DateTime.UtcNow.AddHours(8);
        return new LoginResponse(GenerateJwt(admin, expiry), admin.Username, admin.FullName, expiry);
    }

    private string GenerateJwt(AdminUser admin, DateTime expiry)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,  admin.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, admin.Username),
            new Claim(ClaimTypes.Role, "Admin"), // Tetap dipakai agar rute [Authorize(Roles="Admin")] bekerja
            new Claim("AdminRole", admin.Role.ToString()), // Baru: Staff / Manager
            new Claim(JwtRegisteredClaimNames.Jti,  Guid.NewGuid().ToString())
        };

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            issuer:             config["Jwt:Issuer"],
            audience:           config["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: creds));
    }
}
