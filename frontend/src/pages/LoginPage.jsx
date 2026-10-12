import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, User, ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, securityMode, toggleSecurityMode } = useAuth();
  const [identifier, setIdentifier] = useState('20240101');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali NIM/NIP dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoIdentifier, demoPassword) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1128 0%, #1e3a8a 50%, #0f172a 100%)',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '920px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
      }}>
        {/* Kolom Kiri: Branding & Simulasi Info */}
        <div style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.12)',
              padding: '8px 14px',
              borderRadius: '10px',
              marginBottom: '1.5rem'
            }}>
              <GraduationCap size={28} style={{ color: '#38bdf8' }} />
              <span style={{ fontWeight: 800, letterSpacing: '0.05em' }}>SIKADU</span>
            </div>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.75rem' }}>
              Sistem Informasi Kampus Digital
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Portal akademik fiktif untuk praktikum dan pengujian Audit Keamanan Sistem Informasi Modul M5–M6.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.8rem'
            }}>
              <p style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                Laboratorium Keamanan yang Diuji:
              </p>
              <ul style={{ paddingLeft: '1.2rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                <li><strong>M5: Stored Cross-Site Scripting (XSS)</strong> pada forum diskusi.</li>
                <li><strong>M6: Insecure Direct Object References (IDOR)</strong> pada akses data nilai.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div
              onClick={toggleSecurityMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                background: securityMode === 'vulnerable' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: `1px solid ${securityMode === 'vulnerable' ? '#f87171' : '#34d399'}`,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {securityMode === 'vulnerable' ? <ShieldAlert size={18} color="#fca5a5" /> : <ShieldCheck size={18} color="#6ee7b7" />}
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  Mode: {securityMode === 'vulnerable' ? 'SIMULASI RENTAN' : 'SIMULASI AMAN'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', textDecoration: 'underline' }}>Ganti Mode</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Login & Quick Demo Accounts */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            Masuk ke Portal
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Gunakan NIM, NIP, atau Email demo untuk memulai sesi Anda.
          </p>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">NIM / NIP / Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 20240101"
                  required
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Kata Sandi</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pintasan Akun Demo Audit:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('20240101', 'password123')}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                🎓 Mhs 1: Ahmad (20240101)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('20240102', 'password123')}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                🎓 Mhs 2: Budi (20240102)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('20240103', 'password123')}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                🎓 Mhs 3: Citra (20240103)
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('19800101', 'password123')}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start' }}
              >
                👨‍🏫 Dosen: Dr. Hendra
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleQuickLogin('admin@kampus.ac.id', 'adminpassword123')}
                style={{ gridColumn: 'span 2', fontSize: '0.75rem', justifyContent: 'flex-start', background: '#f8fafc' }}
              >
                ⚙️ Admin: admin@kampus.ac.id
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
