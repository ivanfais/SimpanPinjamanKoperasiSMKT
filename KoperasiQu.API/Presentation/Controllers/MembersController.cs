using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;

namespace KoperasiQu.API.Presentation.Controllers;

[ApiController]
[Route("api/members")]
public class MembersController(IMemberService memberService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<MemberDto>>> GetAll(CancellationToken ct) =>
        Ok(await memberService.GetAllAsync(ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin,Member")] // Member boleh lihat profilnya sendiri
    public async Task<ActionResult<MemberDto>> GetById(Guid id, CancellationToken ct) =>
        Ok(await memberService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MemberDto>> Create([FromBody] CreateMemberRequest request, CancellationToken ct)
    {
        var member = await memberService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = member.Id }, member);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MemberDto>> Update(
        Guid id, [FromBody] UpdateMemberRequest request, CancellationToken ct) =>
        Ok(await memberService.UpdateAsync(id, request, ct));

    [HttpPost("{id:guid}/reset-score")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MemberDto>> ResetScore(Guid id, CancellationToken ct)
    {
        // Hanya bisa di-reset oleh admin. Di real app mungkin hanya Manager.
        var member = await memberService.ResetScoreAsync(id, ct);
        return Ok(member);
    }
}
