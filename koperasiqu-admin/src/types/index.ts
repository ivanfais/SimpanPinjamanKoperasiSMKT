// ════════════════════════════════════════
// Auth Types
// ════════════════════════════════════════
export interface LoginRequest { username: string; password: string }
export interface AuthState {
  token: string; username: string; fullName: string; expiresAt: string
}

// ════════════════════════════════════════
// Member Types
// ════════════════════════════════════════
export interface Member {
  id: string
  name: string
  nationalId: string
  email: string
  phoneNumber: string
  address: string
  baseLimit: number
  status: string
  joinedAt: string
  totalLoans: number
  hasActiveLoan: boolean
  creditScore: number
}

export interface CreateMemberPayload {
  name: string; nationalId: string; email: string
  phoneNumber: string; address: string; baseLimit: number
}

export interface UpdateMemberPayload {
  name: string; phoneNumber: string; address: string
  baseLimit: number; status: string
}

// ════════════════════════════════════════
// Loan Types
// ════════════════════════════════════════
export interface LoanSummary {
  id: string
  memberId: string
  memberName: string
  memberPhone: string
  amount: number
  tenorMonths: number
  interestRatePerMonth: number
  monthlyInstallment: number
  totalAmountDue: number
  status: string
  purpose: string | null
  appliedAt: string
  disbursementDate: string | null
}

export interface Installment {
  id: string
  loanId: string
  installmentNumber: number
  dueDate: string
  amountToPay: number
  amountPaid: number | null
  isPaid: boolean
  paidAt: string | null
  isOverdue: boolean
  penaltyAmount: number
  receiptUrl: string | null
  isVerified: boolean
}

export interface LoanAuditLog {
  id: string
  adminId: string | null
  adminName: string
  action: string
  notes: string | null
  createdAt: string
}

export interface LoanDetail extends LoanSummary {
  totalInterest: number
  rejectionReason: string | null
  reviewedAt: string | null
  installments: Installment[]
  auditLogs: LoanAuditLog[]
}

// ════════════════════════════════════════
// Dashboard Types
// ════════════════════════════════════════
export interface DashboardStats {
  totalMembers: number
  totalActiveLoans: number
  totalPendingLoans: number
  totalLoanAmountActive: number
  totalCollectedThisMonth: number
  recentPendingLoans: LoanSummary[]
}
