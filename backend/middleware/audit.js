import db from '../config/db.js';

// Default mode is 'vulnerable' for educational demonstration
let currentGlobalMode = 'vulnerable';

export const getSecurityMode = (req) => {
  // If client explicitly sent x-security-mode header or query param, honor it; otherwise use global mode
  const headerMode = req.headers['x-security-mode'];
  if (headerMode === 'secure' || headerMode === 'vulnerable') {
    return headerMode;
  }
  const queryMode = req.query?.mode;
  if (queryMode === 'secure' || queryMode === 'vulnerable') {
    return queryMode;
  }
  return currentGlobalMode;
};

export const setGlobalSecurityMode = (mode) => {
  if (mode === 'secure' || mode === 'vulnerable') {
    currentGlobalMode = mode;
    return true;
  }
  return false;
};

export const getCurrentGlobalMode = () => currentGlobalMode;

export const logSecurityEvent = ({
  userId = null,
  action,
  endpoint,
  securityMode,
  statusCode,
  details = '',
  ipAddress = '127.0.0.1'
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, endpoint, security_mode, status_code, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId, action, endpoint, securityMode, statusCode, details, ipAddress);
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err.message);
  }
};
