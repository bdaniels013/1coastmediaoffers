import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/requireAdmin.js';

export default async function handler(req, res) {
  const me = requireAdmin(req, res);
  if (!me) return;

  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM services ORDER BY name ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      await sql`
        INSERT INTO services (id, name, blurb, base_one_time_cents, base_monthly_cents, includes)
        VALUES (${b.id}, ${b.name}, ${b.blurb || null}, ${b.base_one_time_cents || 0}, ${b.base_monthly_cents || 0}, ${JSON.stringify(b.includes||[])}::jsonb)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          blurb = EXCLUDED.blurb,
          base_one_time_cents = EXCLUDED.base_one_time_cents,
          base_monthly_cents = EXCLUDED.base_monthly_cents,
          includes = EXCLUDED.includes,
          updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      await sql`DELETE FROM services WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'PUT') {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: 'id required' });
      await sql`
        UPDATE services SET
          name = ${b.name},
          blurb = ${b.blurb || null},
          base_one_time_cents = ${b.base_one_time_cents || 0},
          base_monthly_cents = ${b.base_monthly_cents || 0},
          includes = ${JSON.stringify(b.includes||[])}::jsonb,
          updated_at = NOW()
        WHERE id = ${b.id}
      `;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
