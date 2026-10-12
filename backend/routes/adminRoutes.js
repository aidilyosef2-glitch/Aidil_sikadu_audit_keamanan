import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { logSecurityEvent, getSecurityMode } from '../middleware/audit.js';

const router = express.Router();

// GET /api/admin/stats - Ringkasan data kampus untuk admin
router.get('/stats', verifyToken, requireRole('admin'), (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "mahasiswa"').get().count;
  const totalDosen = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "dosen"').get().count;
  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  const totalSubmissions = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;
  const totalThreads = db.prepare('SELECT COUNT(*) as count FROM forum_threads').get().count;
  const totalAuditLogs = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

  // Cek insiden keamanan yang tercatat
  const idorAlerts = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%IDOR%'").get().count;
  const xssAlerts = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action LIKE '%XSS%'").get().count;

  return res.json({
    success: true,
    stats: {
      totalStudents,
      totalDosen,
      totalCourses,
      totalSubmissions,
      totalThreads,
      totalAuditLogs,
      securityAlerts: {
        idor: idorAlerts,
        xss: xssAlerts
      }
    }
  });
});

// GET /api/admin/users - Mengelola daftar akun mahasiswa dan dosen
router.get('/users', verifyToken, requireRole('admin'), (req, res) => {
  const { role, status, q } = req.query;

  let query = 'SELECT id, identifier, name, email, role, prodi, semester, status, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (q) {
    query += ' AND (name LIKE ? OR identifier LIKE ? OR email LIKE ?)';
    const searchPattern = `%${q}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY role DESC, id ASC';

  const stmt = db.prepare(query);
  const users = stmt.all(...params);

  return res.json({ success: true, users });
});

// POST /api/admin/users - Menambah akun baru (Mahasiswa atau Dosen)
router.post('/users', verifyToken, requireRole('admin'), (req, res) => {
  const { identifier, name, email, password, role, prodi, semester } = req.body;

  if (!identifier || !name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Semua bidang wajib (identifier, name, email, password, role) harus diisi.' });
  }

  if (!['mahasiswa', 'dosen'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role harus berupa mahasiswa atau dosen.' });
  }

  // Cek duplikasi NIM/NIP atau email
  const existing = db.prepare('SELECT id FROM users WHERE identifier = ? OR email = ?').get(identifier, email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'NIM/NIP atau Email sudah terdaftar dalam sistem.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const sem = role === 'mahasiswa' ? (parseInt(semester, 10) || 1) : 0;

  const insertStmt = db.prepare(`
    INSERT INTO users (identifier, name, email, password_hash, role, prodi, semester, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'aktif')
  `);

  const result = insertStmt.run(identifier.trim(), name.trim(), email.trim(), hashedPassword, role, prodi || 'Teknik Informatika', sem);

  logSecurityEvent({
    userId: req.user.id,
    action: 'USER_CREATED_BY_ADMIN',
    endpoint: '/api/admin/users',
    securityMode: getSecurityMode(req),
    statusCode: 201,
    details: `Admin ${req.user.name} membuat akun baru: ${name} (${identifier}) [Role: ${role}]`
  });

  return res.status(201).json({
    success: true,
    message: `Akun ${role} (${name}) berhasil dibuat.`,
    userId: Number(result.lastInsertRowid)
  });
});

// PUT /api/admin/users/:id - Mengedit informasi akun
router.put('/users/:id', verifyToken, requireRole('admin'), (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { identifier, name, email, prodi, semester, password } = req.body;

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
  }

  if (password && password.trim()) {
    const hashed = bcrypt.hashSync(password.trim(), 10);
    const updateWithPass = db.prepare(`
      UPDATE users 
      SET identifier = ?, name = ?, email = ?, prodi = ?, semester = ?, password_hash = ?
      WHERE id = ?
    `);
    updateWithPass.run(identifier, name, email, prodi, parseInt(semester) || 1, hashed, userId);
  } else {
    const updateStmt = db.prepare(`
      UPDATE users 
      SET identifier = ?, name = ?, email = ?, prodi = ?, semester = ?
      WHERE id = ?
    `);
    updateStmt.run(identifier, name, email, prodi, parseInt(semester) || 1, userId);
  }

  logSecurityEvent({
    userId: req.user.id,
    action: 'USER_UPDATED_BY_ADMIN',
    endpoint: `/api/admin/users/${userId}`,
    securityMode: getSecurityMode(req),
    statusCode: 200,
    details: `Admin memperbarui data pengguna ID ${userId} (${name})`
  });

  return res.json({ success: true, message: 'Data akun berhasil diperbarui.' });
});

// PATCH /api/admin/users/:id/status - Menonaktifkan / mengaktifkan akun
router.patch('/users/:id/status', verifyToken, requireRole('admin'), (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!['aktif', 'nonaktif'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status harus aktif atau nonaktif.' });
  }

  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Anda tidak dapat menonaktifkan akun admin Anda sendiri.' });
  }

  const updateStmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
  updateStmt.run(status, userId);

  logSecurityEvent({
    userId: req.user.id,
    action: 'USER_STATUS_CHANGED',
    endpoint: `/api/admin/users/${userId}/status`,
    securityMode: getSecurityMode(req),
    statusCode: 200,
    details: `Admin mengubah status akun ID ${userId} menjadi "${status}"`
  });

  return res.json({
    success: true,
    message: `Status akun berhasil diubah menjadi ${status}.`
  });
});

// GET /api/admin/audit-logs - Melihat catatan log audit keamanan
router.get('/audit-logs', verifyToken, requireRole('admin'), (req, res) => {
  const { filter, limit = 50 } = req.query;

  let query = `
    SELECT 
      l.id, l.timestamp, l.user_id, l.action, l.endpoint,
      l.security_mode, l.status_code, l.details, l.ip_address,
      u.name as user_name, u.role as user_role, u.identifier
    FROM audit_logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (filter === 'IDOR') {
    query += " AND l.action LIKE '%IDOR%'";
  } else if (filter === 'XSS') {
    query += " AND l.action LIKE '%XSS%'";
  } else if (filter === 'AUTH') {
    query += " AND (l.action LIKE '%LOGIN%' OR l.action LIKE '%LOGOUT%')";
  }

  query += ' ORDER BY l.id DESC LIMIT ?';
  params.push(parseInt(limit, 10) || 50);

  const stmt = db.prepare(query);
  const logs = stmt.all(...params);

  return res.json({ success: true, logs });
});

export default router;
