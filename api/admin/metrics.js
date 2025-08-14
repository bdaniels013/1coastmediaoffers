import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return;

  try {
    const rev = await sql`SELECT COALESCE(SUM(total_cents),0) AS cents FROM orders WHERE status='paid'`;
    const ord = await sql`SELECT COUNT(*)::int AS count FROM orders WHERE status='paid'`;
    const cus = await sql`SELECT COUNT(DISTINCT email)::int AS count FROM customers`;
    const pv  = await sql`SELECT COUNT(*)::int AS count FROM events WHERE type='pageview'`;

    res.status(200).json({
      revenue_cents: Number(rev.rows[0].cents || 0),
      orders: ord.rows[0].count,
      customers: cus.rows[0].count,
      pageviews: pv.rows[0].count
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
