# KoperasiQu 🏦 — Enterprise Loan Management System

**KoperasiQu** adalah platform manajemen simpan pinjam koperasi modern yang dirancang untuk skala sekolah/perusahaan. Sistem ini mencakup **Backend API** yang kokoh, **Web Dashboard** untuk Admin, dan **Aplikasi Mobile** untuk Anggota.

---

## 🚀 Fitur Unggulan

### 🛡️ Core Financial Logic
- **Multi-tier Approval**: Pinjaman di bawah 5 Juta bisa disetujui Staf, di atas 5 Juta wajib disetujui Manager.
- **Precision Rounding**: Akurasi akuntansi 100% dengan pembulatan *residual* pada cicilan terakhir.
- **Penalty Logic**: Perhitungan denda keterlambatan harian otomatis (0.5% per hari).

### 📈 Smart Credit Rating System
- **Dynamic Credit Score**: Skor (0-100) berdasarkan riwayat pembayaran.
- **Auto-Sanction**: Skor < 50 otomatis melarang pengajuan pinjaman (Tombol di Mobile terkunci).
- **Auto-Escalation**: Skor < 80 otomatis memerlukan *Manager Approval* meskipun nominal kecil.
- **Reward System**: Skor meningkat +10 poin otomatis setiap pelunasan cicilan yang diverifikasi.

### 📜 Transparency & Security
- **Audit Trail (Opsi B)**: Jejak riwayat aktivitas lengkap (siapa, kapan, aksi apa) terlihat di dasbor admin untuk setiap pinjaman.
- **Evidence Verification**: Anggota mengunggah bukti transfer via Mobile, Admin memverifikasi di Web.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: .NET 8 Core Web API (C#)
- **Database**: MySQL / MariaDB (via Entity Framework Core)
- **Security**: JWT Authentication, Role-based Authorization (Admin, Staff, Manager)
- **Architecture**: Clean Architecture Pattern

### Web Admin (Dashboard)
- **Library**: React.js 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS v3 (Modern Dashboard Aesthetics)
- **Icons**: Lucide React
- **Data Tools**: XLSX (Excel Report Export)

### Mobile App (Anggota)
- **Framework**: React Native + Expo
- **Icons**: Lucide React
- **Validation**: Skor kredit terintegrasi ke interaksi UI.

---

## ⚡ Cara Menjalankan

### Prasyarat
- **Laragon/XAMPP** aktif (MySQL Service ON)
- **Node.js v18+** & **npm**
- **.NET 8 SDK**

### 1. Database Setup
Pastikan MySQL jalan, database akan dibuat otomatis oleh EF Core saat pertama kali dijalankan.

### 2. Backend API
```powershell
cd "KoperasiQu.API"
dotnet run --urls "http://0.0.0.0:5249"
```
📄 Swagger UI: `http://localhost:5249`

### 3. Web Admin
```powershell
cd "koperasiqu-admin"
npm install
npm run dev
```
✅ Dashboard: `http://localhost:5173`

### 4. Mobile App (Expo Go)
```powershell
cd "koperasiqu-mobile"
npm install
npx expo start
```
*Gunakan aplikasi **Expo Go** di Android/iOS untuk scan QR code.*

---

## 🔑 Kredensial Default (Demo)

| Role | Username/NIK | Password/PIN |
|---|---|---|
| **Manager** | `admin` | `admin123` |
| **Staff** | `staff` | `staff123` |
| **Anggota (Budi)** | `3201010101800001` | `123456` |
| **Anggota (Siti)** | `3201010101850002` | `123456` |

---

## 📁 Struktur Proyek
- `/KoperasiQu.API`: Logika bisnis, database migrasi, dan endpoint RESTful.
- `/koperasiqu-admin`: Antarmuka manajemen koperasi (React).
- `/koperasiqu-mobile`: Aplikasi mobile anggota untuk pengajuan & tracking (React Native).

---

© 2024 Project KoperasiQu — Enterprise Edition
