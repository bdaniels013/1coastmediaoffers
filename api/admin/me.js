import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return; // 401 sent by helper
  res.status(200).json({ user: me.username });
}
