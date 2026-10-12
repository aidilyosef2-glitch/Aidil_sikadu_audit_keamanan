import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, ShieldCheck, Terminal, X, CheckCircle2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { api } from '../services/api';

export default function AuditModal({ isOpen, onClose }) {
  const { user, securityMode, toggleSecurityMode } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const runQuickIdorTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Tes IDOR: Mahasiswa ID 2 (Budi Santoso) mencoba mengambil nilai Mahasiswa ID 1 (Ahmad Fauzi)
      const res = await api.getStudentGrades(1);
      setTestResult({
        success: true,
        status: 200,
        message: 'Akses Diberikan (200 OK) — Celah IDOR aktif!',
        data: res
      });
    } catch (err) {
      setTestResult({
        success: false,
        status: err.status || 403,
        message: 'Akses Ditolak (403 Forbidden) — Mitigasi IDOR aktif!',
        error: err.data || { message: err.message }
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={22} style={{ color: securityMode === 'vulnerable' ? '#dc2626' : '#059669' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Pusat Audit Keamanan Sistem Informasi (M5–M6)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Status Mode Banner */}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: securityMode === 'vulnerable' ? '#fef2f2' : '#ecfdf5',
          border: `1px solid ${securityMode === 'vulnerable' ? '#fecaca' : '#a7f3d0'}`
        }}>
          <div>
            <strong style={{ color: securityMode === 'vulnerable' ? '#991b1b' : '#065f46', fontSize: '0.85rem' }}>
              Mode Saat Ini: {securityMode === 'vulnerable' ? 'SIMULASI RENTAN (VULNERABLE)' : 'SIMULASI AMAN (SECURE)'}
            </strong>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={toggleSecurityMode}>
            <ArrowRightLeft size={13} />
            Ganti Mode
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <button
            className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('summary')}
          >
            Tabel Komparasi Audit
          </button>
          <button
            className={`btn ${activeTab === 'test' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('test')}
          >
            Uji Cepat Simulasi IDOR
          </button>
        </div>

        {activeTab === 'summary' && (
          <div>
            <table className="data-table" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Aspek Audit</th>
                  <th>Versi Rentan (Vulnerable)</th>
                  <th>Versi Aman (Mitigated Secure)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>M5: Stored XSS</strong></td>
                  <td style={{ color: '#b91c1c' }}>
                    Komentar forum disimpan mentah ke database dan ditampilkan di browser menggunakan <code>dangerouslySetInnerHTML</code> tanpa entity encoding.
                  </td>
                  <td style={{ color: '#047857' }}>
                    Server melakukan sanitasi karakter berbahaya (HTML Entity Encoding) dan frontend merender sebagai Plain Text Node standar React JSX.
                  </td>
                </tr>
                <tr>
                  <td><strong>M6: IDOR</strong></td>
                  <td style={{ color: '#b91c1c' }}>
                    Endpoint <code>/api/grades/student/:id</code> hanya mengecek token login tanpa memvalidasi apakah user memiliki hak atas ID target.
                  </td>
                  <td style={{ color: '#047857' }}>
                    Server memverifikasi kepemilikan data (Ownership Verification). Mahasiswa hanya bisa membaca datanya sendiri; jika tidak cocok, respon <code>403 Forbidden</code>.
                  </td>
                </tr>
                <tr>
                  <td><strong>Log Audit</strong></td>
                  <td>Dicatat dengan label <code>IDOR_EXPLOITED</code> dan <code>STORED_XSS</code>.</td>
                  <td>Dicatat dengan label <code>IDOR_BLOCKED</code> dan <code>XSS_SANITIZED</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'test' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>
              Uji pemanggilan endpoint <code>GET /api/grades/student/1</code> menggunakan sesi akun yang sedang aktif (<strong>{user?.name || 'Mahasiswa'}</strong>):
            </p>

            <button
              className="btn btn-primary btn-sm"
              onClick={runQuickIdorTest}
              disabled={testing}
              style={{ marginBottom: '1rem' }}
            >
              {testing ? 'Menguji...' : 'Jalankan Permintaan GET /api/grades/student/1'}
            </button>

            {testResult && (
              <div style={{
                background: '#0f172a',
                color: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.78rem'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>STATUS:</strong> <span style={{ color: testResult.status === 200 ? '#4ade80' : '#f87171' }}>{testResult.message}</span>
                </div>
                <pre style={{ maxHeight: '160px', overflowY: 'auto', color: '#cbd5e1' }}>
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Tutup Modal
          </button>
        </div>
      </div>
    </div>
  );
}
