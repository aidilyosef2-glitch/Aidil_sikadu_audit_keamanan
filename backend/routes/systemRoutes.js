import express from 'express';
import { getCurrentGlobalMode, setGlobalSecurityMode, logSecurityEvent } from '../middleware/audit.js';
import { verifyToken } from '../middleware/auth.js';
import db from '../config/db.js';

const router = express.Router();

// GET /api/system/mode - Cek mode keamanan sistem saat ini
router.get('/mode', (req, res) => {
  const currentMode = getCurrentGlobalMode();
  return res.json({
    success: true,
    mode: currentMode,
    label: currentMode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN',
    description: currentMode === 'vulnerable'
      ? 'Mode Rentan Aktif: Endpoint mengabaikan ownership check (IDOR) dan form komentar menerima unescaped input/output (Stored XSS).'
      : 'Mode Aman Aktif: Server memvalidasi hak kepemilikan data (Ownership Verification) dan melakukan HTML entity encoding (XSS Mitigated).'
  });
});

// POST /api/system/mode - Ubah mode keamanan sistem
router.post('/mode', (req, res) => {
  const { mode } = req.body;
  if (!['vulnerable', 'secure'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'Mode harus bernilai "vulnerable" atau "secure".' });
  }

  setGlobalSecurityMode(mode);

  logSecurityEvent({
    userId: req.user ? req.user.id : null,
    action: 'SECURITY_MODE_SWITCHED',
    endpoint: '/api/system/mode',
    securityMode: mode,
    statusCode: 200,
    details: `Mode simulasi diubah menjadi "${mode.toUpperCase()}" oleh ${req.user ? req.user.name : 'Client'}`
  });

  return res.json({
    success: true,
    mode,
    label: mode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN',
    message: `Sistem beralih ke mode ${mode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN'}.`
  });
});

export default router;
