import { sql } from '@vercel/postgres';

if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_NO_SSL) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NO_SSL + (process.env.POSTGRES_URL_NO_SSL.includes('?') ? '&' : '?') + 'sslmode=require';
}

export default async function handler(req, res) {
  try {
    const { rows: services } = await sql`SELECT * FROM services ORDER BY name ASC`;
    const { rows: addons }   = await sql`SELECT * FROM addons ORDER BY label ASC`;

    const grouped = services.map(s => ({
      key: s.id,
      name: s.name,
      blurb: s.blurb || '',
      base: { oneTime: Math.round((s.base_one_time_cents||0)/100), monthly: Math.round((s.base_monthly_cents||0)/100) },
      includes: s.includes || [],
      addOns: addons.filter(a => a.service_id === s.id).map(a => ({
        id: a.id,
        label: a.label,
        desc: a.description || '',
        short: a.short || '',
        badge: a.badge || '',
        popular: !!a.popular,
        price: { oneTime: Math.round((a.price_one_time_cents||0)/100), monthly: Math.round((a.price_monthly_cents||0)/100) }
      }))
    }));

    res.status(200).json({ services: grouped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
