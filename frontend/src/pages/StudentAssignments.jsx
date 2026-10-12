import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, Upload, CheckCircle2, Clock, AlertCircle, FileCheck, ShieldAlert } from 'lucide-react';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeUploadId, setActiveUploadId] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadAssignments = async () => {
    try {
      const res = await api.getAssignments();
      if (res.success) {
        setAssignments(res.assignments);
      }
    } catch (err) {
      console.error('Gagal mengambil tugas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ekstensi di frontend
      const allowed = ['pdf', 'docx', 'zip', 'txt'];
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) {
        alert('File ditolak! Hanya file berekstensi .pdf, .docx, .zip, dan .txt yang diizinkan untuk keamanan simulasi.');
        e.target.value = '';
        setFileToUpload(null);
        return;
      }

      // Validasi batas ukuran 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file melebihi batas maksimum 5MB.');
        e.target.value = '';
        setFileToUpload(null);
        return;
      }

      setFileToUpload(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload || !activeUploadId) return;

    setIsUploading(true);
    setUploadStatus(null);
    try {
      const res = await api.submitAssignment(activeUploadId, fileToUpload);
      setUploadStatus({ type: 'success', message: res.message });
      setFileToUpload(null);
      setActiveUploadId(null);
      await loadAssignments();
    } catch (err) {
      setUploadStatus({ type: 'error', message: err.message || 'Gagal mengunggah tugas.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat daftar tugas...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Tugas & Praktikum Mahasiswa
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Unggah laporan praktikum pada lingkungan simulasi penyimpanan aman (File Upload Validation & Non-Executable Storage).
        </p>
      </div>

      {uploadStatus && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          background: uploadStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: uploadStatus.type === 'success' ? '#065f46' : '#b91c1c',
          border: `1px solid ${uploadStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          fontSize: '0.85rem'
        }}>
          {uploadStatus.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {assignments.map((item) => (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="badge badge-info">{item.course_code} - {item.course_name}</span>
              {item.submission_id ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                  {item.submission_status === 'dinilai' ? 'Sudah Dinilai' : 'Terkumpul'}
                </span>
              ) : (
                <span className="badge badge-warning">
                  <Clock size={12} style={{ marginRight: 4 }} />
                  Belum Dikumpulkan
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              {item.title}
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem', minHeight: '40px' }}>
              {item.description}
            </p>

            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
              <div>Dosen Pengampu: <strong>{item.dosen_name}</strong></div>
              <div>Batas Akhir (Deadline): <strong>{item.deadline}</strong></div>
            </div>

            {/* Riwayat Pengumpulan Jika Sudah Ada */}
            {item.submission_id && (
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  📁 File Terkumpul: {item.original_filename}
                </div>
                <div style={{ color: '#64748b' }}>
                  Waktu: {new Date(item.submitted_at).toLocaleString('id-ID')}
                </div>
                {item.score !== null && item.score !== undefined && (
                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 700, color: '#059669' }}>Nilai: {item.score} / 100</span>
                    {item.feedback && (
                      <p style={{ color: '#334155', marginTop: '2px', fontStyle: 'italic' }}>
                        Feedback Dosen: "{item.feedback}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActiveUploadId(item.id)}
              style={{ width: '100%' }}
            >
              <Upload size={14} />
              {item.submission_id ? 'Kumpulkan Ulang File' : 'Unggah Jawaban Tugas'}
            </button>
          </div>
        ))}
      </div>

      {/* Modal Upload File */}
      {activeUploadId && (
        <div className="modal-overlay" onClick={() => setActiveUploadId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Unggah File Laporan Tugas
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Pilih file dokumen tugas (.pdf, .docx, .zip, .txt). Batas maksimal ukuran 5MB.
            </p>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Pilih Dokumen:</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.zip,.txt"
                  required
                />
              </div>

              {fileToUpload && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem', color: '#166534' }}>
                  <strong>File Siap Diunggah:</strong> {fileToUpload.name} ({(fileToUpload.size / 1024).toFixed(1)} KB)
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveUploadId(null)}
                  disabled={isUploading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUploading || !fileToUpload}
                >
                  {isUploading ? 'Mengunggah...' : 'Kirim File Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
