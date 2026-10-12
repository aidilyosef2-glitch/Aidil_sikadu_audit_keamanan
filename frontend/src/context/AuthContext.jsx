import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken, getLocalSecurityMode, setLocalSecurityMode } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);
  const [securityMode, setSecurityModeState] = useState(getLocalSecurityMode());

  // Inisialisasi: Cek status login dan sinkronkan mode keamanan dengan backend
  useEffect(() => {
    async function initAuth() {
      try {
        if (token) {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            handleLogout();
          }
        }
      } catch (err) {
        console.warn('Sesi login kedaluwarsa atau server offline:', err.message);
        handleLogout();
      }

      // Ambil mode keamanan dari backend
      try {
        const modeRes = await api.getSystemMode();
        if (modeRes.success) {
          setSecurityModeState(modeRes.mode);
          setLocalSecurityMode(modeRes.mode);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi mode sistem:', err.message);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [token]);

  const handleLogin = async (identifier, password) => {
    const res = await api.login(identifier, password);
    if (res.success && res.token) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login gagal');
  };

  const handleLogout = async () => {
    try {
      if (token) await api.logout();
    } catch (e) {
      // Abaikan error jaringan saat logout
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(null);
    }
  };

  const setSecurityMode = async (mode) => {
    try {
      const res = await api.setSystemMode(mode);
      if (res.success) {
        setSecurityModeState(mode);
        setLocalSecurityMode(mode);
      }
    } catch (err) {
      // Fallback local state
      setSecurityModeState(mode);
      setLocalSecurityMode(mode);
    }
  };

  const toggleSecurityMode = async () => {
    const newMode = securityMode === 'vulnerable' ? 'secure' : 'vulnerable';
    await setSecurityMode(newMode);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      securityMode,
      login: handleLogin,
      logout: handleLogout,
      setSecurityMode,
      toggleSecurityMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
