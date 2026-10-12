# 📋 LAPORAN AUDIT KEAMANAN SISTEM INFORMASI
## Evaluasi Kerentanan Aplikasi Web SIKADU: Stored XSS (M5) & IDOR (M6)

---

### Informasi Dokumen Audit
- **Nama Target Sistem**: SIKADU (Sistem Informasi Kampus Digital)
- **Modul yang Diaudit**: Forum Diskusi Akademik (M5) & Kartu Hasil Studi / Transkrip Nilai (M6)
- **Klasifikasi Dokumen**: Laporan Audit Keamanan Sistem Informasi (M5-M6)
- **Metodologi Audit**: OWASP Web Security Testing Guide (WSTG-v4.2) & NIST SP 800-115
- **Tingkat Akses Audit**: Grey-box Assessment (Source Code Review & Dynamic Testing)
- **Status Audit**: Selesai & Terverifikasi (Mitigasi Telah Diuji)

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Audit keamanan sistem informasi dilakukan terhadap aplikasi portal perguruan tinggi **SIKADU (Sistem Informasi Kampus Digital)** untuk mengevaluasi postur keamanan terhadap dua vektor serangan kritikal pada standar **OWASP Top 10**:
1. **Stored Cross-Site Scripting (XSS)** pada Modul Forum Diskusi Akademik (Kategori OWASP: *A03:2021 – Injection*).
2. **Insecure Direct Object References (IDOR)** pada Modul Kartu Hasil Studi / Nilai Mahasiswa (Kategori OWASP: *A01:2021 – Broken Access Control*).

Berdasarkan hasil pengujian penetrasi dan analisis kode sumber (*source code review*):
- Pada kondisi awal (**Mode Rentan**), kedua celah keamanan terbukti dapat dieksploitasi sepenuhnya. Kerentanan Stored XSS memungkinkan aktor jahat menyuntikkan skrip berbahaya atau memanipulasi tampilan antarmuka secara permanen yang memengaruhi seluruh pengguna lain. Kerentanan IDOR memungkinkan mahasiswa mana pun mengakses transkrip nilai rahasia mahasiswa lain hanya dengan mengganti parameter identitas numerik pada permintaan API tanpa verifikasi kepemilikan objek.
- Pada tahap pengujian kedua (**Mode Aman / Mitigated**), strategi pertahanan berlapis (*Defense-in-Depth*) diimplementasikan dan diverifikasi:
  - Validasi otorisasi kepemilikan objek (*Ownership Verification*) berbasis token JWT berhasil memblokir serangan IDOR dengan respons status `403 Forbidden`.
  - Sanitasi masukan (*HTML Entity Encoding*) di sisi server dan rendering teks aman di sisi peramban berhasil menetralkan serangan Stored XSS.
  - Setiap upaya eksploitasi dan aktivitas sistem tercatat secara granular pada tabel `audit_logs` untuk keperluan audit forensik digital.

---

## 2. RUANG LINGKUP & METODOLOGI AUDIT

### 2.1 Ruang Lingkup (Scope)
Audit mencakup endpoint API dan modul antarmuka pengguna berikut:

| No | Modul | Endpoint API | Komponen Frontend | Kategori Uji |
|---|---|---|---|---|
| 1 | Forum Diskusi | `POST /api/forum/threads/:id/comments`<br>`GET /api/forum/threads/:id` | `StudentForum.jsx` | WSTG-INPV-02 (Stored XSS) |
| 2 | Nilai Akademik (KHS) | `GET /api/grades/student/:studentId` | `StudentGrades.jsx` | WSTG-ATHZ-04 (Bypassing Authorization / IDOR) |
| 3 | Pusat Keamanan & Audit | `GET /api/admin/audit-logs`<br>`POST /api/system/mode` | `AdminAuditLogs.jsx`<br>`SecurityBanner.jsx` | WSTG-LOGG-01 (Security Event Logging) |

### 2.2 Metodologi Pengujian
1. **Reconnaissance & Endpoint Discovery**: Mengidentifikasi arsitektur routing Express.js dan struktur penyimpanan basis data SQLite.
2. **Static Application Security Testing (SAST)**: Memeriksa kode program pengontrol (*controller*) untuk mendeteksi ketiadaan sanitasi input dan ketiadaan verifikasi kepemilikan.
3. **Dynamic Application Security Testing (DAST)**: Melakukan pengujian fungsional langsung menggunakan peramban dan HTTP client terhadap parameter masukan.
4. **Remediation & Re-testing**: Mengaktifkan logika mitigasi keamanan dan memvalidasi apakah kerentanan berhasil ditutup tanpa merusak alur kerja sah.

---

## 3. TEMUAN AUDIT 1: STORED CROSS-SITE SCRIPTING (XSS) — MODUL M5

### 3.1 Deskripsi Teknis
- **Vulnerability ID**: SIKADU-VULN-01
- **Kategori OWASP**: A03:2021 – Injection
- **CWE**: CWE-79: Improper Neutralization of Input During Web Page Generation
- **CVSS v3.1 Base Score**: **7.5 (High)** — `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N`

Kerentanan terjadi pada fitur pengiriman komentar diskusi di mana masukan teks dari pengguna langsung disimpan ke dalam tabel `forum_comments` tanpa melalui proses penyaringan karakter HTML (*sanitization*). Ketika pengguna lain (mahasiswa atau dosen) membuka topik diskusi tersebut, frontend dalam mode rentan merender konten komentar menggunakan antarmuka manipulasi HTML mentah (`dangerouslySetInnerHTML`), menyebabkan kode HTML/JavaScript asing dieksekusi di dalam konteks sesi peramban korban.

### 3.2 Bukti Konsep (Proof of Concept - PoC)

#### Permintaan HTTP (Penyerang Mahasiswa ID 1 mengirim muatan):
```http
POST /api/forum/threads/1/comments HTTP/1.1
Host: localhost:5000
Authorization: Bearer <TOKEN_MAHASISWA_1>
Content-Type: application/json

{
  "content": "<img src=x onerror=\"alert('Stored XSS Dieksekusi! Sesi Anda Telah Disusupi')\" />"
}
```

#### Hasil pada Mode Rentan:
1. Basis data menerima dan menyimpan string mentah tag `<img>` dengan event handler JavaScript `onerror`.
2. Setiap pengguna lain yang membuka `GET /api/forum/threads/1` menerima data mentah tersebut.
3. Saat peramban merender DOM elemen, fungsi `onerror` langsung terpicu dan mengeksekusi dialog alert serta berpotensi mencuri data token sesi dari `localStorage` atau `sessionStorage`.

### 3.3 Dampak Risiko
- **Kerahasiaan (Confidentiality)**: Tinggi — Penyerang dapat mencuri token sesi JWT atau data pribadi pengguna yang sedang membuka thread forum.
- **Integritas (Integrity)**: Sedang — Penyerang dapat melakukan defacement visual pada thread forum, menampilkan form phishing login palsu, atau mengubah isi instruksi tugas kuliah.
- **Ketersediaan (Availability)**: Rendah — Peramban pengguna dapat mengalami denial of service (DoS) lokal akibat loop script peramban yang tidak terbatas.

### 3.4 Analisis Kode Sebelum & Sesudah Mitigasi

#### Kode Rentan (Vulnerable Code):
```javascript
// backend/routes/forumRoutes.js
router.post('/threads/:id/comments', verifyToken, (req, res) => {
  const { content } = req.body;
  // CACAT: Konten langsung disimpan apa adanya tanpa sanitasi
  const insertStmt = db.prepare('INSERT INTO forum_comments (thread_id, author_id, content) VALUES (?, ?, ?)');
  insertStmt.run(req.params.id, req.user.id, content);
});
```

#### Kode Aman (Mitigated Code):
```javascript
// backend/routes/forumRoutes.js
const sanitizeHtmlEntities = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

router.post('/threads/:id/comments', verifyToken, (req, res) => {
  let finalContent = req.body.content.trim();
  const mode = getSecurityMode(req);

  if (mode === 'secure') {
    // MITIGASI SERVER: Entity Encoding mengubah karakter tag menjadi teks inert
    finalContent = sanitizeHtmlEntities(finalContent);
  }

  const insertStmt = db.prepare('INSERT INTO forum_comments (thread_id, author_id, content) VALUES (?, ?, ?)');
  insertStmt.run(req.params.id, req.user.id, finalContent);
});
```

#### Mitigasi di Sisi Frontend:
Pada komponen `StudentForum.jsx`, dalam mode aman, peramban merender teks sebagai Node Teks JSX murni (`<span>{comment.content}</span>`) dan menolak penggunaan `dangerouslySetInnerHTML`.

---

## 4. TEMUAN AUDIT 2: INSECURE DIRECT OBJECT REFERENCES (IDOR) — MODUL M6

### 4.1 Deskripsi Teknis
- **Vulnerability ID**: SIKADU-VULN-02
- **Kategori OWASP**: A01:2021 – Broken Access Control
- **CWE**: CWE-639: Authorization Bypass Through User-Controlled Key
- **CVSS v3.1 Base Score**: **6.5 (Medium/High)** — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N`

Kerentanan terjadi pada endpoint pengambilan Kartu Hasil Studi (KHS). Endpoint `GET /api/grades/student/:studentId` hanya memverifikasi keberadaan token JWT yang sah (`verifyToken`), namun tidak melakukan pemeriksaan otorisasi (*horizontal access control check*) apakah `req.user.id` cocok dengan parameter URL `:studentId`. Akibatnya, mahasiswa yang telah login dapat mengganti parameter URL dengan identitas mahasiswa lain untuk mengintip seluruh nilai, indeks prestasi kumulatif (IPK), dan catatan akademik rekan-rekannya.

### 4.2 Bukti Konsep (Proof of Concept - PoC)

#### Permintaan HTTP Eksploitasi:
Mahasiswa **Ahmad Fauzi (ID: 1)** mengakses data nilai mahasiswa **Budi Santoso (ID: 2)**:
```http
GET /api/grades/student/2 HTTP/1.1
Host: localhost:5000
Authorization: Bearer <TOKEN_MILIK_AHMAD_FAUZI_ID_1>
x-security-mode: vulnerable
```

#### Respons Server pada Mode Rentan (`200 OK`):
```json
{
  "success": true,
  "securityMode": "vulnerable",
  "vulnerableNotice": "⚠️ PERHATIAN AUDIT: Data ini berhasil diakses melalui celah IDOR (akses data pengguna lain tanpa verifikasi kepemilikan).",
  "student": {
    "id": 2,
    "identifier": "20240102",
    "name": "Budi Santoso",
    "prodi": "Teknik Informatika",
    "semester": 3
  },
  "summary": {
    "totalCourses": 2,
    "totalSks": 6,
    "ipk": "3.50"
  },
  "grades": [
    {
      "course_code": "IF301",
      "course_name": "Audit Keamanan Sistem Informasi",
      "nilai_akhir": 82,
      "grade_letter": "A-"
    }
  ]
}
```

### 4.3 Dampak Risiko
- **Kerahasiaan (Confidentiality)**: Tinggi — Pelanggaran privasi data akademik mahasiswa (data FERPA / perlindungan data pribadi mahasiswa).
- **Integritas (Integrity)**: Rendah — Pada endpoint baca, integritas tidak terpengaruh langsung, namun pola cacat yang sama berisiko merambat ke endpoint ubah jika tidak dimitigasi.
- **Ketersediaan (Availability)**: Rendah — Tidak berdampak langsung pada ketersediaan layanan.

### 4.4 Analisis Kode Sebelum & Sesudah Mitigasi

#### Kode Rentan (Vulnerable Code):
```javascript
// backend/routes/gradeRoutes.js
router.get('/student/:studentId', verifyToken, (req, res) => {
  const targetStudentId = parseInt(req.params.studentId, 10);
  // CACAT: Tidak ada validasi apakah req.user.id === targetStudentId
  const grades = gradesStmt.all(targetStudentId);
  return res.json({ success: true, grades });
});
```

#### Kode Aman (Mitigated Code):
```javascript
// backend/routes/gradeRoutes.js
router.get('/student/:studentId', verifyToken, (req, res) => {
  const targetStudentId = parseInt(req.params.studentId, 10);
  const mode = getSecurityMode(req);
  const currentUser = req.user;

  if (mode === 'secure') {
    // 1. Verifikasi Otorisasi Kepemilikan Mahasiswa (Ownership Verification)
    if (currentUser.role === 'mahasiswa') {
      if (currentUser.id !== targetStudentId) {
        logSecurityEvent({
          userId: currentUser.id,
          action: 'IDOR_BLOCKED',
          endpoint: `/api/grades/student/${targetStudentId}`,
          securityMode: 'secure',
          statusCode: 403,
          details: `[BLOCKED] Mahasiswa "${currentUser.name}" (ID ${currentUser.id}) mencoba mengakses nilai mahasiswa ID ${targetStudentId}. Akses ditolak!`
        });

        return res.status(403).json({
          success: false,
          securityMode: 'secure',
          vulnerability: 'IDOR_MITIGATED',
          message: 'Akses Ditolak (Mitigasi IDOR): Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain.'
        });
      }
    } else if (currentUser.role === 'dosen') {
      // 2. Verifikasi Dosen Pengampu Kelas
      const teachesCheck = db.prepare(`
        SELECT COUNT(*) as count FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ? AND c.dosen_id = ?
      `).get(targetStudentId, currentUser.id);

      if (!teachesCheck || teachesCheck.count === 0) {
        return res.status(403).json({
          success: false,
          message: 'Akses Ditolak: Anda tidak mengampu mata kuliah yang diambil oleh mahasiswa ini.'
        });
      }
    }
  }

  // Lolos verifikasi otorisasi
  const grades = gradesStmt.all(targetStudentId);
  return res.json({ success: true, grades });
});
```

---

## 5. AUDIT LOGGING & DIGITAL FORENSICS

Aplikasi mengintegrasikan subsistem audit logging yang secara otomatis mencatat seluruh peristiwa keamanan penting ke dalam tabel `audit_logs`.

### Contoh Bukti Log Audit (Database Forensics):
| ID | Timestamp | User | Action | Endpoint | Mode | Status | Rincian Insiden |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-12 18:05:12 | Ahmad Fauzi (ID 1) | `IDOR_EXPLOITED_VULNERABLE` | `/api/grades/student/2` | `vulnerable` | 200 | Mahasiswa "Ahmad Fauzi" berhasil melihat nilai "Budi Santoso" tanpa verifikasi kepemilikan. |
| 2 | 2026-10-12 18:05:40 | Ahmad Fauzi (ID 1) | `IDOR_BLOCKED` | `/api/grades/student/2` | `secure` | 403 | [BLOCKED] Mahasiswa "Ahmad Fauzi" mencoba mengakses nilai ID 2. Akses ditolak oleh Server Policy! |
| 3 | 2026-10-12 18:06:05 | Ahmad Fauzi (ID 1) | `STORED_XSS_PAYLOAD_SAVED_VULNERABLE` | `/api/forum/threads/1/comments` | `vulnerable` | 201 | Terdeteksi input tag HTML/skrip disimpan tanpa sanitasi: `<img src=x onerror=...>` |
| 4 | 2026-10-12 18:06:30 | Ahmad Fauzi (ID 1) | `XSS_INPUT_SANITIZED_SECURE` | `/api/forum/threads/1/comments` | `secure` | 201 | [MITIGASI XSS] Server berhasil melakukan entity encoding: `&lt;img src=x...&gt;` |

Administrator dapat memantau log ini secara interaktif melalui halaman **Pusat Log Audit Keamanan** (`/admin/audit-logs`) dengan filter berdasarkan tipe serangan (`IDOR`, `XSS`, `AUTH`).

---

## 6. MATRIKS RISIKO & STRATEGI DEFENSE-IN-DEPTH

### 6.1 Matriks Evaluasi Risiko (DREAD Model)
| Kerentanan | Damage | Reproducibility | Exploitability | Affected Users | Discoverability | Skor Total | Tingkat Risiko |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Stored XSS (M5)** | 8 | 10 | 8 | 9 | 8 | **8.6 / 10** | **TINGGI (HIGH)** |
| **IDOR Nilai (M6)** | 7 | 10 | 10 | 10 | 9 | **9.2 / 10** | **KRITIKAL (CRITICAL)** |

### 6.2 Rekomendasi Jangka Panjang (Defense-in-Depth)
1. **Penerapan Content Security Policy (CSP)**:
   - Menambahkan header HTTP: `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';` untuk mencegah peramban mengeksekusi inline script tak berizin.
2. **Penggunaan Indirect Reference Map / UUID**:
   - Mengganti nomor ID sekuensial (`studentId: 1, 2, 3`) dengan pengidentifikasi acak (*Universally Unique Identifier* / UUID v4) untuk mencegah enumerasi objek otomatis (*brute-force object traversal*).
3. **Role-Based Access Control (RBAC) & Policy Decision Point (PDP)**:
   - Menggunakan pustaka otorisasi terpusat (seperti CASL atau middleware berbasis kebijakan) untuk memastikan kontrol akses berlaku konsisten pada seluruh endpoint RESTful.
4. **Header Keamanan Tambahan**:
   - Menyematkan header `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, dan `Strict-Transport-Security` pada seluruh respons server.

---

## 7. KESIMPULAN

Audit keamanan pada sistem **SIKADU** membuktikan pentingnya pengujian keamanan berbasis kode (*code auditing*) dan pemisahan kontrol akses. Kedua kerentanan utama—**Stored XSS (M5)** dan **IDOR (M6)**—telah berhasil disimulasikan, dianalisis akar masalahnya (*root cause analysis*), dan diselesaikan secara tuntas menggunakan mitigasi arsitektur perangkat lunak yang andal.

Dengan integrasi pencatatan log audit otomatis dan arsitektur pengujian dual-mode, platform SIKADU siap digunakan sebagai media demonstrasi, pembelajaran, dan bukti pemenuhan tugas akademik **Audit Keamanan Sistem Informasi**.
