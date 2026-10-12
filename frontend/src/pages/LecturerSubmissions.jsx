import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, CheckCircle2, Award, Download, Save } from 'lucide-react';

export default function LecturerSubmissions() {
  const [selectedAssignId, setSelectedAssignId] = useState(1);
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradingSub, setGradingSub] = useState(null);
  const [scoreVal, setScoreVal] = useState(85);
  const [feedbackVal, setFeedbackVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const loadSubmissions = async (aId) => {
    try {
      setLoading(true);
      const res = await api.getSubmissions(aId);
      if (res.success) {
        setSubData(res);
      }
    } catch (err) {
      console.error('Error memuat submission tugas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions(selectedAssignId);
  }, [selectedAssignId]);

  const handleOpenGrade = (sub) => {
    setGradingSub(sub);
    setScoreVal(sub.score || 85);
    setFeedbackVal(sub.feedback || '');
    setSaveMsg(null);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;

    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await api.gradeSubmission(gradingSub.submission_id, {
        score: scoreVal,
        feedback: feedbackVal
      });

      setSaveMsg({ type: 'success', text: res.message });
      setGradingSub(null);
      await loadSubmissions(selectedAssignId);
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.message || 'Gagal menyimpan nilai' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Pengumpulan Tugas & Penilaian Mahasiswa
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Periksa dokumen praktikum yang diunggah dan berikan nilai serta umpan balik evaluasi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Pilih Modul Tugas:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '320px' }}
            value={selectedAssignId}
            onChange={(e) => setSelectedAssignId(Number(e.target.value))}
          >
            <option value={1}>Tugas M5: Audit Kerentanan Stored XSS</option>
            <option value={2}>Tugas M6: Audit Celah Otorisasi IDOR</option>
            <option value={3}>Tugas Mandiri: Arsitektur REST API</option>
          </select>
        </div>
      </div>

      {saveMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          background: saveMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: saveMsg.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {saveMsg.text}
        </div>
      )}

      {loading || !subData ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data pengumpulan tugas...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <FileText size={18} style={{ color: '#2563eb' }} />
                {subData.assignment.title}
              </h3>
              <p className="card-subtitle">
                Mata Kuliah: {subData.assignment.course_code} • Batas: {subData.assignment.deadline}
              </p>
            </div>
            <span className="badge badge-info">
              {subData.submissions.length} Berkas Terkumpul
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIM</th>
                  <th>Nama Mahasiswa</th>
                  <th>Nama Berkas</th>
                  <th>Ukuran</th>
                  <th>Waktu Pengumpulan</th>
                  <th>Nilai</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subData.submissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      Belum ada berkas tugas yang diunggah mahasiswa untuk modul ini.
                    </td>
                  </tr>
                ) : (
                  subData.submissions.map((sub) => (
                    <tr key={sub.submission_id}>
                      <td><strong>{sub.nim}</strong></td>
                      <td>{sub.student_name}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#1e40af' }}>
                          📄 {sub.original_filename}
                        </span>
                      </td>
                      <td>{(sub.file_size / 1024).toFixed(1)} KB</td>
                      <td>{new Date(sub.submitted_at).toLocaleString('id-ID')}</td>
                      <td>
                        {sub.score !== null ? <strong>{sub.score}</strong> : '-'}
                      </td>
                      <td>
                        <span className={`badge ${sub.status === 'dinilai' ? 'badge-success' : 'badge-warning'}`}>
                          {sub.status === 'dinilai' ? 'Sudah Dinilai' : 'Menunggu Koreksi'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenGrade(sub)}
                        >
                          <Award size={13} />
                          Beri Nilai
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Penilaian Tugas */}
      {gradingSub && (
        <div className="modal-overlay" onClick={() => setGradingSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Penilaian Tugas: {gradingSub.student_name} ({gradingSub.nim})
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              File: <strong>{gradingSub.original_filename}</strong>
            </p>

            <form onSubmit={handleSaveGrade}>
              <div className="form-group">
                <label className="form-label">Skor Nilai Tugas (0 - 100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="form-input"
                  value={scoreVal}
                  onChange={(e) => setScoreVal(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Umpan Balik (Feedback Dosen):</label>
                <textarea
                  rows="3"
                  className="form-textarea"
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Contoh: Laporan audit sangat detail dengan bukti uji tangkapan layar yang jelas."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGradingSub(null)}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  <Save size={14} />
                  {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
