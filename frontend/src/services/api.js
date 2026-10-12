import { handleMockRequest } from './mockApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

export const getAuthToken = () => localStorage.getItem('sikadu_token');
export const setAuthToken = (token) => localStorage.setItem('sikadu_token', token);
export const removeAuthToken = () => localStorage.removeItem('sikadu_token');

export const getLocalSecurityMode = () => localStorage.getItem('sikadu_security_mode') || 'vulnerable';
export const setLocalSecurityMode = (mode) => localStorage.setItem('sikadu_security_mode', mode);

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const currentMode = getLocalSecurityMode();

  const headers = {
    'x-security-mode': currentMode,
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData differently than JSON
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Jika di GitHub Pages tanpa backend server, langsung gunakan in-browser simulator
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  if (isGitHubPages) {
    return handleMockRequest(endpoint, options, headers);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({ success: false, message: 'Respon server tidak valid' }));

    if (!response.ok) {
      const error = new Error(data.message || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // Jika backend lokal tidak aktif atau gagal koneksi, fallback ke simulator
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch')) {
      return handleMockRequest(endpoint, options, headers);
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (identifier, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // System Security Mode
  getSystemMode: () => apiRequest('/system/mode'),
  setSystemMode: (mode) => apiRequest('/system/mode', {
    method: 'POST',
    body: JSON.stringify({ mode })
  }),

  // Student
  getStudentDashboard: () => apiRequest('/student/dashboard'),
  getStudentCourses: () => apiRequest('/student/courses'),
  getStudentProfile: () => apiRequest('/student/profile'),

  // Grades & IDOR
  getStudentGrades: (studentId, overrideMode = null) => {
    const headers = overrideMode ? { 'x-security-mode': overrideMode } : {};
    return apiRequest(`/grades/student/${studentId}`, { headers });
  },
  getCourseGrades: (courseId) => apiRequest(`/grades/course/${courseId}`),
  updateGrade: (data) => apiRequest('/grades/update', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Forum & Stored XSS
  getForumThreads: () => apiRequest('/forum/threads'),
  getForumThread: (threadId, overrideMode = null) => {
    const headers = overrideMode ? { 'x-security-mode': overrideMode } : {};
    return apiRequest(`/forum/threads/${threadId}`, { headers });
  },
  postComment: (threadId, content, overrideMode = null) => {
    const headers = overrideMode ? { 'x-security-mode': overrideMode } : {};
    return apiRequest(`/forum/threads/${threadId}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content })
    });
  },

  // Assignments & File Upload Simulation
  getAssignments: () => apiRequest('/assignments'),
  submitAssignment: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: formData
    });
  },
  getSubmissions: (assignmentId) => apiRequest(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, data) => apiRequest(`/assignments/submissions/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Admin
  getAdminStats: () => apiRequest('/admin/stats'),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${query}`);
  },
  createAdminUser: (userData) => apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  updateAdminUser: (userId, userData) => apiRequest(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  toggleUserStatus: (userId, status) => apiRequest(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs?${query}`);
  }
};
