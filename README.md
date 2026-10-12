# 🎓 SIKADU - Sistem Informasi Kampus Digital
> **Platform Simulasi & Laboratorium Audit Keamanan Sistem Informasi (M5 - M6)**  
> Mata Kuliah: Audit Keamanan Sistem Informasi | Studi Kasus: OWASP Top 10 Web & API Vulnerabilities

---

## 📌 Ringkasan Proyek

**SIKADU (Sistem Informasi Kampus Digital)** adalah aplikasi web portal akademik perguruan tinggi lengkap yang dirancang khusus untuk mendemonstrasikan, menguji, dan memitigasi kerentanan keamanan web dan API sesuai standar **OWASP Top 10**:
1. **Modul M5: Stored Cross-Site Scripting (XSS)** — OWASP A03: Injection
2. **Modul M6: Insecure Direct Object References (IDOR)** — OWASP A01: Broken Access Control

Aplikasi dilengkapi dengan **Live Security Mode Switcher** (Dua mode operasi: `VULNERABLE` dan `SECURE`), **Pusat Log Audit Keamanan Real-time**, serta antarmuka laboratorium pengujian interaktif yang terintegrasi langsung di dalam halaman aplikasi.

---

## 🌟 Fitur Utama Aplikasi

### 1. Multi-Role Portal Akademik
- 👨‍🎓 **Mahasiswa**: Dashboard akademik, status SKS & IPK, Kartu Hasil Studi (KHS), daftar mata kuliah, pengumpulan tugas online, dan forum diskusi mahasiswa & dosen.
- 👨‍🏫 **Dosen**: Dashboard perkuliahan, manajemen kelas ampu, input dan pembaruan nilai mahasiswa (Tugas, UTS, UAS, Nilai Akhir & Grade), penilaian pengumpulan tugas, dan partisipasi forum.
- 🛡️ **Administrator**: Dashboard ringkasan kampus, manajemen data pengguna (tambah, edit, aktifkan/nonaktifkan), serta pemantauan log audit insiden keamanan (Security Audit Log Viewer).

### 2. Laboratorium Simulasi Kerentanan (Dual-Mode Engine)
- ⚠️ **Mode Rentan (Vulnerable)**:
  - *IDOR*: Endpoint data nilai mengabaikan verifikasi kepemilikan objek (`studentId`). Mahasiswa A dapat melihat transkrip nilai mahasiswa B hanya dengan mengubah ID target.
  - *Stored XSS*: Komentar forum disimpan mentah ke basis data dan dieksekusi oleh peramban pengguna lain tanpa sanitasi atau enkoding entitas HTML.
- 🛡️ **Mode Aman (Secure / Mitigated)**:
  - *Mitigasi IDOR*: Implementasi verifikasi kepemilikan berbasis token JWT (`req.user.id === targetId`) di tingkat middleware dan controller API. Akses tidak sah diblokir dengan respons `403 Forbidden`.
  - *Mitigasi XSS*: Sanitasi sisi server dengan HTML Entity Encoding dan proteksi rendering teks aman sisi klien.

### 3. Engine Audit Keamanan & Forensik Digital
- Setiap akses objek, pengubahan mode, percobaan IDOR, dan injeksi muatan (payload) XSS dicatat otomatis ke tabel `audit_logs` lengkap dengan `timestamp`, `user_id`, `action`, `endpoint`, `security_mode`, `status_code`, dan rincian teknis insiden.

---

## 🔑 Akun Uji Coba Demo

Semua akun telah disiapkan secara otomatis saat inisialisasi basis data:

| Peran | Nama Pengguna | Identifier (NIM/NIP) | Email | Password |
|---|---|---|---|---|
| **Mahasiswa 1** | Ahmad Fauzi | 20240101 | `ahmad.fauzi@kampus.ac.id` | `password123` |
| **Mahasiswa 2** | Budi Santoso | 20240102 | `budi.santoso@kampus.ac.id` | `password123` |
| **Mahasiswa 3** | Citra Lestari | 20240103 | `citra.lestari@kampus.ac.id` | `password123` |
| **Dosen 1** | Dr. Hendra Gunawan | 19800101 | `hendra.gunawan@kampus.ac.id` | `password123` |
| **Dosen 2** | Dr. Sri Wahyuni | 19850202 | `sri.wahyuni@kampus.ac.id` | `password123` |
| **Admin** | Administrator Sistem | 19750001 | `admin@kampus.ac.id` | `adminpassword123` |

> *Catatan: Tombol "Isi Cepat Akun Demo" tersedia langsung di halaman login untuk mempermudah demonstrasi tanpa mengetik.*

---

## 🚀 Panduan Menjalankan Sistem

### Persyaratan Sistem
- Node.js versi 20+ atau LTS terbaru.
- Peramban modern (Google Chrome, Microsoft Edge, Mozilla Firefox).

### 1. Inisialisasi Basis Data (SQLite)
Jalankan perintah berikut di direktori utama:
```bash
node database/init-db.js
```
*Basis data `database/sikadu.db` akan dibuat ulang beserta seluruh skema tabel dan data demo sintetis.*

### 2. Menjalankan Backend API
```bash
cd backend
npm run dev
```
*Backend berjalan di: `http://localhost:5000`*

### 3. Menjalankan Frontend Web
Buka terminal baru:
```bash
cd frontend
npm run dev
```
*Frontend berjalan di: `http://localhost:5173`*

---

## 🧪 Panduan Demonstrasi Audit Keamanan

### Pengujian 1: Insecure Direct Object References (IDOR) — Modul M6
1. Masuk sebagai **Mahasiswa 1 (Ahmad Fauzi)** (ID: 1).
2. Buka menu **Nilai Akademik (IDOR)** di bilah sisi.
3. Pada kotak **Lab Pengujian Audit IDOR**, klik tombol preset **Uji Target: Mhs 2 (Budi)** atau masukkan ID `2`.
4. Klik **Kirim Request IDOR**:
   - Dalam **Mode Rentan**: Data nilai mahasiswa Budi Santoso berhasil diambil (Status: `200 OK`). Transkrip nilai Budi tampil pada tabel.
   - Dalam **Mode Aman**: Sistem menolak permintaan dengan status `403 Forbidden` ("Akses Ditolak: Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain").
5. Masuk sebagai **Admin** dan buka menu **Log Audit Keamanan** untuk melihat entri audit `IDOR_EXPLOITED_VULNERABLE` atau `IDOR_BLOCKED`.

### Pengujian 2: Stored Cross-Site Scripting (XSS) — Modul M5
1. Masuk sebagai **Mahasiswa 1** atau pengguna mana pun.
2. Buka menu **Forum Diskusi (XSS)**.
3. Klik topik diskusi (misal: "Diskusi Tugas 1 Analisis Keamanan Web").
4. Pada kotak **Lab Pengujian Stored XSS**, klik salah satu tombol preset muatan:
   - `Visual HTML Tag`: `<h3 style="color:red">🚨 Perhatian: Akun Anda Telah Diambil Alih!</h3>`
   - `Custom DOM Box`: `<div style="background:#fee2e2;border:2px dashed red;padding:12px;border-radius:8px"><b>⚠️ Peringatan Keamanan Kampus</b></div>`
   - `Script Alert`: `<img src="invalid-image" onerror="alert('Stored XSS Berhasil Dieksekusi!')" />`
5. Klik **Kirim Komentar**:
   - Dalam **Mode Rentan**: Elemen HTML / skrip tersimpan secara mentah dan langsung ter-render aktif di peramban.
   - Dalam **Mode Aman**: Input disanitasi dengan HTML entity encoding (`&lt;img...&gt;`) dan ditampilkan aman sebagai teks biasa tanpa dieksekusi.

---

## 📁 Struktur Direktori Proyek

```plaintext
SIKADU/
├── backend/                  # RESTful API Server (Express.js)
│   ├── config/               # Konfigurasi basis data SQLite
│   ├── middleware/           # Middleware autentikasi JWT & audit keamanan
│   ├── routes/               # Endpoint API (auth, student, grades, forum, assignments, admin, system)
│   ├── uploads/              # Direktori penyimpanan tugas terunggah
│   ├── package.json
│   └── server.js             # Entrypoint server backend
├── database/                 # Basis data dan skrip seeding
│   ├── init-db.js            # Skrip inisialisasi skema & seed data demo
│   └── sikadu.db             # File basis data SQLite
├── frontend/                 # Antarmuka Pengguna Klien (React 19 + Vite)
│   ├── src/
│   │   ├── components/       # Komponen UI (Navbar, Sidebar, SecurityBanner, AuditModal)
│   │   ├── context/          # State management autentikasi & mode keamanan
│   │   ├── pages/            # Halaman multi-role & laboratorium simulasi
│   │   ├── services/         # Integrasi API client
│   │   ├── App.jsx           # Routing & tata letak utama
│   │   └── index.css         # Desain sistem & utilitas CSS premium
│   ├── package.json
│   └── vite.config.js
├── docs/                     # Dokumentasi Resmi & Laporan Audit
│   ├── LAPORAN_AUDIT_M5_M6.md # Laporan komprehensif audit keamanan sistem informasi
│   └── PANDUAN_PENGUJIAN_LAB.md # Panduan langkah demi langkah pengujian laboratorium
└── package.json              # Monorepo task runner
```

---

## 📄 Lisensi & Hak Cipta
Dibuat untuk keperluan akademik: Mata Kuliah Audit Keamanan Sistem Informasi (M5-M6).
