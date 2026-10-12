import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  FileText,
  MessageSquare,
  UserCheck,
  Users,
  Shield,
  Activity,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Shield size={20} style={{ color: '#38bdf8' }} />
        <h2>Portal {user.role.toUpperCase()}</h2>
      </div>

      <div className="sidebar-menu">
        <span className="sidebar-section-title">Menu Utama</span>

        {/* MAHASISWA MENU */}
        {user.role === 'mahasiswa' && (
          <>
            <button
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <BookOpen size={18} />
              <span>Mata Kuliah</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <Award size={18} />
              <span>Nilai Akademik (IDOR)</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              <FileText size={18} />
              <span>Tugas & Unggah</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'forum' ? 'active' : ''}`}
              onClick={() => setActiveTab('forum')}
            >
              <MessageSquare size={18} />
              <span>Forum Diskusi (XSS)</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserCheck size={18} />
              <span>Profil Saya</span>
            </button>
          </>
        )}

        {/* DOSEN MENU */}
        {user.role === 'dosen' && (
          <>
            <button
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard Dosen</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              <BookOpen size={18} />
              <span>Kelas & Peserta</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <Award size={18} />
              <span>Input & Update Nilai</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              <FileText size={18} />
              <span>Pengumpulan Tugas</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'forum' ? 'active' : ''}`}
              onClick={() => setActiveTab('forum')}
            >
              <MessageSquare size={18} />
              <span>Forum Diskusi</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <UserCheck size={18} />
              <span>Profil Dosen</span>
            </button>
          </>
        )}

        {/* ADMIN MENU */}
        {user.role === 'admin' && (
          <>
            <button
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Ringkasan Kampus</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              <span>Pengelolaan Akun</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit-logs')}
            >
              <Activity size={18} />
              <span>Log Audit Keamanan</span>
            </button>
            <button
              className={`sidebar-item ${activeTab === 'forum' ? 'active' : ''}`}
              onClick={() => setActiveTab('forum')}
            >
              <MessageSquare size={18} />
              <span>Monitor Forum</span>
            </button>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={logout} style={{ color: '#f87171' }}>
          <LogOut size={18} />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
