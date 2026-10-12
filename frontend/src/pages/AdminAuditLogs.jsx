import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Activity, ShieldAlert, ShieldCheck, RefreshCw, Filter, Terminal } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({ filter, limit: 100 });
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Error memuat log audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const getActionBadge = (action, statusCode) => {
    if (action.includes('EXPLOITED') || action.includes('STORED_XSS')) {
      return <span className="badge badge-danger">⚠️ {action}</span>;
    }
    if (action.includes('BLOCKED') || action.includes('SANITIZED')) {
      return <span className="badge badge-success">🛡️ {action}</span>;
    }
    if (statusCode >= 400) {
      return <span className="badge badge-warning">{action}</span>;
    }
    return <span className="badge badge-info">{action}</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Log Audit Keamanan Sistem Informasi
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Rekaman aktivitas autentikasi, pengujian kerentanan Stored XSS, dan percobaan bypass kontrol akses IDOR.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadLogs}>
          <RefreshCw size={14} />
          Segarkan Data Log
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${filter === '' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter('')}
        >
          Semua Catatan Log
        </button>
        <button
          className={`btn ${filter === 'IDOR' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter('IDOR')}
        >
          🎯 Celah Otorisasi (IDOR)
        </button>
        <button
          className={`btn ${filter === 'XSS' ? 'btn-warning' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter('XSS')}
        >
          💉 Injeksi Script (Stored XSS)
        </button>
        <button
          className={`btn ${filter === 'AUTH' ? 'btn-secondary' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilter('AUTH')}
        >
          🔑 Autentikasi & Sesi
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pengguna</th>
                <th>Aksi Keamanan</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Endpoint</th>
                <th>Detail & Bukti Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Memuat catatan log audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Belum ada rekaman log sesuai filter yang dipilih.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.76rem', color: '#64748b' }}>
                      {new Date(log.created_at || log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td>
                      {log.user_name ? (
                        <div>
                          <strong>{log.user_name}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.identifier} ({log.user_role})</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Anonim</span>
                      )}
                    </td>
                    <td>{getActionBadge(log.action, log.status_code)}</td>
                    <td>
                      <span className={`badge ${log.security_mode === 'vulnerable' ? 'badge-danger' : 'badge-success'}`}>
                        {log.security_mode?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: log.status_code === 200 ? '#059669' : (log.status_code === 403 ? '#dc2626' : '#d97706') }}>
                        {log.status_code}
                      </strong>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#1e40af' }}>
                      {log.endpoint}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#334155', maxWidth: '350px' }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
