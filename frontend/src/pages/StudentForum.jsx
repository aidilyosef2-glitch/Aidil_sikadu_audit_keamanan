import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, ShieldAlert, ShieldCheck, Code, AlertTriangle, User, Calendar } from 'lucide-react';

export default function StudentForum() {
  const { user, securityMode } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(1);
  const [threadDetail, setThreadDetail] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadThreads = async () => {
    try {
      const res = await api.getForumThreads();
      if (res.success) {
        setThreads(res.threads);
      }
    } catch (err) {
      console.error('Error memuat thread forum:', err);
    }
  };

  const loadThreadDetail = async (threadId) => {
    try {
      setLoading(true);
      const res = await api.getForumThread(threadId);
      if (res.success) {
        setThreadDetail(res);
      }
    } catch (err) {
      console.error('Error memuat detail thread:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId, securityMode]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await api.postComment(selectedThreadId, commentText);
      setStatusMsg({ type: 'success', text: res.message });
      setCommentText('');
      await loadThreadDetail(selectedThreadId);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal mengirim komentar' });
    } finally {
      setSubmitting(false);
    }
  };

  const injectPayload = (payload) => {
    setCommentText(payload);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Forum Diskusi Akademik
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Ruang diskusi interaktif perkuliahan & modul simulasi pengujian kerentanan <strong>Stored Cross-Site Scripting (XSS)</strong>.
        </p>
      </div>

      {/* =========================================================================
          LAB AUDIT KEAMANAN: SIMULATOR STORED XSS (M5)
         ========================================================================= */}
      <div className={`audit-lab-box ${securityMode}`}>
        <div className="audit-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} style={{ color: securityMode === 'vulnerable' ? '#dc2626' : '#059669' }} />
            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
              LAB PENGUJIAN AUDIT KERENTANAN M5: STORED CROSS-SITE SCRIPTING (XSS)
            </strong>
          </div>
          <span className={`audit-tag ${securityMode === 'vulnerable' ? 'badge-danger' : 'badge-success'}`}>
            Mode: {securityMode === 'vulnerable' ? 'VULNERABLE (Celah Aktif)' : 'SECURE (Mitigasi Aktif)'}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Uji perilaku rendering output pada form komentar diskusi. Masukkan kode HTML atau script di bawah untuk membuktikan kerentanan:
        </p>

        {/* Payload Quick Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Sisipkan Payload Uji Demo:</span>
          
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => injectPayload('<b style="color:#dc2626;font-size:15px;">[XSS-DEMO] Teks ini dirender tebal dan merah dari tag HTML murni!</b>')}
            style={{ fontSize: '0.74rem' }}
          >
            Payload 1: Visual HTML Tag
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => injectPayload('<div style="background:#fef2f2;border:2px dashed #ef4444;padding:8px;border-radius:6px;color:#991b1b;"><strong>⚠️ PERINGATAN XSS:</strong> Komentar ini disusupi kode HTML kustom tanpa sanitasi output!</div>')}
            style={{ fontSize: '0.74rem' }}
          >
            Payload 2: Custom DOM Box
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => injectPayload('<img src="invalid-img-src" onerror="alert(\'SIMULASI AUDIT M5: Stored XSS Berhasil Dieksekusi pada Akun ' + (user?.name || '') + '!\')" />')}
            style={{ fontSize: '0.74rem' }}
          >
            Payload 3: Script Alert (Image OnError)
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
          * Catatan Audit: Pada <strong>Mode Rentan</strong>, komentar dirender menggunakan <code>dangerouslySetInnerHTML</code>. Pada <strong>Mode Aman</strong>, komentar di-encode di server dan dirender murni sebagai teks aman (Text Node JSX).
        </div>
      </div>

      {/* Grid Layout: Daftar Thread & Isi Komentar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Kolom Kiri: Daftar Thread */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h3 className="card-title">
              <MessageSquare size={18} style={{ color: '#2563eb' }} />
              Daftar Topik Diskusi
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedThreadId(t.id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: selectedThreadId === t.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedThreadId === t.id ? '#eff6ff' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{t.course_code}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.comment_count} Komentar</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', lineHeight: 1.3 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  Oleh: {t.author_name} ({t.author_role})
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Detail Thread & Komentar */}
        <div className="card">
          {loading || !threadDetail ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat diskusi...</div>
          ) : (
            <>
              {/* Header Thread */}
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                  {threadDetail.thread.course_code} - {threadDetail.thread.course_name}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px' }}>
                  {threadDetail.thread.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                  {threadDetail.thread.content}
                </p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Dibuat oleh: <strong>{threadDetail.thread.author_name}</strong> • {new Date(threadDetail.thread.created_at).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Status Notifikasi */}
              {statusMsg && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: statusMsg.type === 'success' ? '#065f46' : '#b91c1c'
                }}>
                  {statusMsg.text}
                </div>
              )}

              {/* Form Tambah Komentar */}
              <form onSubmit={handlePostComment} style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tulis Komentar / Masukkan Payload XSS:</span>
                    <span style={{ fontSize: '0.72rem', color: securityMode === 'vulnerable' ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      Target Mode: {securityMode.toUpperCase()}
                    </span>
                  </label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ketik komentar diskusi atau salin payload uji XSS di atas..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`btn ${securityMode === 'vulnerable' ? 'btn-danger' : 'btn-primary'} btn-sm`}
                  disabled={submitting}
                >
                  <Send size={14} />
                  {submitting ? 'Mengirim...' : 'Kirim Komentar'}
                </button>
              </form>

              {/* Daftar Komentar & Rendering XSS Demonstration */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Komentar ({threadDetail.comments.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {threadDetail.comments.map((comment) => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-author">
                          <User size={15} style={{ color: '#2563eb' }} />
                          <span>{comment.author_name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({comment.author_role})</span>
                        </div>
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* AREA RENDERING OUTPUT: INTI PERBEDAAN VULNERABLE VS SECURE */}
                      {securityMode === 'vulnerable' ? (
                        /* MODE RENTAN: Menggunakan dangerouslySetInnerHTML tanpa sanitasi */
                        <div>
                          <div
                            className="comment-body vulnerable-rendered"
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                          />
                          <div style={{ fontSize: '0.68rem', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                            [Rendered with dangerouslySetInnerHTML - Stored XSS Permitted]
                          </div>
                        </div>
                      ) : (
                        /* MODE AMAN: Menggunakan Text Node standar React (XSS Mitigated) */
                        <div>
                          <div className="comment-body secure-rendered">
                            {comment.content}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                            [Rendered as Plain Text Node & HTML Escaped - XSS Mitigated]
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
