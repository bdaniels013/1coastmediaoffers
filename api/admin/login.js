import { setCookie } from '../../lib/cookies.js';
import { signAdminJWT, COOKIE, MAX_AGE } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signAdminJWT({ username, role: 'admin' });
  setCookie(res, COOKIE, token, { maxAge: MAX_AGE });
  res.status(200).json({ ok: true });
}
