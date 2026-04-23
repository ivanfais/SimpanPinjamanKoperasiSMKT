using Microsoft.EntityFrameworkCore;
using KoperasiQu.API.Domain.Entities;

namespace KoperasiQu.API.Infrastructure;

public static class DbSeeder
{
    // PIN default untuk anggota sample: 123456
    private const string DefaultPin = "123456";

    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // ── Seed Admin (Manager) ────────────────────────────────────────────
        if (!await db.AdminUsers.AnyAsync(a => a.Username == "admin"))
        {
            db.AdminUsers.Add(new AdminUser
            {
                Username     = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FullName     = "Ketua Manager",
                Role         = Domain.Enums.AdminRole.Manager,
                IsActive     = true
            });
        }
        else
        {
            // Patch: pastikan admin existing sudah punya Role = Manager
            var adminUser = await db.AdminUsers.FirstOrDefaultAsync(a => a.Username == "admin");
            if (adminUser != null && adminUser.Role != Domain.Enums.AdminRole.Manager)
            {
                adminUser.Role = Domain.Enums.AdminRole.Manager;
                adminUser.FullName = "Ketua Manager";
                Console.WriteLine("[Seeder] Patched admin role → Manager.");
            }
        }

        // ── Seed Staff ──────────────────────────────────────────────────────
        if (!await db.AdminUsers.AnyAsync(a => a.Username == "staff"))
        {
            db.AdminUsers.Add(new AdminUser
            {
                Username     = "staff",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("staff123"),
                FullName     = "Staf Operasional",
                Role         = Domain.Enums.AdminRole.Staff,
                IsActive     = true
            });
            Console.WriteLine("[Seeder] Akun 'staff' berhasil ditambahkan.");
        }

        var defaultPinHash = BCrypt.Net.BCrypt.HashPassword(DefaultPin);

        // ── Seed Sample Members (dengan PIN default 123456) ─────────────────
        if (!await db.Members.AnyAsync())
        {
            db.Members.AddRange(
                new Member
                {
                    Name        = "Budi Santoso",
                    NationalId  = "3201010101800001",
                    Email       = "budi@koperasiqu.id",
                    PhoneNumber = "081234567890",
                    Address     = "Jl. Merdeka No. 1, Jakarta",
                    BaseLimit   = 5_000_000,
                    PinHash     = defaultPinHash,
                },
                new Member
                {
                    Name        = "Siti Rahayu",
                    NationalId  = "3201010101850002",
                    Email       = "siti@koperasiqu.id",
                    PhoneNumber = "082345678901",
                    Address     = "Jl. Sudirman No. 10, Bandung",
                    BaseLimit   = 3_000_000,
                    PinHash     = defaultPinHash,
                },
                new Member
                {
                    Name        = "Ahmad Basuki",
                    NationalId  = "3201010101900003",
                    Email       = "ahmad@koperasiqu.id",
                    PhoneNumber = "083456789012",
                    Address     = "Jl. Pahlawan No. 5, Surabaya",
                    BaseLimit   = 10_000_000,
                    PinHash     = defaultPinHash,
                }
            );
        }
        else
        {
            // ── Patch: set PIN default untuk member yang belum punya PIN ────
            var membersWithoutPin = await db.Members
                .Where(m => m.PinHash == null || m.PinHash == string.Empty)
                .ToListAsync();

            if (membersWithoutPin.Any())
            {
                foreach (var m in membersWithoutPin)
                {
                    m.PinHash    = defaultPinHash;
                    m.UpdatedAt  = DateTime.UtcNow;
                }
                Console.WriteLine($"[Seeder] Set default PIN untuk {membersWithoutPin.Count} anggota.");
            }
        }

        await db.SaveChangesAsync();
    }
}
