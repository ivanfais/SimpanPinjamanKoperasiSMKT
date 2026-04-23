// IP PC kamu di jaringan WiFi lokal
// Ubah jika HP tidak bisa connect (cek dengan: ipconfig → IPv4 Wi-Fi)
export const API_BASE_URL = 'http://10.176.10.1:5249/api'

export const INTEREST_RATE = 1.5 // % per bulan (flat rate)

export const TENOR_OPTIONS = [
  { label: '3 Bulan',  value: 3  },
  { label: '6 Bulan',  value: 6  },
  { label: '12 Bulan', value: 12 },
  { label: '24 Bulan', value: 24 },
]

export const MIN_LOAN = 500_000
export const MAX_LOAN = 10_000_000

export const COLORS = {
  primary:       '#4F46E5',
  primaryLight:  '#EEF2FF',
  primaryDark:   '#3730A3',
  secondary:     '#0EA5E9',
  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
  gray50:        '#F9FAFB',
  gray100:       '#F3F4F6',
  gray200:       '#E5E7EB',
  gray400:       '#9CA3AF',
  gray500:       '#6B7280',
  gray700:       '#374151',
  gray900:       '#111827',
  white:         '#FFFFFF',
  black:         '#000000',
}
