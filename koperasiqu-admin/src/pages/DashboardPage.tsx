import { useEffect, useState } from 'react'
import { Users, TrendingUp, Clock, CheckCircle2, Wallet } from 'lucide-react'
import api from '../lib/api'
import type { DashboardStats, LoanSummary } from '../types'
import { fmtCurrency, fmtDate, statusColor, statusLabel } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string
}) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 animate-in">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const nav = useNavigate()
  
  // Date Filter states for Export - Use local date instead of ISO
  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(getLocalDate())

  useEffect(() => {
    console.log('Fetching dashboard stats...');
    api.get<DashboardStats>('/loans/dashboard')
      .then(r => {
        console.log('Stats received:', r.data);
        setStats(r.data);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        // Fallback or error state could be added here
      });
  }, [])

  if (!stats) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan aktivitas KoperasiQu</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Periode Export:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-gray-400">s/d</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={async () => {
              const toast = (await import('react-hot-toast')).default;
              const tid = toast.loading('Menyiapkan data laporan...');
              try {
                let url = '/loans?status=Active'
                if (startDate) url += `&startDate=${startDate}`
                if (endDate)   url += `&endDate=${endDate}`

                const { data } = await api.get(url);
                if (!data || data.length === 0) {
                  toast.error('Tidak ada data untuk periode ini.', { id: tid });
                  return;
                }

                const XLSX = await import('xlsx');
                const sheetData = data.map((l: any) => ({
                  "ID Pinjaman": String(l.id || '').slice(0, 8),
                  "Nama Nasabah": l.memberName || '-',
                  "Nominal": Number(l.amount || 0),
                  "Tenor": Number(l.tenorMonths || 0),
                  "Cicilan": Number(l.monthlyInstallment || 0),
                  "Tanggal": l.disbursementDate ? new Date(l.disbursementDate).toLocaleDateString('id-ID') : '-'
                }));

                const ws = XLSX.utils.json_to_sheet(sheetData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Pinjaman Aktif");
                
                // Paling stabil: ArrayBuffer
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                
                const urlObj = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = urlObj;
                a.download = `Laporan_Pinjaman_${new Date().getTime()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(urlObj);
                
                toast.success('Laporan berhasil didownload!', { id: tid });
              } catch (err) {
                console.error(err);
                toast.error('Gagal mendownload laporan.', { id: tid });
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <span>📊 Export Laporan (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard icon={Users}       label="Total Anggota"    value={String(stats.totalMembers)}            color="bg-indigo-500" />
        <StatCard icon={TrendingUp}  label="Pinjaman Aktif"   value={String(stats.totalActiveLoans)}        color="bg-blue-500"   />
        <StatCard icon={Clock}       label="Menunggu Approval" value={String(stats.totalPendingLoans)}       color="bg-amber-500"  />
        <StatCard icon={Wallet}      label="Total Aktif"       value={fmtCurrency(stats.totalLoanAmountActive)} color="bg-violet-500" />
        <StatCard icon={CheckCircle2} label="Terkumpul Bulan Ini" value={fmtCurrency(stats.totalCollectedThisMonth)} color="bg-emerald-500" />
      </div>

      {/* Pending Loans Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Pengajuan Terbaru (Pending)</h2>
          <button
            onClick={() => nav('/approval')}
            className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
          >
            Lihat Semua →
          </button>
        </div>
        {stats.recentPendingLoans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Tidak ada pengajuan pending.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Anggota</th>
                  <th className="px-5 py-3 font-medium">Nominal</th>
                  <th className="px-5 py-3 font-medium">Tenor</th>
                  <th className="px-5 py-3 font-medium">Cicilan/Bln</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPendingLoans.map((l: LoanSummary) => (
                  <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{l.memberName}</td>
                    <td className="px-5 py-3 text-gray-700">{fmtCurrency(l.amount)}</td>
                    <td className="px-5 py-3 text-gray-600">{l.tenorMonths} bln</td>
                    <td className="px-5 py-3 font-semibold text-indigo-600">{fmtCurrency(l.monthlyInstallment)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(l.appliedAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[l.status]}`}>
                        {statusLabel[l.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
