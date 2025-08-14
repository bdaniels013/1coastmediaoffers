import { getCookie } from './cookies.js';
import { verifyAdminJWT } from './auth.js';

export function requireAdmin(req, res) {
  const token = getCookie(req, 'admin_session');
  const session = token && verifyAdminJWT(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session; // { username }
}
