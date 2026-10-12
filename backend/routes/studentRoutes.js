import express from 'express';
import db from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/student/dashboard
router.get('/dashboard', verifyToken, requireRole('mahasiswa'), (req, res) => {
  const studentId = req.user.id;

  // Daftar mata kuliah yang diambil
  const coursesStmt = db.prepare(`
    SELECT 
      c.id, c.code, c.name, c.sks, c.schedule, c.room,
      u.name as dosen_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.dosen_id = u.id
    WHERE e.student_id = ?
    ORDER BY c.code ASC
  `);
  const courses = coursesStmt.all(studentId);

  // Nilai saat ini
  const gradesStmt = db.prepare(`
    SELECT 
      g.tugas, g.uts, g.uas, g.nilai_akhir, g.grade_letter,
      c.name as course_name, c.code as course_code, c.sks
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = ?
  `);
  const grades = gradesStmt.all(studentId);

  // Hitung SKS & IPK
  let totalSks = 0;
  let totalBobot = 0;
  const gradePoints = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0, 'E': 0.0 };

  grades.forEach(g => {
    totalSks += g.sks;
    const point = gradePoints[g.grade_letter] || 0.0;
    totalBobot += (point * g.sks);
  });
  const ipk = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : '0.00';

  // Tugas aktif yang belum dikumpulkan
  const assignmentsStmt = db.prepare(`
    SELECT 
      a.id, a.title, a.deadline, c.name as course_name, c.code as course_code,
      s.id as submission_id, s.status as submission_status
    FROM assignments a
    JOIN courses c ON a.course_id = c.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = ?
    LEFT JOIN submissions s ON (s.assignment_id = a.id AND s.student_id = ?)
    ORDER BY a.deadline ASC
  `);
  const assignments = assignmentsStmt.all(studentId, studentId);

  return res.json({
    success: true,
    student: req.user,
    stats: {
      totalCourses: courses.length,
      totalSks,
      ipk,
      pendingAssignments: assignments.filter(a => !a.submission_id).length
    },
    courses,
    assignments
  });
});

// GET /api/student/courses
router.get('/courses', verifyToken, requireRole('mahasiswa'), (req, res) => {
  const studentId = req.user.id;
  const coursesStmt = db.prepare(`
    SELECT 
      c.id, c.code, c.name, c.sks, c.schedule, c.room,
      u.name as dosen_name, u.email as dosen_email,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as total_students
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.dosen_id = u.id
    WHERE e.student_id = ?
    ORDER BY c.code ASC
  `);

  const courses = coursesStmt.all(studentId);
  return res.json({ success: true, courses });
});

// GET /api/student/profile
router.get('/profile', verifyToken, (req, res) => {
  return res.json({ success: true, profile: req.user });
});

export default router;
