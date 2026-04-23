namespace KoperasiQu.API.Domain.Exceptions;

public class DomainException(string message) : Exception(message);

public class CreditLimitExceededException(decimal requested, decimal limit)
    : DomainException(
        $"Jumlah pinjaman ({requested:N0}) melebihi batas kredit anggota ({limit:N0}).");

public class ActiveLoanExistsException()
    : DomainException(
        "Anggota masih memiliki pinjaman aktif yang belum lunas. Pengajuan baru tidak dapat diproses.");

public class InvalidLoanStateException(string current, string expected)
    : DomainException(
        $"Operasi tidak valid. Status pinjaman saat ini: '{current}', diperlukan: '{expected}'.");

public class MemberInactiveException(string memberName)
    : DomainException($"Anggota '{memberName}' tidak aktif dan tidak dapat mengajukan pinjaman.");
