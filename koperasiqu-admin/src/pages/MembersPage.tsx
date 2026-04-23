import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, UserCheck, UserX, Pencil, X, RotateCcw, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../lib/api'
import type { Member, CreateMemberPayload, UpdateMemberPayload } from '../types'
import { fmtCurrency, fmtDate } from '../lib/utils'

const LIMIT_OPTIONS = [500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 7_500_000, 10_000_000]

// ─── Modal Tambah Anggota ─────────────────────────────────────────────────────
function AddMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<CreateMemberPayload>({
    name: '', nationalId: '', email: '', phoneNumber: '', address: '', baseLimit: 1_000_000
  })
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/members', form)
      toast.success('Anggota berhasil ditambahkan!')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : 'Gagal menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Tambah Anggota Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handle} className="space-y-4">
          {[
            { label: 'Nama Lengkap', field: 'name'        as keyof CreateMemberPayload, type: 'text',  placeholder: 'Budi Santoso'           },
            { label: 'NIK KTP (16 digit)', field: 'nationalId' as keyof CreateMemberPayload, type: 'text',  placeholder: '3201010101800001'       },
            { label: 'Email',        field: 'email'        as keyof CreateMemberPayload, type: 'email', placeholder: 'budi@email.com'          },
            { label: 'No. HP',       field: 'phoneNumber'  as keyof CreateMemberPayload, type: 'tel',   placeholder: '08123456789'             },
            { label: 'Alamat',       field: 'address'      as keyof CreateMemberPayload, type: 'text',  placeholder: 'Jl. Merdeka No.1, Jakarta'},
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type={type} required placeholder={placeholder}
                value={form[field] as string}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Batas Kredit (BaseLimit)
            </label>
            <select
              value={form.baseLimit}
              onChange={e => setForm(p => ({ ...p, baseLimit: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {LIMIT_OPTIONS.map(v => <option key={v} value={v}>{fmtCurrency(v)}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">Range: Rp 500.000 – Rp 10.000.000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold
                         hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan Anggota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Edit CreditLimit ───────────────────────────────────────────────────
function EditMemberModal({ member, onClose, onSaved }: {
  member: Member
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<UpdateMemberPayload>({
    name:        member.name,
    phoneNumber: member.phoneNumber,
    address:     member.address,
    baseLimit:   member.baseLimit,
    status:      member.status,
  })
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/members/${member.id}`, form)
      toast.success(`Data ${member.name} berhasil diperbarui!`)
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Gagal menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold">Edit Anggota</h2>
            <p className="text-sm text-gray-500 mt-0.5">NIK: {member.nationalId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handle} className="space-y-4">
          {[
            { label: 'Nama Lengkap', field: 'name'        as keyof UpdateMemberPayload, type: 'text' },
            { label: 'No. HP',       field: 'phoneNumber'  as keyof UpdateMemberPayload, type: 'tel'  },
            { label: 'Alamat',       field: 'address'      as keyof UpdateMemberPayload, type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type={type} required
                value={form[field] as string}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          ))}

          {/* ─── Batas Kredit ─── */}
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <label className="block text-sm font-semibold text-indigo-800 mb-1.5">
              💳 Batas Kredit (CreditLimit)
            </label>
            <select
              value={form.baseLimit}
              onChange={e => setForm(p => ({ ...p, baseLimit: Number(e.target.value) }))}
              className="w-full border border-indigo-200 bg-white rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-indigo-700"
            >
              {LIMIT_OPTIONS.map(v => (
                <option key={v} value={v}>{fmtCurrency(v)}</option>
              ))}
            </select>
            <p className="text-xs text-indigo-500 mt-1.5">
              Saat ini: <strong>{fmtCurrency(member.baseLimit)}</strong> →
              Baru: <strong>{fmtCurrency(form.baseLimit)}</strong>
            </p>
          </div>

          {/* ─── Status ─── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status Anggota</label>
            <div className="flex gap-2">
              {['Active', 'Inactive', 'Suspended'].map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setForm(p => ({ ...p, status: s }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    form.status === s
                      ? s === 'Active'    ? 'bg-green-600 text-white border-green-600'
                      : s === 'Inactive'  ? 'bg-gray-600 text-white border-gray-600'
                      :                    'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s === 'Active' ? '✅' : s === 'Inactive' ? '⛔' : '🚫'} {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold
                         hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers]   = useState<Member[]>([])
  const [filtered, setFiltered] = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [addModal, setAddModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<Member | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<Member[]>('/members')
      setMembers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.nationalId.includes(q) ||
      m.phoneNumber.includes(q)
    ))
  }, [search, members])

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Anggota</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} anggota terdaftar</p>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                     hover:bg-indigo-700 transition-colors text-sm font-semibold">
          <Plus size={16} /> Tambah Anggota
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
          placeholder="Cari nama, email, NIK, atau no. HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100 bg-gray-50">
                  {['Nama', 'NIK', 'Email', 'No. HP', 'Batas Kredit', 'Skor Kredit', 'Status', 'Pinjaman', 'Bergabung', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{m.nationalId}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{m.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-indigo-600">{fmtCurrency(m.baseLimit)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        (m.creditScore ?? 100) >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                        (m.creditScore ?? 100) >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {(m.creditScore ?? 100) >= 80 ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                        {m.creditScore ?? 100} / 100
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        m.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : m.status === 'Suspended'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.status === 'Active' ? <UserCheck size={10} /> : <UserX size={10} />}
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-700">{m.totalLoans}</span>
                      {m.hasActiveLoan && (
                        <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">aktif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(m.joinedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditTarget(m)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600
                                     rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors
                                     border border-indigo-200 whitespace-nowrap"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        
                        {(m.creditScore ?? 100) < 100 && (
                          <button
                            onClick={async () => {
                              if(confirm('Yakin mereset skor kredit anggota ini kembali ke 100?')) {
                                try {
                                  await api.post(`/members/${m.id}/reset-score`);
                                  toast.success('Skor kredit berhasil di-reset!');
                                  load();
                                } catch (e: any) {
                                  toast.error(e.response?.data?.detail ?? 'Gagal reset skor');
                                }
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-50 text-yellow-700
                                       rounded-lg text-xs font-semibold hover:bg-yellow-100 transition-colors
                                       border border-yellow-200 whitespace-nowrap"
                            title="Reset Skor Kredit"
                          >
                            <RotateCcw size={12} /> Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">Tidak ada anggota ditemukan.</div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {addModal && <AddMemberModal onClose={() => setAddModal(false)} onSaved={load} />}
      {editTarget && <EditMemberModal member={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />}
    </div>
  )
}
