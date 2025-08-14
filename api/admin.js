// /api/admin.js
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

// Let @vercel/postgres see a pooled SSL URL even if only NO_SSL exists
if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_NO_SSL) {
  process.env.POSTGRES_URL =
    process.env.POSTGRES_URL_NO_SSL +
    (process.env.POSTGRES_URL_NO_SSL.includes('?') ? '&' : '?') +
    'sslmode=require';
}

const COOKIE = 'admin_auth';
const ONE_DAY = 60 * 60 * 24;

// --- cookie helpers ---
function setCookie(res, name, value, maxAge = ONE_DAY * 7) {
  const cookie = `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    process.env.VERCEL_ENV === 'production' ? 'Secure;' : ''
  }`;
  res.setHeader('Set-Cookie', cookie);
}
function clearCookie(res, name) {
  res.setHeader(
    'Set-Cookie',
    `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${
      process.env.VERCEL_ENV === 'production' ? 'Secure;' : ''
    }`
  );
}
function getToken(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[COOKIE];
}
function requireAdmin(req, res) {
  try {
    const token = getToken(req);
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return payload?.username || 'admin';
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
}

// --- public catalog (used by homepage) ---
async function getCatalog(res) {
  const { rows: services } =
    await sql`SELECT * FROM services ORDER BY name ASC`;
  const { rows: addons } =
    await sql`SELECT * FROM addons ORDER BY label ASC`;

  const grouped = services.map((s) => ({
    key: s.id,
    name: s.name,
    blurb: s.blurb || '',
    base: {
      oneTime: Math.round((s.base_one_time_cents || 0) / 100),
      monthly: Math.round((s.base_monthly_cents || 0) / 100),
    },
    includes: s.includes || [],
    addOns: addons
      .filter((a) => a.service_id === s.id)
      .map((a) => ({
        id: a.id,
        label: a.label,
        desc: a.description || '',
        short: a.short || '',
        badge: a.badge || '',
        popular: !!a.popular,
        price: {
          oneTime: Math.round((a.price_one_time_cents || 0) / 100),
          monthly: Math.round((a.price_monthly_cents || 0) / 100),
        },
      })),
  }));

  res.status(200).json({ services: grouped });
}

// --- metrics helper ---
async function getMetrics() {
  const rev =
    await sql`SELECT COALESCE(SUM(total_cents),0) AS c FROM orders WHERE status='paid'`;
  const orders =
    await sql`SELECT COUNT(*)::int AS n FROM orders WHERE status='paid'`;
  const customers =
    await sql`SELECT COUNT(*)::int AS n FROM customers`;
  const pageviews =
    await sql`SELECT COUNT(*)::int AS n FROM events WHERE type='pageview'`;
  return {
    revenue_cents: Number(rev.rows[0].c || 0),
    orders: Number(orders.rows[0].n || 0),
    customers: Number(customers.rows[0].n || 0),
    pageviews: Number(pageviews.rows[0].n || 0),
  };
}

// --- main handler ---
export default async function handler(req, res) {
  try {
    const { r: resource } = req.query;

    // -------- PUBLIC ROUTES --------
    if (resource === 'catalog' && req.method === 'GET') {
      return await getCatalog(res);
    }

    if (resource === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};
      if (
        username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASS
      ) {
        const token = jwt.sign(
          { username, ts: Date.now() },
          process.env.ADMIN_JWT_SECRET,
          { expiresIn: '7d' }
        );
        setCookie(res, COOKIE, token);
        return res.status(200).json({ ok: true });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (resource === 'logout') {
      clearCookie(res, COOKIE);
      return res.status(200).json({ ok: true });
    }

    if (resource === 'me') {
      try {
        const token = getToken(req);
        const { username } = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        return res.status(200).json({ user: username || 'admin' });
      } catch {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // -------- AUTH’D ROUTES --------
    const user = requireAdmin(req, res);
    if (!user) return;

    // Metrics
    if (resource === 'metrics' && req.method === 'GET') {
      const kpis = await getMetrics();
      return res.status(200).json(kpis);
    }

    // Orders (read-only)
    if (resource === 'orders' && req.method === 'GET') {
      const { rows } =
        await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`;
      return res.status(200).json(rows);
    }

    // Customers (read-only)
    if (resource === 'customers' && req.method === 'GET') {
      const { rows } =
        await sql`SELECT * FROM customers ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json(rows);
    }

    // Leads (read-only)
    if (resource === 'leads' && req.method === 'GET') {
      const { rows } =
        await sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 500`;
      return res.status(200).json(rows);
    }

    // Services CRUD
    if (resource === 'services') {
      if (req.method === 'GET') {
        const { rows } = await sql`SELECT * FROM services ORDER BY name ASC`;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        const b = req.body || {};
        if (!b.id || !b.name)
          return res.status(400).json({ error: 'id and name required' });
        await sql`
          INSERT INTO services (id, name, blurb, base_one_time_cents, base_monthly_cents, includes)
          VALUES (${b.id}, ${b.name}, ${b.blurb || null},
                  ${b.base_one_time_cents || 0}, ${b.base_monthly_cents || 0},
                  ${JSON.stringify(b.includes || [])}::jsonb)
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
        await sql`DELETE FROM services WHERE id=${id}`;
        return res.status(200).json({ ok: true });
      }
    }

    // Add-ons CRUD
    if (resource === 'addons') {
      if (req.method === 'GET') {
        const svc = req.query.service || null;
        const q = svc
          ? sql`SELECT * FROM addons WHERE service_id=${svc} ORDER BY label ASC`
          : sql`SELECT * FROM addons ORDER BY label ASC`;
        const { rows } = await q;
        return res.status(200).json(rows);
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        const b = req.body || {};
        if (!b.id || !b.service_id || !b.label)
          return res.status(400).json({ error: 'id, service_id, label required' });

        // ensure service exists
        const s =
          await sql`SELECT 1 FROM services WHERE id=${b.service_id} LIMIT 1`;
        if (!s.rowCount) return res.status(400).json({ error: 'service_id not found' });

        await sql`
          INSERT INTO addons (id, service_id, label, description, short, badge, popular, price_one_time_cents, price_monthly_cents)
          VALUES (${b.id}, ${b.service_id}, ${b.label}, ${b.description || null},
                  ${b.short || null}, ${b.badge || null}, ${!!b.popular},
                  ${b.price_one_time_cents || 0}, ${b.price_monthly_cents || 0})
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
        await sql`DELETE FROM addons WHERE id=${id}`;
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
