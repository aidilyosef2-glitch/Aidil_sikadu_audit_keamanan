import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from '../backend/node_modules/bcryptjs/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'sikadu.db');

// Ensure directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

console.log('⚡ Menginisialisasi Database SIKADU di:', dbPath);

// Remove old database if exists to ensure fresh seed
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('✔ Database lama berhasil dibersihkan.');
  } catch (err) {
    console.warn('Peringatan saat membersihkan database lama:', err.message);
  }
}

const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

console.log('🛠 Membuat skema tabel...');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier VARCHAR(50) UNIQUE NOT NULL, -- NIM untuk mahasiswa, NIP untuk dosen/admin
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('mahasiswa', 'dosen', 'admin')),
    prodi VARCHAR(100) NOT NULL,
    semester INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'aktif' CHECK(status IN ('aktif', 'nonaktif')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    sks INTEGER NOT NULL DEFAULT 3,
    dosen_id INTEGER NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dosen_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    tugas REAL DEFAULT 0,
    uts REAL DEFAULT 0,
    uas REAL DEFAULT 0,
    nilai_akhir REAL DEFAULT 0,
    grade_letter VARCHAR(5) DEFAULT '-',
    catatan TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    deadline DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'dikumpulkan',
    score REAL DEFAULT NULL,
    feedback TEXT DEFAULT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS forum_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    security_mode VARCHAR(20) NOT NULL,
    status_code INTEGER NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('🌱 Menyiapkan data awal fiktif (Seeding Synthetic Demo Data)...');

// Hash default password
const saltRounds = 10;
const defaultHash = bcrypt.hashSync('password123', saltRounds);
const adminHash = bcrypt.hashSync('adminpassword123', saltRounds);

// Insert Users: 3 Mahasiswa, 2 Dosen, 1 Admin
const insertUser = db.prepare(`
  INSERT INTO users (id, identifier, name, email, password_hash, role, prodi, semester, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Mahasiswa
insertUser.run(1, '20240101', 'Ahmad Fauzi', 'ahmad.fauzi@kampus.ac.id', defaultHash, 'mahasiswa', 'Teknik Informatika', 4, 'aktif');
insertUser.run(2, '20240102', 'Budi Santoso', 'budi.santoso@kampus.ac.id', defaultHash, 'mahasiswa', 'Teknik Informatika', 4, 'aktif');
insertUser.run(3, '20240103', 'Citra Lestari', 'citra.lestari@kampus.ac.id', defaultHash, 'mahasiswa', 'Sistem Informasi', 4, 'aktif');

// Dosen
insertUser.run(4, '19800101', 'Dr. Hendra Gunawan, M.Kom', 'hendra.gunawan@kampus.ac.id', defaultHash, 'dosen', 'Teknik Informatika', 0, 'aktif');
insertUser.run(5, '19850202', 'Dr. Sri Wahyuni, M.T', 'sri.wahyuni@kampus.ac.id', defaultHash, 'dosen', 'Sistem Informasi', 0, 'aktif');

// Admin
insertUser.run(6, '19750001', 'Administrator Sistem', 'admin@kampus.ac.id', adminHash, 'admin', 'Pusat TI Kampus', 0, 'aktif');

// Insert Courses
const insertCourse = db.prepare(`
  INSERT INTO courses (id, code, name, sks, dosen_id, schedule, room)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertCourse.run(1, 'TIF201', 'Audit Keamanan Sistem Informasi', 3, 4, 'Senin, 08:00 - 10:30 WIB', 'Lab Cyber Security 3');
insertCourse.run(2, 'TIF202', 'Rekayasa Perangkat Lunak Berbasis Web', 3, 4, 'Rabu, 10:30 - 13:00 WIB', 'Lab Rekayasa Perangkat Lunak');
insertCourse.run(3, 'SIF301', 'Tata Kelola Keamanan Informasi (ISO 27001)', 3, 5, 'Kamis, 13:30 - 16:00 WIB', 'Ruang Teori 204');

// Insert Enrollments
const insertEnrollment = db.prepare(`
  INSERT INTO enrollments (student_id, course_id)
  VALUES (?, ?)
`);

// Ahmad Fauzi (ID 1)
insertEnrollment.run(1, 1);
insertEnrollment.run(1, 2);

// Budi Santoso (ID 2)
insertEnrollment.run(2, 1);
insertEnrollment.run(2, 3);

// Citra Lestari (ID 3)
insertEnrollment.run(3, 1);
insertEnrollment.run(3, 3);

// Insert Grades
const insertGrade = db.prepare(`
  INSERT INTO grades (student_id, course_id, tugas, uts, uas, nilai_akhir, grade_letter, catatan)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Ahmad Fauzi (ID 1) - Prestasi Bagus
insertGrade.run(1, 1, 88.0, 90.0, 92.0, 90.4, 'A', 'Pemahaman konsep kontrol akses dan sanitasi sangat baik.');
insertGrade.run(1, 2, 85.0, 84.0, 88.0, 86.1, 'A', 'Tugas proyek web selesai tepat waktu dengan arsitektur rapi.');

// Budi Santoso (ID 2) - Butuh Remedial (Nilai sensitif yang menarik untuk skenario IDOR)
insertGrade.run(2, 1, 65.0, 68.0, 70.0, 67.9, 'B-', 'Perlu latihan tambahan dalam mendeteksi celah IDOR dan parameter tampering.');
insertGrade.run(2, 3, 72.0, 75.0, 70.0, 72.5, 'B', 'Dokumen kajian risiko sudah cukup memadai.');

// Citra Lestari (ID 3) - Prestasi Sangat Tinggi
insertGrade.run(3, 1, 95.0, 96.0, 98.0, 96.5, 'A', 'Kandidat asisten laboratorium, analisis mitigasi keamanan luar biasa.');
insertGrade.run(3, 3, 90.0, 92.0, 94.0, 92.2, 'A', 'Kajian kerangka kerja ISO 27001 sangat komprehensif.');

// Insert Assignments
const insertAssignment = db.prepare(`
  INSERT INTO assignments (id, course_id, title, description, deadline)
  VALUES (?, ?, ?, ?, ?)
`);

insertAssignment.run(
  1,
  1,
  'Tugas M5: Audit Kerentanan Stored Cross-Site Scripting (XSS)',
  'Lakukan analisis terhadap form diskusi interaktif portal kampus. Uji penanganan karakter khusus HTML dan buktikan mekanisme sanitasi output encoding bekerja dengan baik.',
  '2026-10-25 23:59:00'
);

insertAssignment.run(
  2,
  1,
  'Tugas M6: Audit Celah Otorisasi Insecure Direct Object References (IDOR)',
  'Lakukan audit otorisasi pada endpoint query nilai akademik mahasiswa. Periksa apakah verifikasi berbasis session dan kepemilikan data (Ownership Verification) telah diimplementasikan pada tingkat server.',
  '2026-10-30 23:59:00'
);

insertAssignment.run(
  3,
  2,
  'Tugas Mandiri: Arsitektur REST API dengan Autentikasi JWT',
  'Rancang modul autentikasi dan otorisasi role-based menggunakan Express.js serta penyimpanan aman di database SQLite.',
  '2026-11-05 23:59:00'
);

// Insert Submissions demo
const insertSubmission = db.prepare(`
  INSERT INTO submissions (id, assignment_id, student_id, file_name, original_filename, file_size, status, score, feedback)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertSubmission.run(
  1,
  1,
  1,
  'submission_1_1_laporan_audit_xss.pdf',
  'Laporan_Audit_XSS_AhmadFauzi.pdf',
  245760,
  'dinilai',
  90.0,
  'Laporan komprehensif dengan bukti pengujian PoC yang jelas.'
);

// Insert Forum Threads
const insertThread = db.prepare(`
  INSERT INTO forum_threads (id, course_id, title, content, author_id)
  VALUES (?, ?, ?, ?, ?)
`);

insertThread.run(
  1,
  1,
  'Diskusi Materi M5: Strategi Pertahanan Terhadap Stored XSS',
  'Selamat datang di forum diskusi Mata Kuliah Audit Keamanan SI. Silakan ajukan pertanyaan atau bagikan temuan pengujian sanitasi input dan HTML entity encoding pada form komentar web portal.',
  4
);

insertThread.run(
  2,
  1,
  'Diskusi Materi M6: Mitigasi Insecure Direct Object References (IDOR)',
  'Forum ini membahas praktik terbaik implementasi Access Control List (ACL) dan verifikasi kepemilikan resource di sisi controller backend.',
  4
);

insertThread.run(
  3,
  3,
  'Kajian Framework ISO 27001 Annex A: Kontrol Akses & Kriptografi',
  'Silakan diskusikan penerapan klausul A.9 (Access Control) dalam arsitektur sistem informasi enterprise modern.',
  5
);

// Insert Forum Comments demo
const insertComment = db.prepare(`
  INSERT INTO forum_comments (id, thread_id, author_id, content)
  VALUES (?, ?, ?, ?)
`);

insertComment.run(
  1,
  1,
  4,
  'Halo rekan-rekan mahasiswa, ingat untuk selalu memvalidasi input di server dan melakukan escaping output saat menampilkan data pengguna ke halaman web.'
);

insertComment.run(
  2,
  1,
  1,
  'Izin bertanya Pak Hendra, apakah penggunaan textContent di DOM atau JSX React secara default sudah cukup untuk mencegah eksekusi skrip jahat?'
);

insertComment.run(
  3,
  1,
  4,
  'Benar Ahmad. React secara default meng-encode variabel dalam kurung kurawal JSX. Kerentanan Stored XSS baru terjadi jika pengembang sengaja menggunakan properti seperti dangerouslySetInnerHTML tanpa sanitasi!'
);

insertComment.run(
  4,
  2,
  2,
  'Pak, untuk IDOR apakah GUID/UUID sudah cukup aman tanpa perlu pengecekan hak akses di server?'
);

insertComment.run(
  5,
  2,
  4,
  'Pertanyaan bagus Budi! UUID hanya menyulitkan penusuran berurutan (security by obscurity), namun TANPA verifikasi kepemilikan di server, celah IDOR tetap ada. Validasi session ID terhadap target data adalah wajib.'
);

console.log('✅ Inisialisasi dan Seeding Database SIKADU Berhasil Diselesaikan!');
console.log('📊 Ringkasan Data Sintetis:');
console.log(' - Mahasiswa : 3 Akun (Ahmad Fauzi, Budi Santoso, Citra Lestari)');
console.log(' - Dosen     : 2 Akun (Dr. Hendra Gunawan, Dr. Sri Wahyuni)');
console.log(' - Admin     : 1 Akun (Administrator Sistem)');
console.log(' - Mata Kuliah : 3 Kelas Aktif');
console.log(' - Nilai       : 6 Rekor Akademik');
console.log(' - Forum       : 3 Thread Diskusi & 5 Komentar Awal');
