import { clearCookie } from '../../lib/cookies.js';
import { COOKIE } from '../../lib/auth.js';

export default async function handler(req, res) {
  clearCookie(res, COOKIE);
  res.status(200).json({ ok: true });
}
