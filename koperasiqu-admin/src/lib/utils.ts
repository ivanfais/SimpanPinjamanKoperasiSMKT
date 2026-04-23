export const fmtCurrency = (n: number | null | undefined) => {
  if (n === null || n === undefined || isNaN(n as number)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export const fmtDate = (iso: string | Date | null | undefined) => {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export const fmtDateFull = (iso: string | Date | null | undefined) => {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

export const statusColor: Record<string, string> = {
  Pending:   'bg-yellow-100 text-yellow-700',
  PendingManager: 'bg-purple-100 text-purple-700',
  Active:    'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-600',
}

export const statusLabel: Record<string, string> = {
  Pending:   '⏳ Menunggu Staf',
  PendingManager: '👑 Tunggu Manager',
  Active:    '🔵 Aktif',
  Completed: '✅ Lunas',
  Rejected:  '❌ Ditolak',
}
