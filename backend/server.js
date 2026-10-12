import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { getCurrentGlobalMode } from './middleware/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-security-mode']
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Keamanan penyajian file statis: Jangan eksekusi file upload
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'attachment');
  next();
}, express.static(uploadDir));

// Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

// Root Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'SIKADU API — Sistem Informasi Kampus Digital',
    securityMode: getCurrentGlobalMode(),
    timestamp: new Date().toISOString()
  });
});

// Sajikan static frontend jika folder dist tersedia (Production Unified Deployment)
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 Handler untuk rute API yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.url} tidak ditemukan di server SIKADU.`
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server SIKADU.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 SIKADU Backend Server Berjalan pada port: http://localhost:${PORT}`);
  console.log(`🛡️  Mode Simulasi Keamanan Awal : [${getCurrentGlobalMode().toUpperCase()}]`);
  console.log('📚 Akun Demo Tersedia:');
  console.log('   - Mahasiswa 1: ahmad.fauzi@kampus.ac.id / password123 (NIM: 20240101)');
  console.log('   - Mahasiswa 2: budi.santoso@kampus.ac.id / password123 (NIM: 20240102)');
  console.log('   - Mahasiswa 3: citra.lestari@kampus.ac.id / password123 (NIM: 20240103)');
  console.log('   - Dosen 1    : hendra.gunawan@kampus.ac.id / password123 (NIP: 19800101)');
  console.log('   - Dosen 2    : sri.wahyuni@kampus.ac.id / password123 (NIP: 19850202)');
  console.log('   - Admin      : admin@kampus.ac.id / adminpassword123 (NIP: 19750001)');
  console.log('================================================================');
});
