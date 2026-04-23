namespace KoperasiQu.API.Domain.Enums;

public enum LoanStatus
{
    Pending   = 0,
    PendingManager = 4,
    Active    = 1,
    Rejected  = 2,
    Completed = 3
}

public enum AdminRole
{
    Staff = 0,
    Manager = 1
}

public enum MemberStatus
{
    Active    = 0,
    Inactive  = 1,
    Suspended = 2
}
