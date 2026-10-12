import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { JWT_SECRET, verifyToken } from '../middleware/auth.js';
import { logSecurityEvent, getSecurityMode } from '../middleware/audit.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  const mode = getSecurityMode(req);

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'NIM/NIP/Email dan password harus diisi.' });
  }

  // Find user by identifier (NIM/NIP) or email
  const stmt = db.prepare(`
    SELECT id, identifier, name, email, password_hash, role, prodi, semester, status 
    FROM users 
    WHERE identifier = ? OR email = ?
  `);
  const user = stmt.get(identifier.trim(), identifier.trim());

  if (!user) {
    logSecurityEvent({
      userId: null,
      action: 'LOGIN_FAILED',
      endpoint: '/api/auth/login',
      securityMode: mode,
      statusCode: 401,
      details: `Gagal login: Kredensial tidak ditemukan untuk "${identifier}".`
    });
    return res.status(401).json({ success: false, message: 'Pengguna atau kata sandi salah.' });
  }

  if (user.status !== 'aktif') {
    return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan. Hubungi Administrator.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
  if (!isPasswordValid) {
    logSecurityEvent({
      userId: user.id,
      action: 'LOGIN_FAILED_PASSWORD',
      endpoint: '/api/auth/login',
      securityMode: mode,
      statusCode: 401,
      details: `Password tidak cocok untuk user: ${user.name} (${user.identifier})`
    });
    return res.status(401).json({ success: false, message: 'Pengguna atau kata sandi salah.' });
  }

  // Generate JWT
  const token = jwt.sign(
    { id: user.id, identifier: user.identifier, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  logSecurityEvent({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    endpoint: '/api/auth/login',
    securityMode: mode,
    statusCode: 200,
    details: `User login sukses: ${user.name} [Role: ${user.role}]`
  });

  const { password_hash, ...userProfile } = user;
  return res.json({
    success: true,
    message: 'Login berhasil.',
    token,
    user: userProfile
  });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  logSecurityEvent({
    userId: req.user.id,
    action: 'LOGOUT',
    endpoint: '/api/auth/logout',
    securityMode: getSecurityMode(req),
    statusCode: 200,
    details: `User logout: ${req.user.name}`
  });

  return res.json({
    success: true,
    message: 'Logout berhasil. Sesi telah diakhiri.'
  });
});

export default router;
