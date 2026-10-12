import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'sikadu-super-secret-security-audit-key-2026';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const stmt = db.prepare('SELECT id, identifier, name, email, role, prodi, semester, status FROM users WHERE id = ?');
    const user = stmt.get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Sesi tidak valid: Akun pengguna tidak ditemukan.' });
    }

    if (user.status !== 'aktif') {
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan oleh Administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token kedaluwarsa atau tidak valid.', error: err.message });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Membutuhkan peran [${allowedRoles.join(', ')}], peran Anda adalah [${req.user.role}].`
      });
    }

    next();
  };
};
