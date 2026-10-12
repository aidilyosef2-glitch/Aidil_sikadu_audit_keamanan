import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, Edit3, UserCheck, UserX, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  // Form State
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('password123');
  const [formRole, setFormRole] = useState('mahasiswa');
  const [formProdi, setFormProdi] = useState('Teknik Informatika');
  const [formSemester, setFormSemester] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;

      const res = await api.getAdminUsers(params);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Error memuat daftar pengguna:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleOpenAdd = () => {
    setFormIdentifier('');
    setFormName('');
    setFormEmail('');
    setFormPassword('password123');
    setFormRole('mahasiswa');
    setFormProdi('Teknik Informatika');
    setFormSemester(1);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormIdentifier(u.identifier);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword('');
    setFormProdi(u.prodi);
    setFormSemester(u.semester || 1);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await api.createAdminUser({
        identifier: formIdentifier,
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        prodi: formProdi,
        semester: formSemester
      });
      setStatusMsg({ type: 'success', text: res.message });
      setIsAddModalOpen(false);
      await loadUsers();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal membuat akun' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await api.updateAdminUser(editingUser.id, {
        identifier: formIdentifier,
        name: formName,
        email: formEmail,
        password: formPassword || undefined,
        prodi: formProdi,
        semester: formSemester
      });
      setStatusMsg({ type: 'success', text: res.message });
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal memperbarui akun' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const nextStatus = userObj.status === 'aktif' ? 'nonaktif' : 'aktif';
    const confirm = window.confirm(`Ubah status akun ${userObj.name} menjadi "${nextStatus}"?`);
    if (!confirm) return;

    try {
      const res = await api.toggleUserStatus(userObj.id, nextStatus);
      setStatusMsg({ type: 'success', text: res.message });
      await loadUsers();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal mengubah status akun' });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Pengelolaan Akun Pengguna
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Tambah akun baru, edit identitas mahasiswa dan dosen, serta kelola status aktif akun.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={16} />
          Tambah Akun Pengguna
        </button>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: statusMsg.type === 'success' ? '#065f46' : '#b91c1c'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Filter & Pencarian Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Cari nama, NIM/NIP, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Semua Peran</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="dosen">Dosen</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <button type="submit" className="btn btn-secondary btn-sm">
            Terapkan Filter
          </button>
        </form>
      </div>

      {/* Tabel Pengguna */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>NIM / NIP</th>
                <th>Nama Lengkap</th>
                <th>Email Kampus</th>
                <th>Peran</th>
                <th>Program Studi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Tidak ada akun yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.identifier}</strong></td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : (u.role === 'dosen' ? 'badge-info' : 'badge-warning')}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{u.prodi} {u.role === 'mahasiswa' ? `(Sem ${u.semester})` : ''}</td>
                    <td>
                      <span className={`badge ${u.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Pengguna"
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className={`btn ${u.status === 'aktif' ? 'btn-danger' : 'btn-success'} btn-sm`}
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            {u.status === 'aktif' ? <UserX size={13} /> : <UserCheck size={13} />}
                            {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Tambah Akun Pengguna Baru
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Seluruh data akun tersimpan secara lokal dan aman di database SQLite SIKADU.
            </p>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Peran Pengguna:</label>
                  <select
                    className="form-select"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="dosen">Dosen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">NIM / NIP:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value)}
                    placeholder="Contoh: 20240104"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Lengkap:</label>
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Dimas Prakoso"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Kampus:</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="dimas@kampus.ac.id"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kata Sandi Awal:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Program Studi:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formProdi}
                    onChange={(e) => setFormProdi(e.target.value)}
                    required
                  />
                </div>

                {formRole === 'mahasiswa' && (
                  <div className="form-group">
                    <label className="form-label">Semester:</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      className="form-input"
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Akun Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              Edit Akun: {editingUser.name} ({editingUser.identifier})
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Perbarui profil pengguna atau reset kata sandi jika diperlukan.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">NIM / NIP:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formIdentifier}
                    onChange={(e) => setFormIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email Kampus:</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reset Password (Opsional):</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak diubah"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Program Studi:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formProdi}
                    onChange={(e) => setFormProdi(e.target.value)}
                    required
                  />
                </div>
                {editingUser.role === 'mahasiswa' && (
                  <div className="form-group">
                    <label className="form-label">Semester:</label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      className="form-input"
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
