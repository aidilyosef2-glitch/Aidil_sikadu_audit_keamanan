import express from 'express';
import db from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getSecurityMode, logSecurityEvent } from '../middleware/audit.js';

const router = express.Router();

// Helper untuk menghitung nilai akhir dan huruf
const calculateGradeLetter = (finalScore) => {
  if (finalScore >= 85) return 'A';
  if (finalScore >= 80) return 'A-';
  if (finalScore >= 75) return 'B+';
  if (finalScore >= 70) return 'B';
  if (finalScore >= 65) return 'B-';
  if (finalScore >= 60) return 'C+';
  if (finalScore >= 55) return 'C';
  if (finalScore >= 40) return 'D';
  return 'E';
};

/**
 * =========================================================================
 * SIMULASI KERENTANAN 2: INSECURE DIRECT OBJECT REFERENCES (IDOR)
 * Endpoint: GET /api/grades/student/:studentId
 * =========================================================================
 * - Versi Rentan: Memeriksa apakah token pengguna valid (terautentikasi),
 *   tetapi sama sekali TIDAK memverifikasi apakah studentId sesuai dengan
 *   identitas pengguna yang sedang login. Mahasiswa A bisa melihat nilai Mahasiswa B.
 *
 * - Versi Aman: Memeriksa otorisasi kepemilikan data (Ownership Verification).
 *   Mahasiswa HANYA boleh mengakses data miliknya sendiri.
 *   Dosen hanya boleh mengakses jika mengajar mata kuliah mahasiswa tersebut.
 *   Admin memiliki hak akses terkelola.
 * =========================================================================
 */
router.get('/student/:studentId', verifyToken, (req, res) => {
  const targetStudentId = parseInt(req.params.studentId, 10);
  const mode = getSecurityMode(req);
  const currentUser = req.user;

  if (isNaN(targetStudentId)) {
    return res.status(400).json({ success: false, message: 'Parameter studentId tidak valid.' });
  }

  // Cek apakah target student ada di database
  const studentStmt = db.prepare('SELECT id, identifier, name, email, prodi, semester FROM users WHERE id = ? AND role = "mahasiswa"');
  const targetStudent = studentStmt.get(targetStudentId);

  if (!targetStudent) {
    return res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan.' });
  }

  // IMPLEMENTASI LOGIKA BERDASARKAN MODE KEAMANAN
  if (mode === 'secure') {
    // --- VERSI AMAN (SECURE / MITIGASI AKTIF) ---
    if (currentUser.role === 'mahasiswa') {
      // Verifikasi Kepemilikan (Ownership Verification)
      if (currentUser.id !== targetStudentId) {
        logSecurityEvent({
          userId: currentUser.id,
          action: 'IDOR_BLOCKED',
          endpoint: `/api/grades/student/${targetStudentId}`,
          securityMode: 'secure',
          statusCode: 403,
          details: `[BLOCKED] Mahasiswa "${currentUser.name}" (ID ${currentUser.id}) mencoba mengakses nilai mahasiswa ID ${targetStudentId} (${targetStudent.name}). Akses ditolak oleh Server Policy!`
        });

        return res.status(403).json({
          success: false,
          securityMode: 'secure',
          vulnerability: 'IDOR_MITIGATED',
          message: 'Akses Ditolak (Mitigasi IDOR): Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain.',
          details: {
            authenticatedUser: currentUser.name,
            authenticatedId: currentUser.id,
            requestedStudentId: targetStudentId,
            rule: 'Mahasiswa hanya diizinkan mengakses data nilainya sendiri (Ownership Check Enforced).'
          }
        });
      }
    } else if (currentUser.role === 'dosen') {
      // Dosen hanya boleh melihat jika mengajar mata kuliah mahasiswa tersebut
      const teachesStmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ? AND c.dosen_id = ?
      `);
      const teachesCheck = teachesStmt.get(targetStudentId, currentUser.id);

      if (!teachesCheck || teachesCheck.count === 0) {
        logSecurityEvent({
          userId: currentUser.id,
          action: 'IDOR_BLOCKED_DOSEN',
          endpoint: `/api/grades/student/${targetStudentId}`,
          securityMode: 'secure',
          statusCode: 403,
          details: `[BLOCKED] Dosen "${currentUser.name}" (ID ${currentUser.id}) tidak mengampu kelas mahasiswa ID ${targetStudentId}. Akses ditolak.`
        });

        return res.status(403).json({
          success: false,
          securityMode: 'secure',
          vulnerability: 'IDOR_MITIGATED',
          message: 'Akses Ditolak: Anda tidak mengampu mata kuliah yang diambil oleh mahasiswa ini.'
        });
      }
    }
    // Jika lolos validasi peran aman, catat audit akses sah
    logSecurityEvent({
      userId: currentUser.id,
      action: 'GRADE_VIEW_SECURE_AUTHORIZED',
      endpoint: `/api/grades/student/${targetStudentId}`,
      securityMode: 'secure',
      statusCode: 200,
      details: `User ${currentUser.name} (${currentUser.role}) mengakses nilai sah mahasiswa ${targetStudent.name}.`
    });

  } else {
    // --- VERSI RENTAN (VULNERABLE / IDOR PERMISIF) ---
    // Cacat Otorisasi: Server hanya memverifikasi login (verifyToken),
    // tetapi mengabaikan pengecekan apakah req.user.id sama dengan targetStudentId!
    const isUnauthorizedAccess = currentUser.role === 'mahasiswa' && currentUser.id !== targetStudentId;

    logSecurityEvent({
      userId: currentUser.id,
      action: isUnauthorizedAccess ? 'IDOR_EXPLOITED_VULNERABLE' : 'GRADE_VIEW_VULNERABLE',
      endpoint: `/api/grades/student/${targetStudentId}`,
      securityMode: 'vulnerable',
      statusCode: 200,
      details: isUnauthorizedAccess
        ? `[PERINGATAN AUDIT] Mahasiswa "${currentUser.name}" (ID ${currentUser.id}) berhasil melihat nilai mahasiswa "${targetStudent.name}" (ID ${targetStudentId}) karena ketiadaan verifikasi kepemilikan objek (IDOR Rentan)!`
        : `User ${currentUser.name} mengakses nilai ID ${targetStudentId} dalam mode rentan.`
    });
  }

  // Ambil daftar nilai mahasiswa target
  const gradesStmt = db.prepare(`
    SELECT 
      g.id as grade_id,
      g.student_id,
      g.course_id,
      c.code as course_code,
      c.name as course_name,
      c.sks,
      u_dosen.name as dosen_name,
      g.tugas,
      g.uts,
      g.uas,
      g.nilai_akhir,
      g.grade_letter,
      g.catatan,
      g.updated_at
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    JOIN users u_dosen ON c.dosen_id = u_dosen.id
    WHERE g.student_id = ?
    ORDER BY c.code ASC
  `);

  const grades = gradesStmt.all(targetStudentId);

  // Hitung IPK/IPS sederhana
  let totalSks = 0;
  let totalBobot = 0;
  const gradePoints = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0 };

  grades.forEach(g => {
    totalSks += g.sks;
    const point = gradePoints[g.grade_letter] || 0.0;
    totalBobot += (point * g.sks);
  });

  const ipk = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : '0.00';

  return res.json({
    success: true,
    securityMode: mode,
    vulnerableNotice: mode === 'vulnerable' && currentUser.role === 'mahasiswa' && currentUser.id !== targetStudentId
      ? '⚠️ PERHATIAN AUDIT: Data ini berhasil diakses melalui celah IDOR (akses data pengguna lain tanpa verifikasi kepemilikan).'
      : null,
    student: targetStudent,
    summary: {
      totalCourses: grades.length,
      totalSks,
      ipk
    },
    grades
  });
});

// GET /api/grades/course/:courseId - Untuk dosen melihat nilai satu kelas
router.get('/course/:courseId', verifyToken, requireRole('dosen', 'admin'), (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const currentUser = req.user;

  // Verifikasi apakah dosen mengajar kelas ini (kecuali admin)
  if (currentUser.role === 'dosen') {
    const checkCourse = db.prepare('SELECT id, name FROM courses WHERE id = ? AND dosen_id = ?').get(courseId, currentUser.id);
    if (!checkCourse) {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan pengampu mata kuliah ini.' });
    }
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan.' });
  }

  const listStmt = db.prepare(`
    SELECT 
      u.id as student_id,
      u.identifier as nim,
      u.name as student_name,
      u.prodi,
      g.id as grade_id,
      COALESCE(g.tugas, 0) as tugas,
      COALESCE(g.uts, 0) as uts,
      COALESCE(g.uas, 0) as uas,
      COALESCE(g.nilai_akhir, 0) as nilai_akhir,
      COALESCE(g.grade_letter, '-') as grade_letter,
      g.catatan,
      g.updated_at
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    LEFT JOIN grades g ON (g.student_id = u.id AND g.course_id = e.course_id)
    WHERE e.course_id = ?
    ORDER BY u.identifier ASC
  `);

  const students = listStmt.all(courseId);

  return res.json({
    success: true,
    course,
    students
  });
});

// POST /api/grades/update - Update atau insert nilai mahasiswa oleh dosen
router.post('/update', verifyToken, requireRole('dosen', 'admin'), (req, res) => {
  const { studentId, courseId, tugas, uts, uas, catatan } = req.body;
  const currentUser = req.user;

  if (!studentId || !courseId) {
    return res.status(400).json({ success: false, message: 'studentId dan courseId wajib diisi.' });
  }

  // Cek otorisasi pengampu mata kuliah
  if (currentUser.role === 'dosen') {
    const course = db.prepare('SELECT id FROM courses WHERE id = ? AND dosen_id = ?').get(courseId, currentUser.id);
    if (!course) {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan pengampu mata kuliah ini.' });
    }
  }

  const numTugas = parseFloat(tugas) || 0;
  const numUts = parseFloat(uts) || 0;
  const numUas = parseFloat(uas) || 0;
  const finalScore = parseFloat(((numTugas * 0.3) + (numUts * 0.3) + (numUas * 0.4)).toFixed(1));
  const gradeLetter = calculateGradeLetter(finalScore);

  const checkGrade = db.prepare('SELECT id FROM grades WHERE student_id = ? AND course_id = ?').get(studentId, courseId);

  if (checkGrade) {
    const updateStmt = db.prepare(`
      UPDATE grades 
      SET tugas = ?, uts = ?, uas = ?, nilai_akhir = ?, grade_letter = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(numTugas, numUts, numUas, finalScore, gradeLetter, catatan || '', checkGrade.id);
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO grades (student_id, course_id, tugas, uts, uas, nilai_akhir, grade_letter, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(studentId, courseId, numTugas, numUts, numUas, finalScore, gradeLetter, catatan || '');
  }

  logSecurityEvent({
    userId: currentUser.id,
    action: 'GRADE_UPDATE',
    endpoint: '/api/grades/update',
    securityMode: getSecurityMode(req),
    statusCode: 200,
    details: `Dosen ID ${currentUser.id} memperbarui nilai mahasiswa ID ${studentId} pada mata kuliah ID ${courseId}: Akhir = ${finalScore} (${gradeLetter})`
  });

  return res.json({
    success: true,
    message: 'Nilai berhasil disimpan dan diperbarui.',
    grade: {
      studentId,
      courseId,
      tugas: numTugas,
      uts: numUts,
      uas: numUas,
      nilai_akhir: finalScore,
      grade_letter: gradeLetter,
      catatan
    }
  });
});

export default router;
