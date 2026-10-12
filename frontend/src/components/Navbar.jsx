import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, LogOut, GraduationCap, User, RefreshCw } from 'lucide-react';

export default function Navbar({ onOpenAuditModal }) {
  const { user, logout, securityMode, toggleSecurityMode } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="brand-icon">
          <GraduationCap size={24} />
        </div>
        <div className="brand-text">
          <h1>SIKADU</h1>
          <p>Sistem Informasi Kampus Digital</p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Tombol & Label Mode Simulasi Keamanan */}
        <button
          className={`security-badge ${securityMode}`}
          onClick={toggleSecurityMode}
          title="Klik untuk beralih antara Mode Rentan dan Mode Aman"
        >
          <span className="pulse-dot"></span>
          {securityMode === 'vulnerable' ? (
            <>
              <ShieldAlert size={16} />
              <span>SIMULASI RENTAN</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>SIMULASI AMAN</span>
            </>
          )}
          <RefreshCw size={12} style={{ marginLeft: 4, opacity: 0.7 }} />
        </button>

        {/* User Pill */}
        {user && (
          <div className="user-pill">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role-tag">{user.role} ({user.identifier})</span>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 8, padding: '4px 8px' }}
              title="Keluar dari Akun"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
