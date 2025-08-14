import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return;

  try {
    if (req.method === 'GET') {
      const service = req.query.service || null;
      const q = service
        ? sql`SELECT * FROM addons WHERE service_id=${service} ORDER BY label ASC`
        : sql`SELECT * FROM addons ORDER BY label ASC`;
      const { rows } = await q;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      await sql`
        INSERT INTO addons (id, service_id, label, description, short, badge, popular, price_one_time_cents, price_monthly_cents)
        VALUES (${b.id}, ${b.service_id}, ${b.label}, ${b.description || null}, ${b.short || null}, ${b.badge || null}, ${!!b.popular}, ${b.price_one_time_cents || 0}, ${b.price_monthly_cents || 0})
        ON CONFLICT (id) DO UPDATE SET
          service_id = EXCLUDED.service_id,
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          short = EXCLUDED.short,
          badge = EXCLUDED.badge,
          popular = EXCLUDED.popular,
          price_one_time_cents = EXCLUDED.price_one_time_cents,
          price_monthly_cents = EXCLUDED.price_monthly_cents,
          updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      await sql`DELETE FROM addons WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
