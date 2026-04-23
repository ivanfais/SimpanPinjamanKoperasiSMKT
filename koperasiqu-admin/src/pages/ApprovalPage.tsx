import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  CheckCircle, XCircle, RefreshCw, Eye,
  LayoutGrid, List, AlertCircle
} from 'lucide-react'
import api from '../lib/api'
import type { LoanSummary, LoanDetail } from '../types'
import { fmtCurrency, fmtDate, fmtDateFull } from '../lib/utils'
import { getAdminIdFromToken, getAdminRoleFromToken } from '../lib/jwt'

// ─── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({ loan, onConfirm, onClose }: {
  loan: LoanSummary; onConfirm: (date: string) => void; onClose: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Konfirmasi Approve</h2>
            <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Anggota</span>
            <span className="font-semibold">{loan.memberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nominal</span>
            <span className="font-semibold text-indigo-600">{fmtCurrency(loan.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tenor</span>
            <span className="font-semibold">{loan.tenorMonths} bulan</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-500">Cicilan/Bulan</span>
            <span className="font-bold text-green-600">{fmtCurrency(loan.monthlyInstallment)}</span>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            📅 Tanggal Pencairan
          </label>
          <input
            type="date" value={date} min={today}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Sistem akan otomatis generate <strong>{loan.tenorMonths} cicilan</strong> mulai dari tanggal ini.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Batal
          </button>
          <button onClick={() => onConfirm(date)}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-green-700 active:scale-95 transition-all">
            ✅ Ya, Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ loan, onConfirm, onClose }: {
  loan: LoanSummary; onConfirm: (reason: string) => void; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const isValid = reason.trim().length >= 10

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Tolak Pengajuan</h2>
            <p className="text-xs text-gray-500">{loan.memberName} — {fmtCurrency(loan.amount)}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Alasan Penolakan <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3} value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Minimal 10 karakter. Contoh: Anggota memiliki pinjaman aktif yang belum lunas..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                       focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none"
          />
          <div className="flex justify-between mt-1">
            <p className={`text-xs ${isValid ? 'text-green-500' : 'text-gray-400'}`}>
              {isValid ? '✓ Valid' : `Minimal 10 karakter (${reason.trim().length}/10)`}
            </p>
            <p className="text-xs text-gray-400">{reason.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            Batal
          </button>
          <button onClick={() => isValid && onConfirm(reason)}
            disabled={!isValid}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold
                       hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
            ❌ Ya, Tolak
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ loanId, onClose, onApprove, onReject }: {
  loanId: string; onClose: () => void
  onApprove: (loan: LoanSummary) => void
  onReject: (loan: LoanSummary) => void
}) {
  const [loan, setLoan] = useState<LoanDetail | null>(null)

  useEffect(() => {
    api.get<LoanDetail>(`/loans/${loanId}`).then(r => setLoan(r.data))
  }, [loanId])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900">Detail Pengajuan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!loan ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2.5 text-sm mb-5">
              {[
                ['Nama Anggota',  loan.memberName],
                ['No. Telepon',   loan.memberPhone],
                ['Nominal',       fmtCurrency(loan.amount)],
                ['Tenor',         `${loan.tenorMonths} bulan`],
                ['Bunga',         `${loan.interestRatePerMonth}%/bulan (flat rate)`],
                ['Total Bunga',   fmtCurrency(loan.totalInterest)],
                ['Total Bayar',   fmtCurrency(loan.totalAmountDue)],
                ['Cicilan/Bln',   fmtCurrency(loan.monthlyInstallment)],
                ['Tujuan',        loan.purpose ?? '-'],
                ['Tgl Pengajuan', fmtDateFull(loan.appliedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>

            {/* Audit Trail Section — OPSI B Implementation */}
            {loan.auditLogs && loan.auditLogs.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                   📜 Riwayat Aktivitas (Audit Trail)
                </h3>
                <div className="space-y-4">
                  {loan.auditLogs.map((log, idx) => (
                    <div key={log.id} className="relative flex gap-4">
                      {idx !== loan.auditLogs.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-gray-100" />
                      )}
                      <div className={`w-5 h-5 rounded-full z-10 flex items-center justify-center text-[10px] ${
                        log.action === 'Approved' ? 'bg-green-100 text-green-600' :
                        log.action === 'Rejected' ? 'bg-red-100 text-red-600' :
                        log.action === 'Applied'  ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action === 'Approved' ? '✓' : 
                         log.action === 'Rejected' ? '✕' : 
                         log.action === 'Applied'  ? '📝' : '•'}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className="text-xs font-bold text-gray-900">
                            {log.action === 'Applied' ? 'Pengajuan Baru' :
                             log.action === 'Approved' ? 'Persetujuan' :
                             log.action === 'Rejected' ? 'Penolakan' :
                             log.action === 'PendingManager' ? 'Escalation to Manager' :
                             log.action === 'PaymentVerified' ? 'Pembayaran Diverifikasi' :
                             log.action === 'Completed' ? 'Pinjaman Selesai' : log.action}
                          </p>
                          <span className="text-[10px] text-gray-400">{fmtDate(log.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">{log.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                Tutup
              </button>
              {(loan.status === 'Pending' || loan.status === 'PendingManager') && (
                <>
                  <button
                    onClick={() => { onReject(loan as unknown as LoanSummary); onClose() }}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200
                               rounded-lg text-sm font-semibold hover:bg-red-100">
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => { onApprove(loan as unknown as LoanSummary); onClose() }}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                    ✅ Approve
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ApprovalPage() {
  const [loans, setLoans]       = useState<LoanSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<LoanSummary | null>(null)
  const [modal, setModal]       = useState<'approve' | 'reject' | 'detail' | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [view, setView]         = useState<'card' | 'table'>('card')
  const [processing, setProcessing] = useState<string | null>(null)

  const adminId = getAdminIdFromToken()

  const adminRole = getAdminRoleFromToken()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (adminRole === 'Manager') {
        const [resPending, resPendingMgr] = await Promise.all([
          api.get<LoanSummary[]>('/loans/pending'),
          api.get<LoanSummary[]>('/loans?status=PendingManager')
        ])
        setLoans([...resPending.data, ...resPendingMgr.data])
      } else {
        const { data } = await api.get<LoanSummary[]>('/loans/pending')
        setLoans(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (date: string) => {
    if (!selected) return
    setProcessing(selected.id)
    try {
      await api.post(`/loans/${selected.id}/approve`, {
        loanId: selected.id, adminId, disbursementDate: date
      })
      if (selected.amount > 5000000 && adminRole === 'Staff') {
        toast.success(`Pinjaman ${selected.memberName} Diteruskan ke Manager! (Nominal > 5 Jt)`)
      } else {
        toast.success(`🎉 Pinjaman ${selected.memberName} di-approve! ${selected.tenorMonths} cicilan ter-generate.`)
      }
      setModal(null)
      setSelected(null)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Gagal approve.')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (reason: string) => {
    if (!selected) return
    setProcessing(selected.id)
    try {
      await api.post(`/loans/${selected.id}/reject`, {
        loanId: selected.id, adminId, reason
      })
      toast.success(`Pengajuan ${selected.memberName} berhasil ditolak.`)
      setModal(null)
      setSelected(null)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Gagal reject.')
    } finally {
      setProcessing(null)
    }
  }

  const openApprove = (loan: LoanSummary) => { setSelected(loan); setModal('approve') }
  const openReject  = (loan: LoanSummary) => { setSelected(loan); setModal('reject')  }

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Pinjaman</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : (
              <>
                <span className="font-semibold text-amber-600">{loans.length}</span> pengajuan menunggu review
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('card')}
              className={`p-1.5 rounded-md transition-colors ${view === 'card' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!loading && loans.length === 0 && (
        <div className="text-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <p className="text-gray-700 font-semibold">Semua Bersih!</p>
          <p className="text-gray-400 text-sm mt-1">Tidak ada pengajuan yang perlu di-review saat ini.</p>
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {!loading && loans.length > 0 && view === 'card' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loans.map(loan => (
            <div key={loan.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4
                         hover:shadow-md transition-shadow animate-in">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{loan.memberName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">📅 {fmtDate(loan.appliedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loan.status === 'PendingManager' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {loan.status === 'PendingManager' ? '👑 MANAGER' : '⏳ STAF'}
                  </span>
                  <button onClick={() => setDetailId(loan.id)}
                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Pinjaman</p>
                  <p className="font-bold text-gray-900">{fmtCurrency(loan.amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Tenor</p>
                  <p className="font-bold text-gray-900">{loan.tenorMonths} Bulan</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 col-span-2">
                  <p className="text-indigo-400 text-xs mb-1">Total Cicilan / Bulan</p>
                  <p className="font-bold text-indigo-700 text-base">{fmtCurrency(loan.monthlyInstallment)}</p>
                </div>
              </div>

              {loan.purpose && (
                <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <AlertCircle size={12} className="mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{loan.purpose}</span>
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={() => openApprove(loan)}
                  disabled={processing === loan.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white
                             text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60
                             active:scale-95 transition-all">
                  <CheckCircle size={15} /> 
                  {adminRole === 'Staff' && loan.amount > 5000000 ? 'Ke Manager' : 'Approve'}
                </button>
                <button
                  onClick={() => openReject(loan)}
                  disabled={processing === loan.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-600
                             text-sm font-semibold rounded-lg border border-red-200
                             hover:bg-red-100 disabled:opacity-60 active:scale-95 transition-all">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {!loading && loans.length > 0 && view === 'table' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100 bg-gray-50">
                  {['Nama Anggota', 'Nominal (Rp)', 'Tenor', 'Cicilan/Bln', 'Total Bayar', 'Tanggal Pengajuan', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{loan.memberName}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${loan.status === 'PendingManager' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {loan.status === 'PendingManager' ? '👑 MANAGER' : '⏳ STAF'}
                          </span>
                        </div>
                        {loan.purpose && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{loan.purpose}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmtCurrency(loan.amount)}</td>
                    <td className="px-5 py-3 text-gray-700">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
                        {loan.tenorMonths} bln
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-indigo-600">{fmtCurrency(loan.monthlyInstallment)}</td>
                    <td className="px-5 py-3 text-gray-600">{fmtCurrency(loan.totalAmountDue)}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(loan.appliedAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailId(loan.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded"
                          title="Lihat detail">
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openApprove(loan)}
                          disabled={processing === loan.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white
                                     text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60">
                          <CheckCircle size={12} /> 
                          {adminRole === 'Staff' && loan.amount > 5000000 ? 'Ke Manager' : 'Approve'}
                        </button>
                        <button
                          onClick={() => openReject(loan)}
                          disabled={processing === loan.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600
                                     text-xs font-semibold rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-60">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'approve' && selected && (
        <ApproveModal loan={selected} onConfirm={handleApprove} onClose={() => setModal(null)} />
      )}
      {modal === 'reject' && selected && (
        <RejectModal loan={selected} onConfirm={handleReject} onClose={() => setModal(null)} />
      )}
      {detailId && (
        <DetailModal
          loanId={detailId}
          onClose={() => setDetailId(null)}
          onApprove={openApprove}
          onReject={openReject}
        />
      )}
    </div>
  )
}
