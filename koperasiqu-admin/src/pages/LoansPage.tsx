import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Eye } from 'lucide-react'
import api from '../lib/api'
import type { LoanSummary, LoanDetail, Installment } from '../types'
import { fmtCurrency, fmtDate, statusColor, statusLabel } from '../lib/utils'
import { toast } from 'react-hot-toast'

function LoanDetailModal({ loanId, onClose }: { loanId: string; onClose: () => void }) {
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [paying, setPaying] = useState<string | null>(null)

  useEffect(() => {
    api.get<LoanDetail>(`/loans/${loanId}`).then(r => setLoan(r.data))
  }, [loanId])

  const recordPayment = async (inst: Installment) => {
    setPaying(inst.id)
    try {
      await api.post(`/loans/installments/${inst.id}/pay`, {
        installmentId: inst.id,
        amountPaid: inst.amountToPay,
        note: 'Dibayar via Admin Panel'
      })
      toast.success(`Cicilan #${inst.installmentNumber} berhasil dicatat!`)
      const { data } = await api.get<LoanDetail>(`/loans/${loanId}`)
      setLoan(data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Gagal catat pembayaran.')
    } finally {
      setPaying(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in">
        {!loan ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">{loan.memberName}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[loan.status]}`}>
                  {statusLabel[loan.status]}
                </span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                ['Pinjaman', fmtCurrency(loan.amount)],
                ['Tenor', `${loan.tenorMonths} bulan`],
                ['Cicilan/Bln', fmtCurrency(loan.monthlyInstallment)],
                ['Total Bunga', fmtCurrency(loan.totalInterest)],
                ['Total Bayar', fmtCurrency(loan.totalAmountDue)],
                ['Cair', fmtDate(loan.disbursementDate)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{k}</p>
                  <p className="font-semibold text-gray-900 text-sm">{v}</p>
                </div>
              ))}
            </div>

            {/* Installments */}
            {loan.installments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-sm text-gray-700">Jadwal Cicilan</h3>
                <div className="space-y-2">
                  {loan.installments.map(inst => (
                    <div key={inst.id}
                      className={`flex flex-col p-3 rounded-lg border text-sm
                        ${inst.isPaid ? 'bg-green-50 border-green-200' :
                          inst.isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">Cicilan #{inst.installmentNumber}</span>
                          <span className="text-gray-500 ml-2 text-xs">— {fmtDate(inst.dueDate)}</span>
                          {inst.isOverdue && !inst.isPaid && (
                            <span className="ml-2 text-xs text-red-500 font-medium">TERLAMBAT (+Rp {inst.penaltyAmount || 0})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{fmtCurrency(inst.amountToPay + (inst.penaltyAmount || 0))}</span>
                          {inst.isPaid ? (
                            <span className="text-xs text-green-600 font-medium">✅ Lunas</span>
                          ) : inst.receiptUrl && !inst.isVerified ? (
                            <button
                              onClick={async () => {
                                setPaying(inst.id)
                                try {
                                  await api.post(`/loans/installments/${inst.id}/verify-receipt`);
                                  toast.success(`Struk Cicilan #${inst.installmentNumber} diverifikasi!`);
                                  const { data } = await api.get<LoanDetail>(`/loans/${loanId}`);
                                  setLoan(data);
                                } catch (e: any) {
                                  toast.error(e.response?.data?.detail ?? 'Gagal memverifikasi struk.');
                                } finally {
                                  setPaying(null);
                                }
                              }}
                              disabled={paying === inst.id}
                              className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 focus:ring-2 disabled:opacity-60 font-medium"
                            >
                              {paying === inst.id ? '...' : 'Verifikasi Bukti Transfer'}
                            </button>
                          ) : (
                            <button
                              onClick={() => recordPayment(inst)}
                              disabled={paying === inst.id}
                              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 font-medium"
                            >
                              {paying === inst.id ? '...' : 'Bayar Kas/Tunai'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tampilkan gambar bukti kiriman nasabah jika ada */}
                      {inst.receiptUrl && !inst.isVerified && (
                        <div className="mt-3 border-t pt-3 border-gray-200/60">
                          <p className="text-xs text-gray-500 mb-2">📸 Member melampirkan bukti transfer:</p>
                          <a href={`http://localhost:5249${inst.receiptUrl}`} target="_blank" rel="noreferrer" className="block max-w-xs">
                            <img src={`http://localhost:5249${inst.receiptUrl}`} alt="Bukti TF" className="w-full h-auto rounded-lg border border-gray-200 shadow-sm" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function LoansPage() {
  const [loans, setLoans]     = useState<LoanSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<LoanSummary[]>('/loans', {
        params: filter ? { status: filter } : {}
      })
      setLoans(data)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const filtered = loans.filter(l =>
    l.memberName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Pinjaman</h1>
        <p className="text-sm text-gray-500 mt-0.5">{loans.length} pinjaman total</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                            focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            placeholder="Cari nama anggota..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white
                       focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Active">Aktif</option>
            <option value="Completed">Lunas</option>
            <option value="Rejected">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100 bg-gray-50">
                  {['Anggota', 'Nominal', 'Tenor', 'Cicilan/Bln', 'Total Bayar', 'Status', 'Tgl Ajuan', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">{l.memberName}</td>
                    <td className="px-5 py-3 text-gray-700">{fmtCurrency(l.amount)}</td>
                    <td className="px-5 py-3 text-gray-600">{l.tenorMonths} bln</td>
                    <td className="px-5 py-3 font-semibold text-indigo-600">{fmtCurrency(l.monthlyInstallment)}</td>
                    <td className="px-5 py-3 text-gray-700">{fmtCurrency(l.totalAmountDue)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[l.status]}`}>
                        {statusLabel[l.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(l.appliedAt)}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setDetailId(l.id)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium">
                        <Eye size={13} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">Tidak ada data pinjaman.</div>
            )}
          </div>
        )}
      </div>

      {detailId && <LoanDetailModal loanId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
