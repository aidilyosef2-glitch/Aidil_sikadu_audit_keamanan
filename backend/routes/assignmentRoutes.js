import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { logSecurityEvent, getSecurityMode } from '../middleware/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Folder upload penyimpanan aman
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer dengan pembatasan keamanan ketat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitasi nama file dan gunakan nama acak agar tidak dapat dieksekusi langsung
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `tugas_${safeBaseName}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Hanya izinkan dokumen non-executable
  const allowedExtensions = ['.pdf', '.docx', '.zip', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Format file ditolak! Hanya file .pdf, .docx, .zip, dan .txt yang diizinkan untuk keamanan simulasi.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Batas ukuran 5 Megabyte
  },
  fileFilter
});

// GET /api/assignments - Daftar tugas
router.get('/', verifyToken, (req, res) => {
  const currentUser = req.user;

  let assignments = [];
  if (currentUser.role === 'mahasiswa') {
    const stmt = db.prepare(`
      SELECT 
        a.id, a.title, a.description, a.deadline, a.created_at,
        c.id as course_id, c.code as course_code, c.name as course_name,
        u_dosen.name as dosen_name,
        s.id as submission_id, s.file_name, s.original_filename, s.submitted_at, s.status as submission_status, s.score, s.feedback
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u_dosen ON c.dosen_id = u_dosen.id
      JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
      LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
      ORDER BY a.deadline ASC
    `);
    assignments = stmt.all(currentUser.id, currentUser.id);
  } else if (currentUser.role === 'dosen') {
    const stmt = db.prepare(`
      SELECT 
        a.id, a.title, a.description, a.deadline, a.created_at,
        c.id as course_id, c.code as course_code, c.name as course_name,
        (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as submission_count,
        (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE c.dosen_id = ?
      ORDER BY a.deadline ASC
    `);
    assignments = stmt.all(currentUser.id);
  } else {
    // Admin
    const stmt = db.prepare(`
      SELECT 
        a.id, a.title, a.description, a.deadline, a.created_at,
        c.id as course_id, c.code as course_code, c.name as course_name,
        u_dosen.name as dosen_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u_dosen ON c.dosen_id = u_dosen.id
      ORDER BY a.created_at DESC
    `);
    assignments = stmt.all();
  }

  return res.json({ success: true, assignments });
});

// POST /api/assignments/:id/submit - Unggah tugas oleh mahasiswa
router.post('/:id/submit', verifyToken, requireRole('mahasiswa'), (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  const studentId = req.user.id;

  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Harap pilih file yang akan diunggah.' });
    }

    // Pastikan mahasiswa terdaftar pada mata kuliah tugas tersebut
    const checkEnrollment = db.prepare(`
      SELECT e.id FROM enrollments e
      JOIN assignments a ON a.course_id = e.course_id
      WHERE a.id = ? AND e.student_id = ?
    `).get(assignmentId, studentId);

    if (!checkEnrollment) {
      // Hapus file yang sudah telanjur terunggah
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: 'Anda tidak terdaftar pada mata kuliah tugas ini.' });
    }

    // Cek apakah sudah pernah mengumpulkan tugas ini
    const existingSubmission = db.prepare('SELECT id, file_name FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, studentId);

    if (existingSubmission) {
      // Hapus file lama jika ada
      const oldFilePath = path.join(uploadDir, existingSubmission.file_name);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) {}
      }

      const updateStmt = db.prepare(`
        UPDATE submissions 
        SET file_name = ?, original_filename = ?, file_size = ?, submitted_at = CURRENT_TIMESTAMP, status = 'dikumpulkan'
        WHERE id = ?
      `);
      updateStmt.run(req.file.filename, req.file.originalname, req.file.size, existingSubmission.id);
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO submissions (assignment_id, student_id, file_name, original_filename, file_size, status)
        VALUES (?, ?, ?, ?, ?, 'dikumpulkan')
      `);
      insertStmt.run(assignmentId, studentId, req.file.filename, req.file.originalname, req.file.size);
    }

    logSecurityEvent({
      userId: studentId,
      action: 'ASSIGNMENT_SUBMISSION',
      endpoint: `/api/assignments/${assignmentId}/submit`,
      securityMode: getSecurityMode(req),
      statusCode: 200,
      details: `Mahasiswa ${req.user.name} mengunggah file aman: ${req.file.originalname} (${req.file.size} bytes)`
    });

    return res.json({
      success: true,
      message: 'Tugas berhasil diunggah secara aman ke server simulasi.',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  });
});

// GET /api/assignments/:id/submissions - Dosen melihat pengumpulan tugas kelas
router.get('/:id/submissions', verifyToken, requireRole('dosen', 'admin'), (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);

  const assignment = db.prepare(`
    SELECT a.*, c.name as course_name, c.code as course_code 
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = ?
  `).get(assignmentId);

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan.' });
  }

  const submissionsStmt = db.prepare(`
    SELECT 
      s.id as submission_id,
      s.file_name,
      s.original_filename,
      s.file_size,
      s.submitted_at,
      s.status,
      s.score,
      s.feedback,
      u.id as student_id,
      u.name as student_name,
      u.identifier as nim,
      u.email as student_email
    FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.assignment_id = ?
    ORDER BY s.submitted_at DESC
  `);

  const submissions = submissionsStmt.all(assignmentId);

  return res.json({
    success: true,
    assignment,
    submissions
  });
});

// POST /api/assignments/submissions/:submissionId/grade - Dosen memberikan penilaian tugas
router.post('/submissions/:submissionId/grade', verifyToken, requireRole('dosen', 'admin'), (req, res) => {
  const submissionId = parseInt(req.params.submissionId, 10);
  const { score, feedback } = req.body;

  const sub = db.prepare('SELECT id, student_id, assignment_id FROM submissions WHERE id = ?').get(submissionId);
  if (!sub) {
    return res.status(404).json({ success: false, message: 'Pengumpulan tugas tidak ditemukan.' });
  }

  const updateStmt = db.prepare(`
    UPDATE submissions 
    SET score = ?, feedback = ?, status = 'dinilai'
    WHERE id = ?
  `);
  updateStmt.run(parseFloat(score) || 0, feedback || '', submissionId);

  return res.json({
    success: true,
    message: 'Nilai dan umpan balik tugas berhasil disimpan.'
  });
});

export default router;
