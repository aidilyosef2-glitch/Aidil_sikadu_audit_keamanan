import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BookOpen, Users, MapPin, Calendar } from 'lucide-react';

export default function LecturerClasses() {
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (cId) => {
    try {
      setLoading(true);
      const res = await api.getCourseGrades(cId);
      if (res.success) {
        setCourseData(res);
      }
    } catch (err) {
      console.error('Error memuat data kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCourseId);
  }, [selectedCourseId]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Kelas & Mahasiswa Peserta Kuliah
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Daftar absensi dan rekapitulasi mahasiswa yang mengambil mata kuliah Anda.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Pilih Kelas:</span>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '260px' }}
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          >
            <option value={1}>TIF201 - Audit Keamanan Sistem Informasi</option>
            <option value={2}>TIF202 - Rekayasa Perangkat Lunak Berbasis Web</option>
            <option value={3}>SIF301 - Tata Kelola Keamanan Informasi</option>
          </select>
        </div>
      </div>

      {loading || !courseData ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat daftar peserta kelas...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <BookOpen size={18} style={{ color: '#2563eb' }} />
                {courseData.course.code} - {courseData.course.name}
              </h3>
              <p className="card-subtitle">
                Jadwal: {courseData.course.schedule} • Ruang: {courseData.course.room} • Bobot: {courseData.course.sks} SKS
              </p>
            </div>
            <span className="badge badge-info">
              {courseData.students.length} Mahasiswa Terdaftar
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIM</th>
                  <th>Nama Lengkap</th>
                  <th>Program Studi</th>
                  <th>Status Akademik</th>
                </tr>
              </thead>
              <tbody>
                {courseData.students.map((mhs, idx) => (
                  <tr key={mhs.student_id}>
                    <td>{idx + 1}</td>
                    <td><strong>{mhs.nim}</strong></td>
                    <td>{mhs.student_name}</td>
                    <td>{mhs.prodi}</td>
                    <td>
                      <span className="badge badge-success">Aktif Terdaftar</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
