import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Award, Edit3, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LecturerGrades() {
  const [courseId, setCourseId] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formTugas, setFormTugas] = useState(0);
  const [formUts, setFormUts] = useState(0);
  const [formUas, setFormUas] = useState(0);
  const [formCatatan, setFormCatatan] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadCourseGrades = async (cId) => {
    try {
      setLoading(true);
      const res = await api.getCourseGrades(cId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Gagal mengambil nilai kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseGrades(courseId);
  }, [courseId]);

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormTugas(student.tugas || 0);
    setFormUts(student.uts || 0);
    setFormUas(student.uas || 0);
    setFormCatatan(student.catatan || '');
    setSaveStatus(null);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await api.updateGrade({
        studentId: editingStudent.student_id,
        courseId,
        tugas: formTugas,
        uts: formUts,
        uas: formUas,
        catatan: formCatatan
      });

      setSaveStatus({ type: 'success', message: res.message });
      setEditingStudent(null);
      await loadCourseGrades(courseId);
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.message || 'Gagal menyimpan nilai' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Pengelolaan & Input Nilai Mahasiswa
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Perbarui komponen penilaian Tugas (30%), UTS (30%), dan UAS (40%) mahasiswa per kelas.
          </p>
        </div>

        {/* Pemilih Kelas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Pilih Kelas:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '260px' }}
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
          >
            <option value={1}>TIF201 - Audit Keamanan Sistem Informasi</option>
            <option value={2}>TIF202 - Rekayasa Perangkat Lunak Berbasis Web</option>
            <option value={3}>SIF301 - Tata Kelola Keamanan Informasi</option>
          </select>
        </div>
      </div>

      {saveStatus && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          background: saveStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: saveStatus.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {saveStatus.message}
        </div>
      )}

      {loading || !data ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data nilai kelas...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Award size={18} style={{ color: '#2563eb' }} />
                {data.course.code} - {data.course.name} ({data.course.sks} SKS)
              </h3>
              <p className="card-subtitle">
                Jadwal: {data.course.schedule} • Ruangan: {data.course.room}
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIM</th>
                  <th>Nama Mahasiswa</th>
                  <th>Program Studi</th>
                  <th>Tugas (30%)</th>
                  <th>UTS (30%)</th>
                  <th>UAS (40%)</th>
                  <th>Nilai Akhir</th>
                  <th>Grade</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((mhs) => (
                  <tr key={mhs.student_id}>
                    <td><strong>{mhs.nim}</strong></td>
                    <td>{mhs.student_name}</td>
                    <td>{mhs.prodi}</td>
                    <td>{mhs.tugas}</td>
                    <td>{mhs.uts}</td>
                    <td>{mhs.uas}</td>
                    <td><strong>{mhs.nilai_akhir}</strong></td>
                    <td>
                      <span className={`badge ${['A', 'A-'].includes(mhs.grade_letter) ? 'badge-success' : 'badge-warning'}`}>
                        {mhs.grade_letter}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '200px' }}>
                      {mhs.catatan || '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(mhs)}
                      >
                        <Edit3 size={13} />
                        Ubah Nilai
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Nilai */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Input Nilai: {editingStudent.student_name} ({editingStudent.nim})
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Nilai akhir dihitung otomatis: (30% Tugas) + (30% UTS) + (40% UAS).
            </p>

            <form onSubmit={handleSaveGrade}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tugas (0-100)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={formTugas}
                    onChange={(e) => setFormTugas(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UTS (0-100)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={formUts}
                    onChange={(e) => setFormUts(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">UAS (0-100)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    value={formUas}
                    onChange={(e) => setFormUas(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Evaluasi Akademik:</label>
                <textarea
                  rows="2"
                  className="form-textarea"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Contoh: Pemahaman konsep audit dan mitigasi IDOR sangat memuaskan."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingStudent(null)}
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
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
