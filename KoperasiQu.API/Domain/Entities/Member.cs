using KoperasiQu.API.Domain.Enums;

namespace KoperasiQu.API.Domain.Entities;

/// <summary>
/// Anggota koperasi. Murni domain entity — tidak ada dependency ke framework.
/// </summary>
public class Member
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    /// <summary>Batas kredit anggota: Rp 500.000 – Rp 10.000.000</summary>
    public decimal BaseLimit { get; set; }

    /// <summary>PIN 6 digit (hashed BCrypt) untuk login mobile app</summary>
    public string PinHash { get; set; } = string.Empty;

    /// <summary>
    /// Reputasi member untuk menentukan risk profile pinjaman (0-100). Default 100.
    /// Hijau: 80-100, Kuning: 50-79, Merah: <50
    /// </summary>
    public int CreditScore { get; set; } = 100;

    public MemberStatus Status { get; set; } = MemberStatus.Active;
    public DateTime JoinedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation Properties
    public ICollection<Loan> Loans { get; set; } = new List<Loan>();
}
