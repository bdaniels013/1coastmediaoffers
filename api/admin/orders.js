import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return;

  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  try {
    const { rows } = await sql`
      SELECT o.*, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `;
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
