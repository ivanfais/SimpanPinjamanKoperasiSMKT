import { useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'koperasi-digital-v1'
const ADMIN_ID = 'u-admin'

const baseState = {
  users: [
    { id: ADMIN_ID, name: 'Admin Koperasi', role: 'admin' },
    { id: 'u-budi', name: 'Budi Santoso', role: 'client', memberId: 'm-budi' },
    { id: 'u-siti', name: 'Siti Rahmah', role: 'client', memberId: 'm-siti' },
    { id: 'u-andi', name: 'Andi Wijaya', role: 'client', memberId: 'm-andi' },
  ],
  members: [
    { id: 'm-budi', userId: 'u-budi', savingsBalance: 8500000, limitMultiplier: 3, active: true, phone: '0812-3456-7890' },
    { id: 'm-siti', userId: 'u-siti', savingsBalance: 5000000, limitMultiplier: 3, active: true, phone: '0856-9988-1122' },
    { id: 'm-andi', userId: 'u-andi', savingsBalance: 14000000, limitMultiplier: 3, active: true, phone: '0821-4433-2211' },
  ],
  loans: [
    {
      id: 'L-2026-1001',
      memberId: 'm-budi',
      amount: 12000000,
      tenorMonths: 12,
      monthlyRate: 0.012,
      monthlyInstallment: 1183000,
      status: 'active',
      createdAt: '2026-01-10',
      approvedAt: '2026-01-11',
      dueDate: '2026-12-15',
      remainingBalance: 8450000,
      purpose: 'Modal usaha mikro',
      approvedBy: ADMIN_ID,
    },
    {
      id: 'L-2026-1002',
      memberId: 'm-siti',
      amount: 8000000,
      tenorMonths: 6,
      monthlyRate: 0.01,
      monthlyInstallment: 1380000,
      status: 'pending',
      createdAt: '2026-04-18',
      dueDate: null,
      remainingBalance: 8000000,
      purpose: 'Biaya pendidikan',
      approvedBy: null,
    },
    {
      id: 'L-2026-1003',
      memberId: 'm-andi',
      amount: 50000000,
      tenorMonths: 24,
      monthlyRate: 0.008,
      monthlyInstallment: 2483333,
      status: 'approved',
      createdAt: '2026-04-14',
      approvedAt: '2026-04-19',
      dueDate: '2028-04-20',
      remainingBalance: 50000000,
      purpose: 'Ekspansi warung',
      approvedBy: ADMIN_ID,
    },
  ],
  installments: [
    { id: 'I-1', loanId: 'L-2026-1001', period: 1, dueDate: '2026-02-15', amount: 1183000, status: 'paid', paidAt: '2026-02-12' },
    { id: 'I-2', loanId: 'L-2026-1001', period: 2, dueDate: '2026-03-15', amount: 1183000, status: 'paid', paidAt: '2026-03-14' },
    { id: 'I-3', loanId: 'L-2026-1001', period: 3, dueDate: '2026-04-15', amount: 1183000, status: 'unpaid', paidAt: null },
  ],
}

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return baseState
  try {
    return JSON.parse(raw)
  } catch {
    return baseState
  }
}

function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

function makeInstallmentSchedule({ loanId, amount, tenorMonths, monthlyInstallment }) {
  const today = new Date()
  return Array.from({ length: tenorMonths }).map((_, idx) => {
    const due = new Date(today.getFullYear(), today.getMonth() + idx + 1, 15)
    return {
      id: `${loanId}-I${idx + 1}`,
      loanId,
      period: idx + 1,
      dueDate: due.toISOString().slice(0, 10),
      amount: monthlyInstallment,
      status: 'unpaid',
      paidAt: null,
    }
  })
}

function getStatusLabel(status) {
  if (status === 'pending') return 'MENUNGGU'
  if (status === 'approved') return 'DISETUJUI'
  if (status === 'active') return 'AKTIF'
  if (status === 'completed') return 'LUNAS'
  return 'DITOLAK'
}

function App() {
  const [appState, setAppState] = useState(loadState)
  const [activeUserId, setActiveUserId] = useState('u-budi')
  const [clientTab, setClientTab] = useState('dashboard')
  const [adminTab, setAdminTab] = useState('dashboard')
  const [loanAmount, setLoanAmount] = useState(1000000)
  const [tenor, setTenor] = useState(3)
  const [purpose, setPurpose] = useState('Modal usaha mikro')

  const activeUser = appState.users.find((u) => u.id === activeUserId)
  const activeMember = appState.members.find((m) => m.userId === activeUserId)

  const memberMap = useMemo(
    () => Object.fromEntries(appState.members.map((m) => [m.id, m])),
    [appState.members],
  )
  const userMap = useMemo(
    () => Object.fromEntries(appState.users.map((u) => [u.id, u])),
    [appState.users],
  )

  const persistState = (updater) => {
    setAppState((prev) => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }

  const submitLoan = () => {
    if (!activeMember) return
    const maxLimit = activeMember.savingsBalance * activeMember.limitMultiplier
    if (loanAmount > maxLimit) {
      window.alert(`Melebihi limit pinjaman. Maksimal: ${formatCurrency(maxLimit)}`)
      return
    }
    const monthlyRate = 0.0075
    const monthlyInstallment = Math.round((loanAmount * (1 + monthlyRate * tenor)) / tenor)
    const loanId = `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`
    const newLoan = {
      id: loanId,
      memberId: activeMember.id,
      amount: loanAmount,
      tenorMonths: tenor,
      monthlyRate,
      monthlyInstallment,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      dueDate: null,
      remainingBalance: loanAmount,
      purpose,
      approvedBy: null,
    }
    persistState((prev) => ({ ...prev, loans: [newLoan, ...prev.loans] }))
    setClientTab('riwayat')
  }

  const approveLoan = (loanId) => {
    persistState((prev) => {
      const loan = prev.loans.find((item) => item.id === loanId)
      if (!loan) return prev
      const installments = makeInstallmentSchedule({
        loanId,
        amount: loan.amount,
        tenorMonths: loan.tenorMonths,
        monthlyInstallment: loan.monthlyInstallment,
      })
      const updatedLoans = prev.loans.map((item) =>
        item.id === loanId
          ? {
              ...item,
              status: 'active',
              approvedAt: new Date().toISOString().slice(0, 10),
              dueDate: installments[installments.length - 1]?.dueDate ?? null,
              approvedBy: ADMIN_ID,
            }
          : item,
      )
      return {
        ...prev,
        loans: updatedLoans,
        installments: [...prev.installments, ...installments],
      }
    })
  }

  const rejectLoan = (loanId) => {
    persistState((prev) => ({
      ...prev,
      loans: prev.loans.map((item) => (item.id === loanId ? { ...item, status: 'rejected', approvedBy: ADMIN_ID } : item)),
    }))
  }

  const payInstallment = (installmentId) => {
    persistState((prev) => {
      const current = prev.installments.find((item) => item.id === installmentId)
      if (!current || current.status === 'paid') return prev
      const updatedInstallments = prev.installments.map((item) =>
        item.id === installmentId ? { ...item, status: 'paid', paidAt: new Date().toISOString().slice(0, 10) } : item,
      )
      const unpaidLeft = updatedInstallments.filter((item) => item.loanId === current.loanId && item.status === 'unpaid').length
      const updatedLoans = prev.loans.map((loan) => {
        if (loan.id !== current.loanId) return loan
        const remainingBalance = Math.max(0, loan.remainingBalance - current.amount)
        return {
          ...loan,
          remainingBalance,
          status: unpaidLeft === 0 ? 'completed' : 'active',
        }
      })
      return { ...prev, installments: updatedInstallments, loans: updatedLoans }
    })
  }

  const clientLoans = appState.loans.filter((loan) => loan.memberId === activeMember?.id)
  const currentLoan = clientLoans.find((loan) => loan.status === 'active' || loan.status === 'approved')
  const currentInstallments = appState.installments.filter((item) => item.loanId === currentLoan?.id)
  const pendingLoans = appState.loans.filter((loan) => loan.status === 'pending' || loan.status === 'approved')
  const totalActiveLoan = appState.loans.filter((l) => l.status === 'active').reduce((sum, loan) => sum + loan.remainingBalance, 0)
  const dueInstallments = appState.installments.filter((i) => i.status === 'unpaid').length
  const monthlyCollection = appState.installments.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalSavings = appState.members.reduce((sum, member) => sum + member.savingsBalance, 0)
  const totalLoanAmount = appState.loans.reduce((sum, loan) => sum + loan.amount, 0)
  const avgRate = appState.loans.reduce((sum, loan) => sum + loan.monthlyRate, 0) / appState.loans.length

  return (
    <div className="app-shell">
      <header className={`top-bar ${activeUser?.role === 'admin' ? 'admin-top' : ''}`}>
        <div>
          <h1>Koperasi Digital</h1>
          <p>{activeUser?.role === 'admin' ? 'Pusat Manajemen' : 'Sistem Simpan Pinjam Anggota'}</p>
        </div>
        <div className="role-switcher">
          <span>Masuk Sebagai:</span>
          <select value={activeUserId} onChange={(event) => setActiveUserId(event.target.value)}>
            {appState.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>
      </header>

      {activeUser?.role === 'client' ? (
        <main className="mobile-layout">
          <nav className="mobile-nav">
            {[
              ['dashboard', 'Beranda'],
              ['ajukan', 'Pinjaman'],
              ['bayar', 'Riwayat'],
              ['riwayat', 'Profil'],
            ].map(([id, label]) => (
              <button key={id} type="button" className={clientTab === id ? 'active' : ''} onClick={() => setClientTab(id)}>
                {label}
              </button>
            ))}
          </nav>

          {clientTab === 'dashboard' && (
            <section className="screen">
              <h2>Selamat Pagi, {activeUser.name.split(' ')[0]}</h2>
              <p className="muted">Pantau performa keuangan koperasi Anda hari ini.</p>
              <article className="card accent">
                <small>Limit Pinjaman</small>
                <h3>{formatCurrency((activeMember?.savingsBalance ?? 0) * (activeMember?.limitMultiplier ?? 0))}</h3>
                <button type="button" onClick={() => setClientTab('ajukan')}>Ajukan Pinjaman</button>
              </article>
              <article className="card">
                <div className="between">
                  <strong>Pinjaman Aktif</strong>
                  <small>{currentLoan ? 'Berjalan' : 'Tidak Ada'}</small>
                </div>
                <h3>{formatCurrency(currentLoan?.remainingBalance ?? 0)}</h3>
                <button type="button" onClick={() => setClientTab('bayar')}>Bayar Cicilan</button>
              </article>
            </section>
          )}

          {clientTab === 'ajukan' && (
            <section className="screen">
              <h2>Ajukan Pinjaman</h2>
              <p className="muted">Proses transparan dan cepat untuk anggota aktif.</p>
              <article className="card soft">
                <small>Limit Pinjaman Anda</small>
                <h3>{formatCurrency((activeMember?.savingsBalance ?? 0) * (activeMember?.limitMultiplier ?? 0))}</h3>
              </article>
              <label>Jumlah Pinjaman</label>
              <input type="number" value={loanAmount} min={100000} step={100000} onChange={(e) => setLoanAmount(Number(e.target.value))} />
              <label>Tenor (bulan)</label>
              <select value={tenor} onChange={(e) => setTenor(Number(e.target.value))}>
                {[3, 6, 9, 12, 18, 24].map((value) => <option key={value} value={value}>{value} Bulan</option>)}
              </select>
              <label>Kebutuhan</label>
              <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
              <button type="button" className="primary" onClick={submitLoan}>Ajukan Pinjaman</button>
            </section>
          )}

          {clientTab === 'bayar' && (
            <section className="screen">
              <h2>Pembayaran Cicilan</h2>
              <p className="muted">Lakukan pembayaran tepat waktu untuk menjaga reputasi kredit.</p>
              <article className="card accent">
                <small>Sisa Pinjaman</small>
                <h3>{formatCurrency(currentLoan?.remainingBalance ?? 0)}</h3>
              </article>
              <div className="list">
                {currentInstallments.length === 0 ? (
                  <p className="muted">Belum ada cicilan aktif.</p>
                ) : (
                  currentInstallments.map((item) => (
                    <div className="list-item" key={item.id}>
                      <div>
                        <strong>Cicilan Ke-{item.period}</strong>
                        <small>Jatuh tempo {item.dueDate}</small>
                      </div>
                      <div className="right">
                        <strong>{formatCurrency(item.amount)}</strong>
                        {item.status === 'paid' ? (
                          <span className="badge done">Lunas</span>
                        ) : (
                          <button type="button" onClick={() => payInstallment(item.id)}>Bayar</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {clientTab === 'riwayat' && (
            <section className="screen">
              <h2>Riwayat Pinjaman</h2>
              <p className="muted">Pantau status semua pengajuan Anda.</p>
              <div className="list">
                {clientLoans.map((loan) => (
                  <div className="list-item" key={loan.id}>
                    <div>
                      <strong>{loan.id}</strong>
                      <small>{loan.createdAt} • {loan.tenorMonths} bulan</small>
                    </div>
                    <div className="right">
                      <strong>{formatCurrency(loan.amount)}</strong>
                      <span className={`badge ${loan.status}`}>{getStatusLabel(loan.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="admin-layout">
          <aside className="sidebar">
            <h3 className="brand">Koperasi Digital</h3>
            <div className="admin-user">
              <div className="avatar">AK</div>
              <div>
                <strong>Admin Koperasi</strong>
                <small>Kelola Data & Transaksi</small>
              </div>
            </div>
            {[
              ['dashboard', 'Dashboard'],
              ['approval', 'Pinjaman'],
              ['anggota', 'Anggota'],
              ['laporan', 'Laporan'],
            ].map(([id, label]) => (
              <button key={id} type="button" className={adminTab === id ? 'active' : ''} onClick={() => setAdminTab(id)}>
                {label}
              </button>
            ))}
          </aside>
          <section className="admin-content-pro">
            {adminTab === 'dashboard' && (
              <>
                <div className="admin-head">
                  <div>
                    <h2>Ringkasan Operasional</h2>
                    <p className="muted">Selamat datang kembali, Admin. Pantau performa koperasi hari ini.</p>
                  </div>
                  <button type="button" className="primary add-btn">+ Tambah Anggota Baru</button>
                </div>
                <div className="pro-kpi">
                  <article className="pro-card">
                    <small>Total Anggota</small>
                    <h3>{appState.members.length.toLocaleString('id-ID')}</h3>
                  </article>
                  <article className="pro-card pro-card-red">
                    <small>Pinjaman Aktif</small>
                    <h3>{formatCurrency(totalActiveLoan).replace('Rp', 'Rp')}</h3>
                  </article>
                  <article className="pro-card">
                    <small>Cicilan Belum Bayar</small>
                    <h3>{dueInstallments}</h3>
                  </article>
                </div>
                <div className="dashboard-grid">
                  <article className="panel chart-panel">
                    <div className="panel-title">Perkembangan Simpanan</div>
                    <div className="bar-wrap">
                      {[40, 58, 85, 50, 70, 92, 48].map((height, idx) => (
                        <div key={height} className={`bar ${idx === 2 || idx === 5 ? 'solid' : ''}`} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                    <div className="month-row">
                      {['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL'].map((m) => <span key={m}>{m}</span>)}
                    </div>
                  </article>
                  <div className="side-stack">
                    <article className="panel">
                      <div className="panel-title between"><span>Pengajuan Terbaru</span><small>Lihat Semua</small></div>
                      {appState.loans.slice(0, 2).map((loan) => (
                        <div key={loan.id} className="quick-row">
                          <div>
                            <strong>{userMap[memberMap[loan.memberId]?.userId]?.name}</strong>
                            <small>{loan.purpose}</small>
                          </div>
                          <div className="right">
                            <strong>{formatCurrency(loan.amount / 1000).replace('Rp', 'Rp')}</strong>
                            <small>BARU SAJA</small>
                          </div>
                        </div>
                      ))}
                    </article>
                    <article className="panel cta-red">
                      <h4>Butuh Laporan Bulanan?</h4>
                      <p>Ekspor semua transaksi bulan Mei dalam satu klik.</p>
                      <button type="button">Generate PDF</button>
                    </article>
                  </div>
                </div>
                <footer className="admin-footer">© 2026 Koperasi Digital Indonesia. Berizin dan diawasi oleh Kementerian Koperasi dan UKM.</footer>
              </>
            )}

            {adminTab === 'approval' && (
              <>
                <div className="admin-head compact">
                  <h2>Persetujuan Pinjaman</h2>
                  <input className="search-input" type="text" placeholder="Cari Nama Anggota..." />
                </div>
                <div className="pro-kpi">
                  <article className="pro-card pro-card-red">
                    <small>Menunggu Persetujuan</small>
                    <h3>{pendingLoans.length} Pengajuan</h3>
                  </article>
                  <article className="pro-card"><small>Total Dana Tersedia</small><h3>Rp1.240.000.000</h3></article>
                  <article className="pro-card"><small>Pinjaman Cair (Bulan Ini)</small><h3>Rp450.000.000</h3></article>
                </div>
                <div className="approval-grid">
                  <article className="panel">
                    <div className="panel-title between"><span>Daftar Antrean Pengajuan</span><small>TERBARU</small></div>
                    {pendingLoans.map((loan) => (
                      <div key={loan.id} className="queue-row">
                        <div>
                          <strong>{userMap[memberMap[loan.memberId]?.userId]?.name}</strong>
                          <small>ID #{memberMap[loan.memberId]?.id?.replace('m-', '88') ?? '8821'}</small>
                        </div>
                        <strong className="red-txt">{formatCurrency(loan.amount)}</strong>
                        <span>{loan.tenorMonths} Bulan</span>
                        <span className={`badge ${loan.status}`}>{getStatusLabel(loan.status)}</span>
                        <div className="actions">
                          {loan.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => rejectLoan(loan.id)}>Tolak</button>
                              <button type="button" className="primary" onClick={() => approveLoan(loan.id)}>Setujui</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </article>
                  <article className="panel profile-panel">
                    <div className="avatar large">AW</div>
                    <h3>Andi Wijaya</h3>
                    <small>ANGGOTA PLATINUM - SEJAK 2021</small>
                    <div className="detail-list">
                      <div><span>Keperluan</span><strong>Modal Usaha Mikro</strong></div>
                      <div><span>Bunga (Flat)</span><strong>0.8% / bln</strong></div>
                      <div><span>Angsuran</span><strong className="red-txt">Rp2.483.333 / bln</strong></div>
                    </div>
                  </article>
                </div>
              </>
            )}

            {adminTab === 'anggota' && (
              <>
                <div className="admin-head">
                  <div>
                    <h2>Manajemen Anggota</h2>
                    <p className="muted">Kelola informasi keanggotaan, limit transaksi, dan status aktif koperasi.</p>
                  </div>
                  <button type="button" className="primary add-btn">+ Tambah Anggota</button>
                </div>
                <div className="pro-kpi">
                  <article className="pro-card pro-card-red"><small>TOTAL ANGGOTA</small><h3>1,240</h3></article>
                  <article className="pro-card"><small>ANGGOTA AKTIF</small><h3>982</h3></article>
                  <article className="pro-card"><small>PERMOHONAN BARU</small><h3>12</h3></article>
                </div>
                <article className="panel member-panel">
                  <div className="table-toolbar">
                    <input className="search-input" type="text" placeholder="Cari nama atau nomor HP..." />
                  </div>
                  <div className="member-head">
                    <span>NAMA</span><span>NO. HP</span><span>LIMIT PINJAMAN</span><span>AKSI</span>
                  </div>
                  {appState.members.map((member) => (
                    <div key={member.id} className="member-row">
                      <div>
                        <strong>{userMap[member.userId]?.name}</strong>
                        <small>ID #{member.id.replace('m-', '882')}</small>
                      </div>
                      <span>{member.phone}</span>
                      <strong className="red-txt">{formatCurrency(member.savingsBalance * member.limitMultiplier)}</strong>
                      <div className="actions">
                        <button type="button">✎</button>
                        <button type="button">🗑</button>
                      </div>
                    </div>
                  ))}
                </article>
              </>
            )}

            {adminTab === 'laporan' && (
              <>
                <div className="admin-head compact">
                  <div>
                    <small className="muted">REPORTING VAULT</small>
                    <h2>Ringkasan Performa Keuangan</h2>
                    <p className="muted">Analisis mendalam mengenai arus kas, pertumbuhan simpanan, dan manajemen pinjaman koperasi.</p>
                  </div>
                  <div className="filter-row">
                    <select><option>September</option></select>
                    <select><option>2026</option></select>
                    <button type="button" className="primary">Terapkan Filter</button>
                  </div>
                </div>
                <div className="report-grid">
                  <article className="pro-card pro-card-red large-card">
                    <small>Total Simpanan Keseluruhan</small>
                    <h3>{formatCurrency(totalSavings)}</h3>
                  </article>
                  <article className="pro-card">
                    <small>Total Pinjaman</small>
                    <h3>{formatCurrency(totalLoanAmount)}</h3>
                  </article>
                  <article className="pro-card">
                    <small>Rata-rata Bunga</small>
                    <h3>{formatPercent(avgRate)}</h3>
                  </article>
                </div>
                <div className="report-lower">
                  <article className="panel">
                    <div className="panel-title between"><span>Aliran Kas Terkini</span><small>Lihat Semua Aktivitas</small></div>
                    <div className="cash-row"><span>12 Sep 2024</span><strong>Budi Santoso</strong><span className="badge pending">SIMPANAN WAJIB</span><strong>Rp500.000</strong></div>
                    <div className="cash-row"><span>11 Sep 2024</span><strong>Siti Rahma</strong><span className="badge pending">ANGSURAN</span><strong>Rp2.450.000</strong></div>
                    <div className="cash-row"><span>10 Sep 2024</span><strong>Andi Wijaya</strong><span className="badge rejected">PENARIKAN</span><strong>-Rp1.000.000</strong></div>
                  </article>
                  <article className="panel">
                    <div className="panel-title">Kesehatan Koperasi</div>
                    <div className="meter"><span>Rasio Pinjaman</span><strong>65%</strong><div><i style={{ width: '65%' }} /></div></div>
                    <div className="meter"><span>Kolektibilitas Lancar</span><strong>92%</strong><div><i style={{ width: '92%' }} /></div></div>
                  </article>
                </div>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  )
}

export default App
