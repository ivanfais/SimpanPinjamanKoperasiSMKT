using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;

namespace KoperasiQu.API.Presentation.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await authService.LoginAsync(request, ct);
        return Ok(result);
    }
}
