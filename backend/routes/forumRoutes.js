import express from 'express';
import db from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { getSecurityMode, logSecurityEvent } from '../middleware/audit.js';

const router = express.Router();

// Sanitizer helper untuk mitigasi XSS sisi server (HTML Entity Encoding)
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

/**
 * =========================================================================
 * SIMULASI KERENTANAN 1: STORED CROSS-SITE SCRIPTING (XSS)
 * Endpoint: POST /api/forum/threads/:id/comments & GET /api/forum/threads/:id
 * =========================================================================
 * - Versi Rentan: Konten komentar disimpan ke database APA ADANYA tanpa sanitasi.
 *   Pada saat dikirim ke frontend, konten tidak dienkoding dan siap dieksekusi
 *   melalui innerHTML / dangerouslySetInnerHTML di browser.
 *
 * - Versi Aman: Konten disanitasi di backend menggunakan HTML Entity Encoding,
 *   serta di frontend ditampilkan murni sebagai teks aman (Text Node JSX).
 * =========================================================================
 */

// GET /api/forum/threads - Daftar semua forum diskusi
router.get('/threads', verifyToken, (req, res) => {
  const mode = getSecurityMode(req);
  const threadsStmt = db.prepare(`
    SELECT 
      t.id,
      t.course_id,
      t.title,
      t.content,
      t.created_at,
      c.code as course_code,
      c.name as course_name,
      u.name as author_name,
      u.role as author_role,
      (SELECT COUNT(*) FROM forum_comments WHERE thread_id = t.id) as comment_count
    FROM forum_threads t
    JOIN courses c ON t.course_id = c.id
    JOIN users u ON t.author_id = u.id
    ORDER BY t.created_at DESC
  `);

  const threads = threadsStmt.all();

  return res.json({
    success: true,
    securityMode: mode,
    threads
  });
});

// GET /api/forum/threads/:id - Detail thread dan daftar komentarnya
router.get('/threads/:id', verifyToken, (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  const mode = getSecurityMode(req);

  const threadStmt = db.prepare(`
    SELECT 
      t.id,
      t.course_id,
      t.title,
      t.content,
      t.created_at,
      c.code as course_code,
      c.name as course_name,
      u.name as author_name,
      u.role as author_role
    FROM forum_threads t
    JOIN courses c ON t.course_id = c.id
    JOIN users u ON t.author_id = u.id
    WHERE t.id = ?
  `);

  const thread = threadStmt.get(threadId);

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Topik diskusi tidak ditemukan.' });
  }

  const commentsStmt = db.prepare(`
    SELECT 
      c.id,
      c.thread_id,
      c.author_id,
      c.content,
      c.created_at,
      u.name as author_name,
      u.role as author_role,
      u.identifier
    FROM forum_comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.thread_id = ?
    ORDER BY c.created_at ASC
  `);

  const rawComments = commentsStmt.all(threadId);

  // Format comments berdasarkan mode keamanan
  const comments = rawComments.map(c => {
    return {
      ...c,
      // Tanda mode untuk frontend rendering engine
      renderMode: mode,
      isRawUnescaped: mode === 'vulnerable',
      // Jika mode secure, pastikan aman ganda
      safeContent: mode === 'secure' ? sanitizeHtmlEntities(c.content) : c.content
    };
  });

  return res.json({
    success: true,
    securityMode: mode,
    thread,
    comments
  });
});

// POST /api/forum/threads/:id/comments - Kirim komentar baru
router.post('/threads/:id/comments', verifyToken, (req, res) => {
  const threadId = parseInt(req.params.id, 10);
  const { content } = req.body;
  const mode = getSecurityMode(req);
  const currentUser = req.user;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Konten komentar tidak boleh kosong.' });
  }

  // Cek apakah thread ada
  const thread = db.prepare('SELECT id, title FROM forum_threads WHERE id = ?').get(threadId);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread diskusi tidak ditemukan.' });
  }

  let finalContentToStore = content.trim();
  const containsSuspiciousTag = /<[a-z][\s\S]*>/i.test(finalContentToStore);

  if (mode === 'secure') {
    // --- VERSI AMAN (SECURE / MITIGASI STORED XSS) ---
    // 1. Sanitasi input di server: Ubah karakter berbahaya menjadi entitas HTML aman
    finalContentToStore = sanitizeHtmlEntities(finalContentToStore);

    logSecurityEvent({
      userId: currentUser.id,
      action: 'XSS_INPUT_SANITIZED_SECURE',
      endpoint: `/api/forum/threads/${threadId}/comments`,
      securityMode: 'secure',
      statusCode: 201,
      details: containsSuspiciousTag
        ? `[MITIGASI XSS] User "${currentUser.name}" mengirim payload HTML/script. Server berhasil melakukan entity encoding: "${finalContentToStore}"`
        : `User "${currentUser.name}" mengirim komentar aman.`
    });

  } else {
    // --- VERSI RENTAN (VULNERABLE / RAW STORAGE) ---
    // Kerentanan: Konten mentah tanpa sanitasi langsung disimpan ke database.
    // Jika mengandung skrip (misal <img src=x onerror=...>), skrip tersimpan secara permanen.
    if (containsSuspiciousTag) {
      logSecurityEvent({
        userId: currentUser.id,
        action: 'STORED_XSS_PAYLOAD_SAVED_VULNERABLE',
        endpoint: `/api/forum/threads/${threadId}/comments`,
        securityMode: 'vulnerable',
        statusCode: 201,
        details: `[PERINGATAN AUDIT] Terdeteksi input tag HTML/skrip disimpan tanpa sanitasi oleh user "${currentUser.name}": "${finalContentToStore.substring(0, 100)}..." (Tersimpan sebagai Stored XSS)!`
      });
    } else {
      logSecurityEvent({
        userId: currentUser.id,
        action: 'COMMENT_POSTED_VULNERABLE',
        endpoint: `/api/forum/threads/${threadId}/comments`,
        securityMode: 'vulnerable',
        statusCode: 201,
        details: `User "${currentUser.name}" mengirim komentar dalam mode rentan.`
      });
    }
  }

  const insertStmt = db.prepare(`
    INSERT INTO forum_comments (thread_id, author_id, content)
    VALUES (?, ?, ?)
  `);

  const result = insertStmt.run(threadId, currentUser.id, finalContentToStore);

  return res.status(201).json({
    success: true,
    securityMode: mode,
    message: mode === 'secure' 
      ? 'Komentar berhasil dikirim (dengan perlindungan sanitasi Stored XSS aktif).' 
      : 'Komentar berhasil disimpan (dalam mode simulasi rentan tanpa filter HTML).',
    comment: {
      id: Number(result.lastInsertRowid),
      thread_id: threadId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      author_role: currentUser.role,
      content: finalContentToStore,
      created_at: new Date().toISOString()
    }
  });
});

export default router;
