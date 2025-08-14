import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  const { name, email, message, metadata } = req.body || {};
  await sql`
    INSERT INTO leads (name, email, message, metadata)
    VALUES (${name||null}, ${email||null}, ${message||null}, ${JSON.stringify(metadata||{})}::jsonb)
  `;
  res.status(200).json({ ok: true });
}
