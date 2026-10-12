# 🧪 PANDUAN PENGUJIAN LABORATORIUM AUDIT KEAMANAN (M5 - M6)
## Petunjuk Praktikum Interaktif: Pengujian & Eksploitasi Stored XSS serta IDOR

---

## 1. Persiapan Lingkungan Uji

1. **Jalankan Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *Pastikan terminal menampilkan: `🚀 SIKADU Backend Server Berjalan pada port: http://localhost:5000`*

2. **Jalankan Frontend Web**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Buka peramban pada alamat: `http://localhost:5173`*

3. **Inisialisasi Data Demo**:
   Jika ingin me-reset data database ke kondisi awal:
   ```bash
   node database/init-db.js
   ```

---

## 2. MODUL M6: PENGUJIAN INSECURE DIRECT OBJECT REFERENCES (IDOR)

### Skenario Ancaman:
Mahasiswa **Ahmad Fauzi (ID: 1)** mencoba mengintip Kartu Hasil Studi (KHS) mahasiswa **Budi Santoso (ID: 2)** tanpa izin pengampu atau hak administrator.

### Langkah Pengujian 1: Eksploitasi dalam Mode Rentan
1. Buka `http://localhost:5173`.
2. Klik tombol demo **"Ahmad Fauzi (Mahasiswa)"** dan klik **"Masuk ke SIKADU"**.
3. Pastikan banner di atas halaman berstatus **"Mode Simulasi: VULNERABLE (Celah Aktif)"**. Jika masih Secure, klik tombol **"Beralih ke Rentan"**.
4. Klik menu bilah sisi **"Nilai Akademik (IDOR)"**.
5. Perhatikan tabel nilai yang tampil adalah milik **Ahmad Fauzi** (ID 1).
6. Di bagian atas halaman, terdapat kotak **"LAB PENGUJIAN AUDIT KERENTANAN M6: INSECURE DIRECT OBJECT REFERENCES (IDOR)"**.
7. Klik tombol preset: **"Uji Target: Mhs 2 (Budi)"** (atau ubah input field menjadi ID `2`).
8. Klik tombol biru **"Kirim Request IDOR"**.
9. **Hasil Pengamatan (Vulnerable)**:
   - Panel respon terminal menampilkan status **`200 OK`**.
   - Kotak peringatan merah muncul: *"🚨 INDIKASI KERENTANAN IDOR BERHASIL DIEKSPLOITASI! Data mahasiswa lain (Budi Santoso) berhasil diakses secara horizontal!"*.
   - Tabel KHS di bawah otomatis memperbarui isi nilai menjadi milik Budi Santoso (NIM: 20240102).

### Langkah Pengujian 2: Verifikasi Mitigasi dalam Mode Aman
1. Pada banner status keamanan di atas layar, klik tombol hijau **"Aktifkan Mitigasi (Secure)"**.
2. Banner berubah menjadi **"Mode Simulasi: SECURE (Mitigasi Aktif)"**.
3. Pada kotak Lab IDOR, biarkan ID target tetap bernilai `2`.
4. Klik tombol **"Kirim Request IDOR"**.
5. **Hasil Pengamatan (Secure / Mitigated)**:
   - Panel respon terminal menampilkan status **`403 Forbidden`**.
   - Kotak hijau muncul: *"🛡️ MITIGASI IDOR BERHASIL MEMBLOKIR AKSES! Server menolak permintaan dengan status 403 Forbidden."*.
   - Detail respons API: *"Akses Ditolak (Mitigasi IDOR): Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain (Ownership Check Enforced)"*.

---

## 3. MODUL M5: PENGUJIAN STORED CROSS-SITE SCRIPTING (XSS)

### Skenario Ancaman:
Penyerang menyusupkan muatan (payload) HTML / skrip JavaScript ke dalam kolom komentar forum diskusi agar tersimpan permanen di database dan dieksekusi oleh peramban korban.

### Langkah Pengujian 1: Eksploitasi dalam Mode Rentan
1. Pastikan sistem berada dalam **"Mode Simulasi: VULNERABLE"**.
2. Klik menu bilah sisi **"Forum Diskusi (XSS)"**.
3. Pilih salah satu topik diskusi dari daftar (misal: *"Diskusi Tugas 1 Analisis Keamanan Web"*).
4. Di bagian atas halaman terdapat kotak **"LAB PENGUJIAN AUDIT KERENTANAN M5: STORED CROSS-SITE SCRIPTING (XSS)"**.
5. Gunakan salah satu tombol cepat muatan uji:
   - **Tombol "Visual HTML Tag"**:
     ```html
     <h3 style="color:red">🚨 Perhatian: Akun Anda Telah Diambil Alih!</h3>
     ```
   - **Tombol "Custom DOM Box"**:
     ```html
     <div style="background:#fee2e2;border:2px dashed red;padding:12px;border-radius:8px"><b>⚠️ Peringatan Keamanan Kampus</b></div>
     ```
   - **Tombol "Script Alert"**:
     ```html
     <img src="x" onerror="alert('Stored XSS Berhasil Dieksekusi!')" />
     ```
6. Klik tombol **"Kirim Komentar"**.
7. **Hasil Pengamatan (Vulnerable)**:
   - Komentar berhasil disimpan ke database tanpa penyaringan.
   - Peramban langsung mengeksekusi elemen HTML/skrip tersebut. Jika menggunakan muatan `onerror`, dialog pop-up JavaScript akan muncul di layar.
   - Jika pengguna lain (misal: Dosen Hendra Gunawan) membuka thread tersebut, muatan XSS yang sama akan ikut tereksekusi pada peramban mereka.

### Langkah Pengujian 2: Verifikasi Mitigasi dalam Mode Aman
1. Aktifkan **"Mode Simulasi: SECURE"** melalui banner atas.
2. Masukkan kembali salah satu muatan di atas ke kolom komentar.
3. Klik tombol **"Kirim Komentar"**.
4. **Hasil Pengamatan (Secure / Mitigated)**:
   - Server melakukan sanitasi karakter dengan *HTML Entity Encoding* (`<` diubah menjadi `&lt;`, `>` menjadi `&gt;`).
   - Komentar baru tampil murni sebagai teks string literal tanpa dieksekusi atau merusak tata letak peramban.

---

## 4. PEMERIKSAAN LOG AUDIT KEAMANAN (ROLE ADMIN)

Seluruh aktivitas pengujian di atas terekam secara otomatis ke dalam sistem audit forensik:

1. Di pojok kanan atas, klik tombol **"Keluar"**.
2. Masuk sebagai **Administrator**:
   - Klik tombol cepat **"Admin Sistem"** (`admin@kampus.ac.id` / `adminpassword123`).
3. Klik menu bilah sisi **"Log Audit Keamanan"**.
4. Di halaman ini, periksa tabel log rekaman:
   - Filter `IDOR`: Menampilkan rekor `IDOR_EXPLOITED_VULNERABLE` dan `IDOR_BLOCKED`.
   - Filter `XSS`: Menampilkan rekor `STORED_XSS_PAYLOAD_SAVED_VULNERABLE` dan `XSS_INPUT_SANITIZED_SECURE`.
5. Setiap entri mencantumkan nama pengguna yang melakukan aksi, alamat IP, kode status HTTP, waktu kejadian (*timestamp*), serta pesan rincian insiden.

---

## 5. RANGKUMAN PENILAIAN AUDIT

| No | Parameter Uji | Ekspektasi Mode Rentan | Ekspektasi Mode Aman | Hasil Evaluasi |
|:---:|---|---|---|:---:|
| 1 | **IDOR - Akses Data Mahasiswa Lain** | Status `200 OK`, Data tampil | Status `403 Forbidden`, Akses diblokir | **LULUS (PASS)** |
| 2 | **IDOR - Akses Data Pribadi Sendiri** | Status `200 OK`, Data tampil | Status `200 OK`, Data tampil | **LULUS (PASS)** |
| 3 | **Stored XSS - Penyimpanan Tag HTML** | Disimpan mentah (*raw string*) | Disanitasi (*entity encoding*) | **LULUS (PASS)** |
| 4 | **Stored XSS - Rendering Browser** | Dieksekusi via innerHTML | Dirender aman sebagai teks biasa | **LULUS (PASS)** |
| 5 | **Pencatatan Log Forensik Digital** | Tercatat di database `audit_logs` | Tercatat di database `audit_logs` | **LULUS (PASS)** |
