export interface Member {
  id: string
  name: string
  nationalId: string
  email: string
  phoneNumber: string
  baseLimit: number
  status: string
  joinedAt: string
  totalLoans: number
  hasActiveLoan: boolean
  creditScore: number
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

export interface LoanSummary {
  id: string
  memberId: string
  memberName: string
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

export interface LoanDetail extends LoanSummary {
  totalInterest: number
  rejectionReason: string | null
  reviewedAt: string | null
  installments: Installment[]
}

export interface AuthState {
  token: string
  memberId: string
  name: string
  baseLimit: number
}

export interface MemberLoginResponse {
  token: string
  memberId: string
  name: string
  nationalId: string
  phoneNumber: string
  baseLimit: number
  status: string
  creditScore: number
  expiresAt: string
}

// Navigation types
export type RootStackParamList = {
  Login:      undefined
  Dashboard:  undefined
  ApplyLoan:  undefined
  LoanDetail: { loanId: string }
  MyLoans:    undefined
  Tracking:   { loanId: string }   // Dedicated tracking untuk pinjaman aktif
  ChangePin:  undefined
}
