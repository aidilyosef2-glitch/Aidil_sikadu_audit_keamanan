import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, BookOpen, FileText, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function AdminDashboard({ setActiveTab }) {
  const { user, securityMode } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statRes, logRes] = await Promise.all([
          api.getAdminStats(),
          api.getAuditLogs({ limit: 6 })
        ]);
        if (statRes.success) setStats(statRes.stats);
        if (logRes.success) setLogs(logRes.logs);
      } catch (err) {
        console.error('Error memuat data admin:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat statistik sistem kampus...</div>;
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '1.75rem',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 15px rgba(30, 58, 138, 0.2)'
      }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Pusat Kendali Administrator SIKADU
        </h2>
        <p style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          Pengawasan infrastruktur akademik digital & pemantauan audit keamanan sistem informasi secara real-time.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="stat-val">{stats?.totalStudents || 0}</div>
            <div className="stat-label">Total Mahasiswa Terdaftar</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{stats?.totalDosen || 0}</div>
            <div className="stat-label">Total Dosen Pengampu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{stats?.totalCourses || 0}</div>
            <div className="stat-label">Mata Kuliah Aktif</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-val">{stats?.securityAlerts?.idor + stats?.securityAlerts?.xss || 0}</div>
            <div className="stat-label">Total Event Audit Keamanan</div>
          </div>
        </div>
      </div>

      {/* Grid: Aksi Cepat & Log Terkini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Aksi Cepat Akun */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Users size={18} style={{ color: '#2563eb' }} />
                Pengelolaan Akun Akademik
              </h3>
              <p className="card-subtitle">Manajemen pengguna mahasiswa dan staf dosen</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('users')}>
              Kelola Pengguna
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem' }}>
            Admin memiliki wewenang penuh untuk membuat akun baru, memperbarui informasi profil, mereset kata sandi demo, serta menonaktifkan akun yang melanggar kebijakan kampus.
          </p>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Akun Mahasiswa Aktif:</span>
              <strong>{stats?.totalStudents} Akun</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Akun Dosen Aktif:</span>
              <strong>{stats?.totalDosen} Akun</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>File Tugas Tersimpan:</span>
              <strong>{stats?.totalSubmissions} Berkas Dokumen</strong>
            </div>
          </div>
        </div>

        {/* Audit Log Terkini */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Activity size={18} style={{ color: '#dc2626' }} />
                Catatan Log Audit Keamanan Terkini
              </h3>
              <p className="card-subtitle">Event deteksi simulasi IDOR & XSS real-time</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('audit-logs')}>
              Lihat Semua Log
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Belum ada rekaman log audit keamanan.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{
                  padding: '0.65rem 0.85rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  background: log.action.includes('EXPLOITED') || log.action.includes('STORED_XSS') ? '#fff1f2' : '#ffffff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: log.action.includes('BLOCKED') ? '#059669' : (log.action.includes('EXPLOITED') ? '#dc2626' : '#1e40af') }}>
                      [{log.action}]
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      {new Date(log.created_at || log.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                  <div style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.details}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
