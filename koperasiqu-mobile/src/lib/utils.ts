import { INTEREST_RATE } from '../constants'

export const fmtCurrency = (n: number) =>
  'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n))

export const fmtCurrencyInput = (val: string): string => {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

export const parseCurrencyInput = (val: string): number =>
  Number(val.replace(/\./g, '').replace(/,/g, ''))

export const calcInstallment = (amount: number, tenor: number): {
  monthly: number
  totalInterest: number
  totalDue: number
} => {
  const totalInterest = amount * (INTEREST_RATE / 100) * tenor
  const totalDue      = amount + totalInterest
  const monthly       = Math.round(totalDue / tenor)
  return { monthly, totalInterest, totalDue }
}

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(iso))
}
