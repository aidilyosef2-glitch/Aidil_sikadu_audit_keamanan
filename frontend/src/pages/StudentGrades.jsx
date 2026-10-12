import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, AlertTriangle, ShieldCheck, Play, Info, Terminal, User } from 'lucide-react';

export default function StudentGrades() {
  const { user, securityMode } = useAuth();
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State untuk Pengujian Interaktif IDOR
  const [targetStudentId, setTargetStudentId] = useState(user?.id || 1);
  const [auditResult, setAuditResult] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchGrades = async (idToFetch) => {
    try {
      setLoading(true);
      const res = await api.getStudentGrades(idToFetch);
      setGradesData(res);
    } catch (err) {
      console.error('Error memuat nilai:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setTargetStudentId(user.id);
      fetchGrades(user.id);
    }
  }, [user]);

  // Handler pengujian IDOR
  const handleTestIdor = async (customId = null) => {
    const idToTest = customId !== null ? customId : targetStudentId;
    setAuditLoading(true);
    setAuditResult(null);

    const startTime = performance.now();
    try {
      const res = await api.getStudentGrades(idToTest);
      const endTime = performance.now();

      setAuditResult({
        status: 200,
        statusText: '200 OK',
        success: true,
        duration: Math.round(endTime - startTime),
        requestedId: idToTest,
        data: res,
        isIdorBreach: user.id !== Number(idToTest) && securityMode === 'vulnerable'
      });

      // Tampilkan data yang didapat ke tabel
      setGradesData(res);
    } catch (err) {
      const endTime = performance.now();
      setAuditResult({
        status: err.status || 403,
        statusText: err.status === 403 ? '403 Forbidden' : 'Error',
        success: false,
        duration: Math.round(endTime - startTime),
        requestedId: idToTest,
        errorData: err.data || { message: err.message },
        isIdorPrevented: err.status === 403
      });
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Kartu Hasil Studi (KHS) & Nilai Akademik
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Halaman resmi transkrip nilai mahasiswa sekaligus modul simulasi pengujian kerentanan <strong>Insecure Direct Object References (IDOR)</strong>.
        </p>
      </div>

      {/* =========================================================================
          LAB AUDIT KEAMANAN: SIMULATOR IDOR (M6)
         ========================================================================= */}
      <div className={`audit-lab-box ${securityMode}`}>
        <div className="audit-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} style={{ color: securityMode === 'vulnerable' ? '#dc2626' : '#059669' }} />
            <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
              LAB PENGUJIAN AUDIT KERENTANAN M6: INSECURE DIRECT OBJECT REFERENCES (IDOR)
            </strong>
          </div>
          <span className={`audit-tag ${securityMode === 'vulnerable' ? 'badge-danger' : 'badge-success'}`}>
            Mode: {securityMode === 'vulnerable' ? 'VULNERABLE (Celah Aktif)' : 'SECURE (Mitigasi Aktif)'}
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
          Uji apakah mahasiswa yang sedang login (<strong>{user?.name} [ID: {user?.id}]</strong>) dapat mengakses data nilai mahasiswa lain dengan memanipulasi parameter <code>studentId</code> pada request URL <code>GET /api/grades/student/:studentId</code>.
        </p>

        {/* Input Bar & Pintasan Akun Target */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Target ID:</span>
            <input
              type="number"
              className="form-input"
              style={{ width: '90px', padding: '0.4rem 0.6rem' }}
              value={targetStudentId}
              onChange={(e) => setTargetStudentId(e.target.value)}
              min="1"
              max="10"
            />
          </div>

          <button
            className={`btn ${securityMode === 'vulnerable' ? 'btn-danger' : 'btn-primary'} btn-sm`}
            onClick={() => handleTestIdor()}
            disabled={auditLoading}
          >
            <Play size={14} />
            {auditLoading ? 'Menguji...' : 'Kirim Request IDOR'}
          </button>

          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '6px' }}>Pilih Cepat Target:</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setTargetStudentId(1); handleTestIdor(1); }}
            style={{ fontSize: '0.75rem' }}
          >
            Mhs 1: Ahmad Fauzi (ID 1)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setTargetStudentId(2); handleTestIdor(2); }}
            style={{ fontSize: '0.75rem' }}
          >
            Mhs 2: Budi Santoso (ID 2)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { setTargetStudentId(3); handleTestIdor(3); }}
            style={{ fontSize: '0.75rem' }}
          >
            Mhs 3: Citra Lestari (ID 3)
          </button>
        </div>

        {/* Hasil Pengujian IDOR (Audit Output Console) */}
        {auditResult && (
          <div style={{
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '10px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            marginTop: '0.75rem',
            border: auditResult.success && auditResult.isIdorBreach ? '2px solid #ef4444' : '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span>
                <strong>REQUEST:</strong> GET /api/grades/student/{auditResult.requestedId}
              </span>
              <span>
                HTTP STATUS: <strong style={{ color: auditResult.status === 200 ? '#4ade80' : '#f87171' }}>
                  {auditResult.statusText}
                </strong> ({auditResult.duration}ms)
              </span>
            </div>

            {auditResult.isIdorBreach && (
              <div style={{ color: '#fca5a5', marginBottom: '8px', padding: '6px 8px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}>
                ⚠️ <strong>CELAH IDOR DITEMUKAN (VULNERABLE):</strong><br />
                User <code>{user?.name} (ID: {user?.id})</code> berhasil membaca rekam nilai privat milik mahasiswa <code>{auditResult.data?.student?.name} (ID: {auditResult.requestedId})</code> tanpa verifikasi kepemilikan di server!
              </div>
            )}

            {auditResult.isIdorPrevented && (
              <div style={{ color: '#86efac', marginBottom: '8px', padding: '6px 8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '6px' }}>
                🛡️ <strong>MITIGASI IDOR BERHASIL (SECURE):</strong><br />
                Server menolak request dengan kode <code>403 Forbidden</code> karena ID user yang login tidak cocok dengan ID data yang diminta (Server Ownership Verification Aktif).
              </div>
            )}

            <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
              <strong>Raw Server Response:</strong>
              <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', color: '#e2e8f0', maxHeight: '140px', overflowY: 'auto' }}>
                {JSON.stringify(auditResult.data || auditResult.errorData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Data Nilai Mahasiswa */}
      {gradesData && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Award size={18} style={{ color: '#1e40af' }} />
                Data Nilai: {gradesData.student?.name} ({gradesData.student?.identifier})
              </h3>
              <p className="card-subtitle">
                Program Studi: {gradesData.student?.prodi} • Semester: {gradesData.student?.semester}
              </p>
            </div>
            {gradesData.vulnerableNotice && (
              <span className="badge badge-danger">
                ⚠️ Nilai Didapat Melalui IDOR
              </span>
            )}
          </div>

          {/* Ringkasan IPK */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL SKS</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{gradesData.summary?.totalSks} SKS</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>IPK SEMENTARA</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>{gradesData.summary?.ipk}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL MATA KULIAH</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{gradesData.summary?.totalCourses} Kelas</div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode MK</th>
                  <th>Nama Mata Kuliah</th>
                  <th>SKS</th>
                  <th>Dosen Pengampu</th>
                  <th>Tugas (30%)</th>
                  <th>UTS (30%)</th>
                  <th>UAS (40%)</th>
                  <th>Nilai Akhir</th>
                  <th>Grade</th>
                  <th>Catatan Evaluasi</th>
                </tr>
              </thead>
              <tbody>
                {gradesData.grades?.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                      Belum ada catatan nilai yang terinput.
                    </td>
                  </tr>
                ) : (
                  gradesData.grades?.map((g) => (
                    <tr key={g.grade_id}>
                      <td><strong>{g.course_code}</strong></td>
                      <td>{g.course_name}</td>
                      <td>{g.sks}</td>
                      <td>{g.dosen_name}</td>
                      <td>{g.tugas}</td>
                      <td>{g.uts}</td>
                      <td>{g.uas}</td>
                      <td><strong>{g.nilai_akhir}</strong></td>
                      <td>
                        <span className={`badge ${['A', 'A-'].includes(g.grade_letter) ? 'badge-success' : 'badge-warning'}`}>
                          {g.grade_letter}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>{g.catatan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
