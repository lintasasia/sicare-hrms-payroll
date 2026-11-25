# 🏢 siCare — Sistem Informasi Manajemen Karyawan & Payroll (HRMS)

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web-blue" alt="Platform Web">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License MIT">
  <img src="https://img.shields.io/badge/Lintas%20Asia-Ecosystem-orange" alt="Lintas Asia Ecosystem">
</p>

**siCare** (Sistem Informasi Catatan, Presensi, Rekap, & Evaluasi) adalah platform Human Resource Management System (HRMS) dan portal karir terpadu yang dirancang khusus untuk ekosistem **Lintas Asia Group**. Aplikasi ini mengintegrasikan siklus pengelolaan karyawan secara menyeluruh mulai dari rekrutmen pelamar, verifikasi data identitas, presensi harian, manajemen cuti, reimbursement, hingga otomatisasi sinkronisasi penggajian (*payroll*) yang terhubung langsung dengan sistem akuntansi **Finance ERP (finance.lintas.asia)**.

---

## 🚀 Fitur Utama (Key Features)

### 1. 👥 Manajemen Data Karyawan (Employee Profiling & Master Data)
* **Master Karyawan**: Penyimpanan profil lengkap karyawan, NIK/Employee ID, jabatan (*job title*), departemen/divisi, dan kontak.
* **Verifikasi Identitas & Onboarding**: Unggah berkas KTP, NPWP, foto profil, dan rekening bank secara aman di secured storage.
* **Role-Based Access Control (RBAC)**: Pembagian hak akses terstruktur untuk Admin, HR Operations, Karyawan, dan Kandidat/Pelamar.

### 2. 📍 Presensi & Manajemen Ketidakhadiran (Attendance & Leaves)
* **Presensi Mandiri**: Pencatatan kehadiran harian karyawan (*check-in / check-out*) dilengkapi koordinat geolokasi dan status keterlambatan.
* **Pengajuan Cuti & Izin Digital**: Formulir pengajuan cuti tahunan, sakit, dan izin khusus dengan alur persetujuan (*approval workflow*) bertingkat oleh HR Ops.
* **Reimbursement**: Pengajuan klaim pengeluaran operasional dengan unggah bukti struk/nota pembayaran.

### 3. 💳 Integrasi Payroll & Finance ERP (finance.lintas.asia)
* **Sinkronisasi Payroll Real-time**: Terhubung langsung dengan API ERP Keuangan **Finance Lintas Asia** via private API Key.
* **Filter Slip Gaji Valid**: Hanya menampilkan slip gaji resmi yang telah diverifikasi dan berstatus **Lunas/Paid** (`SUDAH_DIBAYAR`).
* **Inbound Webhook**: Mendukung penerimaan push data otomatis langsung dari sistem Finance ketika pembayaran gaji disetujui.
* **Transparansi Slip Gaji Digital**: Karyawan dapat memantau breakdown gaji pokok, tunjangan jabatan, uang makan/transport, bonus, serta potongan resmi (BPJS Ketenagakerjaan, BPJS Kesehatan, PPh 21) dari portal masing-masing.

### 4. 🌐 Portal Rekrutmen & Karir Eksternal (`/careers`)
* Halaman etalase lowongan kerja publik interaktif dengan visual 3D Three.js.
* Penerimaan berkas lamaran, resume/CV, dan cover letter kandidat secara terpusat.

---

## 🛠️ Arsitektur & Teknologi (Tech Stack)

* **Backend**: PHP 8.x (Custom OOP MVC Architecture)
* **Database**: MySQL / MariaDB 10.5+
* **Frontend**: HTML5, TailwindCSS, Vanilla JavaScript (ES6+), Material Symbols, Three.js (3D Interactive UI)
* **Integrasi**: REST API Client (cURL / Guzzle), Webhook Engine, Secured Storage Engine
* **Deployment**: Nginx Web Server, AlmaLinux Enterprise

---

## ⚙️ Panduan Instalasi Lokal (Setup Guide)

### 1. Clone Repositori
```bash
git clone https://github.com/lintasasia/sicare-hrms-payroll.git
cd sicare-hrms-payroll
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` ke `.env` dan sesuaikan parameter berikut:
```env
APP_NAME=siCare
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sicare_app
DB_USERNAME=root
DB_PASSWORD=

# Integrasi Finance ERP Lintas Asia
FINANCE_API_URL=https://finance.lintas.asia/api/v1
FINANCE_API_KEY=YOUR_PRIVATE_API_KEY
```

### 3. Setup Database & Dependensi
```bash
composer install
php database/update_schema.php
```

### 4. Jalankan Server Development
```bash
php -S 0.0.0.0:8000 -t public
```

---

## 🏢 Kepemilikan & Hak Cipta

Dikelola dan dikembangkan oleh Tim Pengembang **Lintas Asia Group**.  
Hak Cipta © 2026 **Lintas Asia Group**. Seluruh hak cipta dilindungi undang-undang.
