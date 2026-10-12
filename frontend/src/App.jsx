import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SecurityBanner from './components/SecurityBanner';
import AuditModal from './components/AuditModal';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentGrades from './pages/StudentGrades';
import StudentAssignments from './pages/StudentAssignments';
import StudentForum from './pages/StudentForum';
import StudentProfile from './pages/StudentProfile';

import LecturerDashboard from './pages/LecturerDashboard';
import LecturerClasses from './pages/LecturerClasses';
import LecturerGrades from './pages/LecturerGrades';
import LecturerSubmissions from './pages/LecturerSubmissions';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAuditLogs from './pages/AdminAuditLogs';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#38bdf8' }}>
            SIKADU
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Menyiapkan Portal Kampus Digital & Sesi Keamanan...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // RUTE MAHASISWA
    if (user.role === 'mahasiswa') {
      switch (activeTab) {
        case 'dashboard': return <StudentDashboard setActiveTab={setActiveTab} />;
        case 'courses': return <StudentCourses />;
        case 'grades': return <StudentGrades />;
        case 'assignments': return <StudentAssignments />;
        case 'forum': return <StudentForum />;
        case 'profile': return <StudentProfile />;
        default: return <StudentDashboard setActiveTab={setActiveTab} />;
      }
    }

    // RUTE DOSEN
    if (user.role === 'dosen') {
      switch (activeTab) {
        case 'dashboard': return <LecturerDashboard setActiveTab={setActiveTab} />;
        case 'classes': return <LecturerClasses />;
        case 'grades': return <LecturerGrades />;
        case 'assignments': return <LecturerSubmissions />;
        case 'forum': return <StudentForum />;
        case 'profile': return <StudentProfile />;
        default: return <LecturerDashboard setActiveTab={setActiveTab} />;
      }
    }

    // RUTE ADMIN
    if (user.role === 'admin') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard setActiveTab={setActiveTab} />;
        case 'users': return <AdminUsers />;
        case 'audit-logs': return <AdminAuditLogs />;
        case 'forum': return <StudentForum />;
        default: return <AdminDashboard setActiveTab={setActiveTab} />;
      }
    }

    return <div>Halaman tidak ditemukan.</div>;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigasi */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Navbar Atas */}
        <Navbar onOpenAuditModal={() => setIsAuditModalOpen(true)} />

        {/* Banner Status Simulasi Keamanan (Rentan vs Aman) */}
        <SecurityBanner />

        {/* Konten Halaman Aktif */}
        <main className="page-body">
          {renderContent()}
        </main>
      </div>

      {/* Modal Dialog Pusat Audit Keamanan */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
