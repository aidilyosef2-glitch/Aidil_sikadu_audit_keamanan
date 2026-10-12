import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ShieldCheck, ArrowRightLeft } from 'lucide-react';

export default function SecurityBanner() {
  const { securityMode, toggleSecurityMode } = useAuth();

  return (
    <div className={`security-alert-bar ${securityMode}`}>
      <div className="alert-bar-content">
        {securityMode === 'vulnerable' ? (
          <>
            <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
            <div>
              <strong>LINGKUNGAN SIMULASI RENTAN AKTIF:</strong>
              <span style={{ marginLeft: 6 }}>
                Stored XSS aktif (komentar forum dieksekusi tanpa sanitasi) & IDOR aktif (akses nilai mahasiswa tanpa validasi kepemilikan data).
              </span>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck size={18} style={{ color: '#059669', flexShrink: 0 }} />
            <div>
              <strong>LINGKUNGAN SIMULASI AMAN AKTIF:</strong>
              <span style={{ marginLeft: 6 }}>
                Mitigasi XSS aktif (HTML Entity Encoding & JSX Text Escaping) & Mitigasi IDOR aktif (Pengecekan Kepemilikan Server Side 403 Forbidden).
              </span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={toggleSecurityMode}
        className={`alert-bar-button ${securityMode}`}
      >
        <ArrowRightLeft size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        Ubah ke {securityMode === 'vulnerable' ? 'Mode Aman' : 'Mode Rentan'}
      </button>
    </div>
  );
}
