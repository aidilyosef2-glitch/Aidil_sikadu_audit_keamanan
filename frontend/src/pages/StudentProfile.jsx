import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, GraduationCap, Award, Shield, CheckCircle2 } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Profil Mahasiswa
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
          Informasi data diri dan status kemahasiswaan pada sistem akademik.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              {user?.name}
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-info">Mahasiswa S1</span>
              <span className="badge badge-success">
                <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                Status: {user?.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>NOMOR INDUK MAHASISWA (NIM)</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {user?.identifier}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ALAMAT EMAIL KAMPUS</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {user?.email}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PROGRAM STUDI</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {user?.prodi}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SEMESTER BERJALAN</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              Semester {user?.semester} (Genap)
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1e40af' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield size={16} />
            <strong>Catatan Keamanan & Identitas Sintetis:</strong>
          </div>
          Seluruh data profil ini merupakan data sintetis simulasi akademik. Password disimpan dalam format salt hash Bcrypt di database lokal SQLite.
        </div>
      </div>
    </div>
  );
}
