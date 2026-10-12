import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function LecturerDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [courseRes, assignRes] = await Promise.all([
          api.getAssignments(), // lecturer assignments list has course info
          api.getForumThreads()
        ]);
        if (courseRes.success) {
          setAssignments(courseRes.assignments);
        }
      } catch (err) {
        console.error('Error memuat data dosen:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
          Selamat Datang, {user?.name}!
        </h2>
        <p style={{ color: '#93c5fd', fontSize: '0.85rem' }}>
          NIP: <strong>{user?.identifier}</strong> • Homebase: <strong>{user?.prodi}</strong> • Peran: <strong>Dosen Pengampu</strong>
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-val">{assignments.length || 2}</div>
            <div className="stat-label">Mata Kuliah Diampu</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">3</div>
            <div className="stat-label">Mahasiswa Bimbingan</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-val">{assignments.length}</div>
            <div className="stat-label">Tugas Modul Aktif</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">100%</div>
            <div className="stat-label">Status Kelengkapan Nilai</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <BookOpen size={18} style={{ color: '#2563eb' }} />
              Aksi Cepat Pengelolaan Kelas
            </h3>
            <p className="card-subtitle">Pilih menu untuk mengelola nilai atau tugas mahasiswa</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Penilaian Akademik
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Input dan perbarui nilai Tugas, UTS, dan UAS mahasiswa per kelas mata kuliah.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('grades')}>
              Kelola Nilai Kelas
            </button>
          </div>

          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Koreksi Pengumpulan Tugas
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Periksa dokumen laporan praktikum yang diunggah mahasiswa dan berikan skor serta umpan balik.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('assignments')}>
              Periksa Pengumpulan Tugas
            </button>
          </div>

          <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
              Forum Diskusi Dosen & Mahasiswa
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Ikuti diskusi perkuliahan dan uji respon sanitasi Stored XSS pada form komentar.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('forum')}>
              Buka Forum Diskusi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
