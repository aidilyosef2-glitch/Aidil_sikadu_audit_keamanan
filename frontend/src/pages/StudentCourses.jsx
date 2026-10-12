import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BookOpen, User, Calendar, MapPin, Users } from 'lucide-react';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.getStudentCourses();
        if (res.success) {
          setCourses(res.courses);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar mata kuliah:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat daftar mata kuliah...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Daftar Mata Kuliah Terdaftar (KRS)
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Daftar kelas aktif yang Anda ambil pada semester genap berjalan.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {courses.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="badge badge-info">{c.code}</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e3a8a' }}>{c.sks} SKS</span>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', minHeight: '42px' }}>
              {c.name}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={15} style={{ color: '#2563eb' }} />
                <span>Dosen: <strong>{c.dosen_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} style={{ color: '#059669' }} />
                <span>Jadwal: {c.schedule}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} style={{ color: '#d97706' }} />
                <span>Ruangan: {c.room}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={15} style={{ color: '#64748b' }} />
                <span>Total Mahasiswa Kelas: {c.total_students || 3} Mahasiswa</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
