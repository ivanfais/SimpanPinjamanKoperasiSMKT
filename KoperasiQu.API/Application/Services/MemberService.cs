using KoperasiQu.API.Application.DTOs;
using KoperasiQu.API.Application.Interfaces;
using KoperasiQu.API.Application.Mappers;
using KoperasiQu.API.Domain.Entities;
using KoperasiQu.API.Domain.Enums;
using KoperasiQu.API.Domain.Exceptions;
using KoperasiQu.API.Domain.Interfaces;

namespace KoperasiQu.API.Application.Services;

public class MemberService(IUnitOfWork uow) : IMemberService
{
    public async Task<IEnumerable<MemberDto>> GetAllAsync(CancellationToken ct = default) =>
        (await uow.Members.GetAllAsync(ct)).Select(m => m.ToDto());

    public async Task<MemberDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var member = await uow.Members.GetByIdWithLoansAsync(id, ct)
            ?? throw new KeyNotFoundException($"Anggota {id} tidak ditemukan.");
        return member.ToDto();
    }

    public async Task<MemberDto> CreateAsync(CreateMemberRequest request, CancellationToken ct = default)
    {
        // Validation: FluentValidation sudah handle format, service handle uniqueness
        if (await uow.Members.EmailExistsAsync(request.Email, ct))
            throw new DomainException("Email sudah terdaftar.");

        if (await uow.Members.NationalIdExistsAsync(request.NationalId, ct))
            throw new DomainException("NIK sudah terdaftar.");

        var member = new Member
        {
            Name        = request.Name,
            NationalId  = request.NationalId,
            Email       = request.Email,
            PhoneNumber = request.PhoneNumber,
            Address     = request.Address,
            BaseLimit   = request.BaseLimit,
            Status      = MemberStatus.Active,
            // PIN Default anggota baru saat dibuat oleh Admin: 123456
            PinHash     = BCrypt.Net.BCrypt.HashPassword("123456")
        };

        await uow.Members.AddAsync(member, ct);
        await uow.SaveChangesAsync(ct);

        return member.ToDto();
    }

    public async Task<MemberDto> UpdateAsync(Guid id, UpdateMemberRequest request, CancellationToken ct = default)
    {
        var member = await uow.Members.GetByIdWithLoansAsync(id, ct)
            ?? throw new KeyNotFoundException($"Anggota {id} tidak ditemukan.");

        if (!Enum.TryParse<MemberStatus>(request.Status, out var newStatus))
            throw new DomainException($"Status '{request.Status}' tidak valid.");

        member.Name        = request.Name;
        member.PhoneNumber = request.PhoneNumber;
        member.Address     = request.Address;
        member.BaseLimit   = request.BaseLimit;
        member.Status      = newStatus;
        member.UpdatedAt   = DateTime.UtcNow;

        await uow.SaveChangesAsync(ct);
        return member.ToDto();
    }

    public async Task<MemberDto> ResetScoreAsync(Guid id, CancellationToken ct = default)
    {
        var member = await uow.Members.GetByIdWithLoansAsync(id, ct)
            ?? throw new KeyNotFoundException($"Anggota {id} tidak ditemukan.");

        member.CreditScore = 100;
        await uow.SaveChangesAsync(ct);

        return member.ToDto();
    }
}
