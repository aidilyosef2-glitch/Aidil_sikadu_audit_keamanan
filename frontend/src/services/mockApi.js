// Simulator In-Browser untuk GitHub Pages Deployment (Static Hosting)
// Menyediakan data demo lengkap & logika simulasi IDOR & Stored XSS saat backend Express tidak tersedia.

const STORAGE_KEY = 'sikadu_mock_db_v1';

const getInitialData = () => ({
  mode: 'vulnerable',
  users: [
    { id: 1, identifier: '20240101', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@kampus.ac.id', password: 'password123', role: 'mahasiswa', prodi: 'Teknik Informatika', semester: 5, status: 'aktif' },
    { id: 2, identifier: '20240102', name: 'Budi Santoso', email: 'budi.santoso@kampus.ac.id', password: 'password123', role: 'mahasiswa', prodi: 'Teknik Informatika', semester: 5, status: 'aktif' },
    { id: 3, identifier: '20240103', name: 'Citra Lestari', email: 'citra.lestari@kampus.ac.id', password: 'password123', role: 'mahasiswa', prodi: 'Sistem Informasi', semester: 3, status: 'aktif' },
    { id: 4, identifier: '19800101', name: 'Dr. Hendra Gunawan, M.T.', email: 'hendra.gunawan@kampus.ac.id', password: 'password123', role: 'dosen', prodi: 'Teknik Informatika', semester: 0, status: 'aktif' },
    { id: 5, identifier: '19850202', name: 'Dr. Sri Wahyuni, M.Kom.', email: 'sri.wahyuni@kampus.ac.id', password: 'password123', role: 'dosen', prodi: 'Sistem Informasi', semester: 0, status: 'aktif' },
    { id: 6, identifier: '19750001', name: 'Administrator Sistem', email: 'admin@kampus.ac.id', password: 'adminpassword123', role: 'admin', prodi: 'Pusat TI', semester: 0, status: 'aktif' }
  ],
  courses: [
    { id: 1, code: 'IF301', name: 'Audit Keamanan Sistem Informasi', sks: 3, dosen_id: 4, dosen_name: 'Dr. Hendra Gunawan, M.T.', schedule: 'Senin, 08:00 - 10:30', room: 'Lab Cyber Security 1' },
    { id: 2, code: 'IF302', name: 'Kriptografi & Keamanan Data', sks: 3, dosen_id: 4, dosen_name: 'Dr. Hendra Gunawan, M.T.', schedule: 'Rabu, 10:30 - 13:00', room: 'Lab Komputasi A' },
    { id: 3, code: 'SI204', name: 'Tata Kelola TI & Manajemen Risiko', sks: 3, dosen_id: 5, dosen_name: 'Dr. Sri Wahyuni, M.Kom.', schedule: 'Kamis, 13:30 - 16:00', room: 'Ruang Teori 302' }
  ],
  grades: {
    1: [
      { grade_id: 1, student_id: 1, course_id: 1, course_code: 'IF301', course_name: 'Audit Keamanan Sistem Informasi', sks: 3, dosen_name: 'Dr. Hendra Gunawan, M.T.', tugas: 85, uts: 88, uas: 90, nilai_akhir: 87.9, grade_letter: 'A', catatan: 'Pemahaman materi audit keamanan sangat baik.' },
      { grade_id: 2, student_id: 1, course_id: 2, course_code: 'IF302', course_name: 'Kriptografi & Keamanan Data', sks: 3, dosen_name: 'Dr. Hendra Gunawan, M.T.', tugas: 80, uts: 78, uas: 84, nilai_akhir: 81.0, grade_letter: 'A-', catatan: 'Tugas implementasi cipher tuntas.' },
      { grade_id: 3, student_id: 1, course_id: 3, course_code: 'SI204', course_name: 'Tata Kelola TI & Manajemen Risiko', sks: 3, dosen_name: 'Dr. Sri Wahyuni, M.Kom.', tugas: 88, uts: 82, uas: 86, nilai_akhir: 85.4, grade_letter: 'A', catatan: 'Analisis risiko COBIT sangat komprehensif.' }
    ],
    2: [
      { grade_id: 4, student_id: 2, course_id: 1, course_code: 'IF301', course_name: 'Audit Keamanan Sistem Informasi', sks: 3, dosen_name: 'Dr. Hendra Gunawan, M.T.', tugas: 75, uts: 70, uas: 74, nilai_akhir: 73.1, grade_letter: 'B', catatan: 'Tingkatkan analisis mitigasi teknis.' },
      { grade_id: 5, student_id: 2, course_id: 2, course_code: 'IF302', course_name: 'Kriptografi & Keamanan Data', sks: 3, dosen_name: 'Dr. Hendra Gunawan, M.T.', tugas: 78, uts: 80, uas: 82, nilai_akhir: 80.2, grade_letter: 'A-', catatan: 'Bagus, pertahankan keaktifan.' }
    ],
    3: [
      { grade_id: 6, student_id: 3, course_id: 3, course_code: 'SI204', course_name: 'Tata Kelola TI & Manajemen Risiko', sks: 3, dosen_name: 'Dr. Sri Wahyuni, M.Kom.', tugas: 90, uts: 92, uas: 95, nilai_akhir: 92.6, grade_letter: 'A', catatan: 'Luar biasa, hasil audit framework sempurna.' }
    ]
  },
  threads: [
    {
      id: 1,
      course_id: 1,
      course_code: 'IF301',
      course_name: 'Audit Keamanan Sistem Informasi',
      title: 'Diskusi Tugas 1 Analisis Keamanan Web & OWASP Top 10',
      content: 'Halo rekan-rekan mahasiswa. Forum ini dibuka untuk berdiskusi terkait metodologi audit keamanan web dan pengujian celah injeksi serta access control. Silakan berbagi temuan dan pertanyaan di sini.',
      author_name: 'Dr. Hendra Gunawan, M.T.',
      author_role: 'dosen',
      created_at: '2026-10-12 10:00:00',
      comment_count: 2
    },
    {
      id: 2,
      course_id: 2,
      course_code: 'IF302',
      course_name: 'Kriptografi & Keamanan Data',
      title: 'Implementasi Algoritma Enkripsi AES vs RSA',
      content: 'Mari diskusikan perbandingan performa enkripsi simetris (AES) dan asimetris (RSA) pada transmisi data akademik.',
      author_name: 'Dr. Hendra Gunawan, M.T.',
      author_role: 'dosen',
      created_at: '2026-10-12 11:30:00',
      comment_count: 1
    }
  ],
  comments: [
    {
      id: 1,
      thread_id: 1,
      author_id: 1,
      author_name: 'Ahmad Fauzi',
      author_role: 'mahasiswa',
      identifier: '20240101',
      content: 'Izin bertanya Pak, apakah pengujian celah IDOR harus menyertakan PoC perubahan ID numerik pada KHS?',
      created_at: '2026-10-12 10:15:00'
    },
    {
      id: 2,
      thread_id: 1,
      author_id: 4,
      author_name: 'Dr. Hendra Gunawan, M.T.',
      author_role: 'dosen',
      identifier: '19800101',
      content: 'Benar Ahmad. Anda perlu mendokumentasikan parameter permintaan sebelum dan sesudah verifikasi kepemilikan objek.',
      created_at: '2026-10-12 10:20:00'
    }
  ],
  auditLogs: [
    {
      id: 1,
      timestamp: '2026-10-12 18:00:00',
      user_id: 1,
      user_name: 'Ahmad Fauzi',
      user_role: 'mahasiswa',
      identifier: '20240101',
      action: 'LOGIN_SUCCESS',
      endpoint: '/api/auth/login',
      security_mode: 'vulnerable',
      status_code: 200,
      details: 'Pengguna Ahmad Fauzi berhasil masuk ke portal SIKADU.',
      ip_address: '127.0.0.1'
    }
  ]
});

export const getDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const init = getInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  return init;
};

export const saveDb = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
};

const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export function handleMockRequest(endpoint, options = {}, headers = {}) {
  const db = getDb();
  const token = localStorage.getItem('sikadu_token');
  let currentUser = null;
  if (token) {
    try {
      currentUser = JSON.parse(atob(token));
    } catch (e) {}
  }
  const mode = headers['x-security-mode'] || db.mode || 'vulnerable';

  const logEvent = (action, code, details) => {
    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user_id: currentUser?.id || null,
      user_name: currentUser?.name || 'Guest',
      user_role: currentUser?.role || 'guest',
      identifier: currentUser?.identifier || '-',
      action,
      endpoint,
      security_mode: mode,
      status_code: code,
      details,
      ip_address: 'Client (Demo)'
    });
    saveDb(db);
  };

  // 1. Auth Login
  if (endpoint === '/auth/login' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const user = db.users.find(u => 
      (u.identifier === body.identifier || u.email === body.identifier) && u.password === body.password
    );
    if (!user) {
      logEvent('LOGIN_FAILED', 401, `Percobaan login gagal untuk identifier: ${body.identifier}`);
      const err = new Error('NIM/NIP/Email atau password salah.');
      err.status = 401;
      err.data = { success: false, message: 'NIM/NIP/Email atau password salah.' };
      throw err;
    }
    const fakeToken = btoa(JSON.stringify(user));
    logEvent('LOGIN_SUCCESS', 200, `User ${user.name} berhasil login.`);
    return {
      success: true,
      token: fakeToken,
      user
    };
  }

  // 2. Auth Me
  if (endpoint === '/auth/me') {
    if (!currentUser) throw Object.assign(new Error('Sesi tidak valid'), { status: 401 });
    return { success: true, user: currentUser };
  }

  // 3. System Mode
  if (endpoint === '/system/mode') {
    if (options.method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      db.mode = body.mode;
      saveDb(db);
      logEvent('SECURITY_MODE_SWITCHED', 200, `Mode simulasi diubah menjadi ${body.mode.toUpperCase()}`);
      return {
        success: true,
        mode: body.mode,
        label: body.mode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN'
      };
    }
    return {
      success: true,
      mode: db.mode,
      label: db.mode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN'
    };
  }

  // 4. Student Dashboard
  if (endpoint === '/student/dashboard') {
    return {
      success: true,
      student: currentUser,
      stats: { totalCourses: 3, totalSks: 9, ipk: '3.78', pendingAssignments: 1 },
      courses: db.courses,
      assignments: [
        { id: 1, title: 'Analisis Kerentanan OWASP Top 10', deadline: '2026-10-20 23:59', course_name: 'Audit Keamanan Sistem Informasi', submission_id: null }
      ]
    };
  }

  // 5. Student Courses
  if (endpoint === '/student/courses') {
    return { success: true, courses: db.courses };
  }

  // 6. IDOR Simulator: /grades/student/:id
  const gradeMatch = endpoint.match(/^\/grades\/student\/(\d+)$/);
  if (gradeMatch) {
    const targetId = parseInt(gradeMatch[1], 10);
    const targetUser = db.users.find(u => u.id === targetId && u.role === 'mahasiswa');
    if (!targetUser) {
      const err = new Error('Data mahasiswa tidak ditemukan.');
      err.status = 404;
      err.data = { success: false, message: 'Data mahasiswa tidak ditemukan.' };
      throw err;
    }

    if (mode === 'secure') {
      if (currentUser?.role === 'mahasiswa' && currentUser.id !== targetId) {
        logEvent('IDOR_BLOCKED', 403, `[BLOCKED] Mahasiswa "${currentUser.name}" mencoba mengakses nilai target ID ${targetId}. Akses ditolak!`);
        const err = new Error('Akses Ditolak (Mitigasi IDOR): Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain.');
        err.status = 403;
        err.data = {
          success: false,
          securityMode: 'secure',
          vulnerability: 'IDOR_MITIGATED',
          message: 'Akses Ditolak (Mitigasi IDOR): Anda tidak memiliki hak otorisasi untuk melihat nilai mahasiswa lain.'
        };
        throw err;
      }
      logEvent('GRADE_VIEW_SECURE_AUTHORIZED', 200, `User ${currentUser?.name} mengakses nilai sah ID ${targetId}.`);
    } else {
      const isIdor = currentUser?.role === 'mahasiswa' && currentUser.id !== targetId;
      logEvent(isIdor ? 'IDOR_EXPLOITED_VULNERABLE' : 'GRADE_VIEW_VULNERABLE', 200, 
        isIdor ? `[PERINGATAN AUDIT] Mahasiswa "${currentUser?.name}" berhasil mengintip nilai "${targetUser.name}" (IDOR Rentan)!`
               : `User ${currentUser?.name} melihat nilai ID ${targetId}.`
      );
    }

    const studentGrades = db.grades[targetId] || [
      { grade_id: 99, student_id: targetId, course_code: 'IF301', course_name: 'Audit Keamanan Sistem Informasi', sks: 3, dosen_name: 'Dr. Hendra Gunawan', tugas: 80, uts: 85, uas: 88, nilai_akhir: 85.0, grade_letter: 'A', catatan: 'Prestasi memuaskan.' }
    ];

    return {
      success: true,
      securityMode: mode,
      vulnerableNotice: mode === 'vulnerable' && currentUser?.role === 'mahasiswa' && currentUser?.id !== targetId
        ? '⚠️ PERHATIAN AUDIT: Data ini berhasil diakses melalui celah IDOR (akses data pengguna lain tanpa verifikasi kepemilikan).'
        : null,
      student: targetUser,
      summary: { totalCourses: studentGrades.length, totalSks: studentGrades.length * 3, ipk: '3.75' },
      grades: studentGrades
    };
  }

  // 7. Forum Threads & Stored XSS Simulator
  if (endpoint === '/forum/threads') {
    return { success: true, securityMode: mode, threads: db.threads };
  }

  const threadMatch = endpoint.match(/^\/forum\/threads\/(\d+)$/);
  if (threadMatch && (!options.method || options.method === 'GET')) {
    const threadId = parseInt(threadMatch[1], 10);
    const thread = db.threads.find(t => t.id === threadId) || db.threads[0];
    const comments = db.comments.filter(c => c.thread_id === threadId).map(c => ({
      ...c,
      renderMode: mode,
      isRawUnescaped: mode === 'vulnerable',
      safeContent: mode === 'secure' ? sanitizeHtml(c.content) : c.content
    }));
    return { success: true, securityMode: mode, thread, comments };
  }

  const commentPostMatch = endpoint.match(/^\/forum\/threads\/(\d+)\/comments$/);
  if (commentPostMatch && options.method === 'POST') {
    const threadId = parseInt(commentPostMatch[1], 10);
    const body = JSON.parse(options.body || '{}');
    let contentToStore = body.content || '';
    const containsTag = /<[a-z][\s\S]*>/i.test(contentToStore);

    if (mode === 'secure') {
      contentToStore = sanitizeHtml(contentToStore);
      logEvent('XSS_INPUT_SANITIZED_SECURE', 201, `[MITIGASI XSS] User "${currentUser?.name}" mengirim konten dengan tag HTML yang berhasil di-encode.`);
    } else {
      if (containsTag) {
        logEvent('STORED_XSS_PAYLOAD_SAVED_VULNERABLE', 201, `[PERINGATAN AUDIT] Terdeteksi input tag HTML/skrip disimpan tanpa sanitasi oleh "${currentUser?.name}"!`);
      } else {
        logEvent('COMMENT_POSTED_VULNERABLE', 201, `Komentar disimpan tanpa filter.`);
      }
    }

    const newComment = {
      id: db.comments.length + 1,
      thread_id: threadId,
      author_id: currentUser?.id || 1,
      author_name: currentUser?.name || 'Mahasiswa Demo',
      author_role: currentUser?.role || 'mahasiswa',
      identifier: currentUser?.identifier || '20240101',
      content: contentToStore,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    db.comments.push(newComment);
    saveDb(db);

    return {
      success: true,
      securityMode: mode,
      message: mode === 'secure' ? 'Komentar berhasil dikirim (dengan proteksi sanitasi XSS aktif).' : 'Komentar berhasil disimpan (dalam mode simulasi rentan tanpa filter).',
      comment: newComment
    };
  }

  // 8. Assignments
  if (endpoint === '/assignments') {
    return {
      success: true,
      assignments: [
        {
          id: 1,
          title: 'Tugas 1: Analisis Kerentanan Web OWASP Top 10',
          description: 'Lakukan analisis pengujian kerentanan terhadap Insecure Direct Object References dan Stored XSS.',
          deadline: '2026-10-25 23:59:00',
          course_id: 1,
          course_code: 'IF301',
          course_name: 'Audit Keamanan Sistem Informasi',
          dosen_name: 'Dr. Hendra Gunawan, M.T.',
          submission_id: null
        }
      ]
    };
  }

  // 9. Admin Stats, Users & Audit Logs
  if (endpoint === '/admin/stats') {
    const idorAlerts = db.auditLogs.filter(l => l.action.includes('IDOR')).length;
    const xssAlerts = db.auditLogs.filter(l => l.action.includes('XSS')).length;
    return {
      success: true,
      stats: {
        totalStudents: 3,
        totalDosen: 2,
        totalCourses: 3,
        totalSubmissions: 2,
        totalThreads: db.threads.length,
        totalAuditLogs: db.auditLogs.length,
        securityAlerts: { idor: idorAlerts, xss: xssAlerts }
      }
    };
  }

  if (endpoint.startsWith('/admin/users')) {
    return { success: true, users: db.users };
  }

  if (endpoint.startsWith('/admin/audit-logs')) {
    return { success: true, logs: db.auditLogs };
  }

  // Default fallback
  return { success: true, message: 'Operasi demo berhasil dijalankan' };
}
