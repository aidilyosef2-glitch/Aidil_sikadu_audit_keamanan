import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Award, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function StudentDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getStudentDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Gagal mengambil dashboard mahasiswa:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat data dashboard...</div>;
  }

  const { stats, courses, assignments } = data || { stats: {}, courses: [], assignments: [] };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
        color: '#ffffff',
        padding: '1.75rem',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 15px rgba(30, 58, 138, 0.2)'
      }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Selamat Datang, {user?.name}!
        </h2>
        <p style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          NIM: <strong>{user?.identifier}</strong> • Program Studi: <strong>{user?.prodi}</strong> • Semester: <strong>{user?.semester}</strong>
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.ipk || '0.00'}</div>
            <div className="stat-label">Indeks Prestasi Kumulatif (IPK)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalSks || 0}</div>
            <div className="stat-label">Total SKS Diambil</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.pendingAssignments || 0}</div>
            <div className="stat-label">Tugas Belum Dikumpulkan</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">{courses.length}</div>
            <div className="stat-label">Mata Kuliah Aktif</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Mata Kuliah & Tugas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Card Mata Kuliah Aktif */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <BookOpen size={18} style={{ color: '#2563eb' }} />
                Mata Kuliah Semester Ini
              </h3>
              <p className="card-subtitle">Daftar kelas yang sedang Anda ikuti</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('courses')}>
              Lihat Semua
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {courses.map((course) => (
              <div key={course.id} style={{
                padding: '0.85rem 1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                    {course.code} - {course.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Dosen: {course.dosen_name} • {course.schedule}
                  </div>
                </div>
                <span className="badge badge-info">{course.sks} SKS</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Tugas Akademik */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <FileText size={18} style={{ color: '#d97706' }} />
                Tugas & Praktikum Berjalan
              </h3>
              <p className="card-subtitle">Pengumpulan tugas modul perkuliahan</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('assignments')}>
              Kelola Tugas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assignments.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>Tidak ada tugas aktif saat ini.</p>
            ) : (
              assignments.map((item) => (
                <div key={item.id} style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {item.course_code} • Tenggat: {item.deadline}
                    </div>
                  </div>
                  {item.submission_id ? (
                    <span className="badge badge-success">Sudah Dikumpulkan</span>
                  ) : (
                    <span className="badge badge-warning">Belum Dikumpulkan</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
