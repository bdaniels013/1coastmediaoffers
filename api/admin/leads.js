import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return;

  try {
    const { rows } = await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`;
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
