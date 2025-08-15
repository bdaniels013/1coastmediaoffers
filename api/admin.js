// /api/admin.js — 1CoastMedia Admin API (CommonJS, Vercel Serverless)
//
// Endpoints
// ---------
// PUBLIC
//   POST /api/admin?r=login           -> { ok: true } + httpOnly cookie
//   GET  /api/admin?r=me              -> { user }
//   POST /api/admin?r=logout          -> { ok: true }
//   GET  /api/admin?r=catalog         -> { services: [ ...frontendShape ] } (reads site_catalog first)
//
// AUTHENTICATED (requires cookie)
//   GET  /api/admin?r=metrics         -> KPIs
//   GET  /api/admin?r=orders          -> recent orders
//   GET  /api/admin?r=customers       -> recent customers
//   GET  /api/admin?r=leads           -> recent leads
//   GET  /api/admin?r=services        -> services rows (raw)
//   POST /api/admin?r=services        -> upsert service (JSON body)
//   DELETE /api/admin?r=services&id=  -> delete service
//   GET  /api/admin?r=addons[&service=] -> addons rows (raw)
//   POST /api/admin?r=addons          -> upsert addon (JSON body)
//   DELETE /api/admin?r=addons&id=    -> delete addon
//   POST /api/admin?r=save-catalog    -> persist full catalog JSON (order/editing)
//
// Tables referenced (Neon/Postgres):
//   services(id text primary key, name text, blurb text,
//            base_one_time_cents int, base_monthly_cents int, includes jsonb, updated_at timestamptz)
//   addons(id text primary key, service_id text references services(id),
//          label text, description text, short text, badge text, popular boolean,
//          price_one_time_cents int, price_monthly_cents int, updated_at timestamptz)
//   orders(...), customers(...), leads(...)
//   site_catalog(id int primary key default 1, services jsonb, updated_at timestamptz)

const { sql } = require('@vercel/postgres');
const jwt = require('jsonwebtoken');
const { parse } = require('cookie');

// --- Force SSL if only NO_SSL is provided ---
if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_NO_SSL) {
  process.env.POSTGRES_URL =
    process.env.POSTGRES_URL_NO_SSL +
    (process.env.POSTGRES_URL_NO_SSL.includes('?') ? '&' : '?') +
    'sslmode=require';
}

// --- simple helpers ---
const COOKIE = 'admin_auth';
const ONE_DAY = 60 * 60 * 24;

function json(res, code, body) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).end(JSON.stringify(body));
}

function setCookie(res, name, value, maxAge = ONE_DAY * 7) {
  const secure = process.env.VERCEL_ENV === 'production' ? ' Secure;' : '';
  const cookie = `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure}`;
  res.setHeader('Set-Cookie', cookie);
}
function clearCookie(res, name) {
  const secure = process.env.VERCEL_ENV === 'production' ? ' Secure;' : '';
  const cookie = `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${secure}`;
  res.setHeader('Set-Cookie', cookie);
}
function getToken(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[COOKIE];
}
function unauthorized(res) {
  json(res, 401, { error: 'Unauthorized' });
  return null;
}
function requireEnvOr500(res) {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS || !process.env.ADMIN_JWT_SECRET) {
    json(res, 500, {
      error:
        'Admin credentials missing. Set ADMIN_USER, ADMIN_PASS, ADMIN_JWT_SECRET in Vercel and redeploy.',
    });
    return false;
  }
  return true;
}
function validateAuth(req, res) {
  try {
    const token = getToken(req);
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return payload?.username || 'admin';
  } catch {
    return unauthorized(res);
  }
}
async function safeQuery(q) {
  try {
    return await q;
  } catch (e) {
    console.error('SQL error:', e);
    return { rows: [], rowCount: 0 };
  }
}

// --- Domain helpers ---
function dollarsFromCents(cents) {
  return Math.round((Number(cents) || 0) / 100);
}
function coerceIncludes(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const v = JSON.parse(value);
      return Array.isArray(v) ? v : [];
    } catch {
      // CSV fallback
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// --- route handlers ---
async function handleLogin(req, res) {
  if (!requireEnvOr500(res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username, ts: Date.now() }, process.env.ADMIN_JWT_SECRET, {
      expiresIn: '7d',
    });
    setCookie(res, COOKIE, token);
    return json(res, 200, { ok: true });
  }
  return json(res, 401, { error: 'Invalid credentials' });
}

async function handleLogout(req, res) {
  clearCookie(res, COOKIE);
  return json(res, 200, { ok: true });
}

async function handleMe(req, res) {
  if (!requireEnvOr500(res)) return;
  try {
    const token = getToken(req);
    const { username } = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return json(res, 200, { user: username || 'admin' });
  } catch {
    return json(res, 401, { error: 'Unauthorized' });
  }
}

async function handleMetrics(req, res) {
  const rev = await safeQuery(
    sql`SELECT COALESCE(SUM(total_cents),0) AS c FROM orders WHERE status='paid'`
  );
  const orders = await safeQuery(sql`SELECT COUNT(*)::int AS n FROM orders WHERE status='paid'`);
  const customers = await safeQuery(sql`SELECT COUNT(*)::int AS n FROM customers`);
  const pageviews = await safeQuery(sql`SELECT COUNT(*)::int AS n FROM events WHERE type='pageview'`);
  return json(res, 200, {
    revenue_cents: Number(rev.rows?.[0]?.c || 0),
    orders: Number(orders.rows?.[0]?.n || 0),
    customers: Number(customers.rows?.[0]?.n || 0),
    pageviews: Number(pageviews.rows?.[0]?.n || 0),
  });
}

async function handleOrders(req, res) {
  const { rows } = await safeQuery(
    sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`
  );
  return json(res, 200, rows);
}
async function handleCustomers(req, res) {
  const { rows } = await safeQuery(
    sql`SELECT * FROM customers ORDER BY created_at DESC LIMIT 500`
  );
  return json(res, 200, rows);
}
async function handleLeads(req, res) {
  const { rows } = await safeQuery(sql`SELECT * FROM leads ORDER BY created_at DESC LIMIT 500`);
  return json(res, 200, rows);
}

// --- Services CRUD (raw rows for admin) ---
async function handleServices(req, res) {
  if (req.method === 'GET') {
    const { rows } = await safeQuery(sql`SELECT * FROM services ORDER BY name ASC`);
    return json(res, 200, rows);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const b = req.body || {};
    if (!b.id || !b.name) return json(res, 400, { error: 'id and name required' });

    const includes = Array.isArray(b.includes) ? b.includes : coerceIncludes(b.includes || []);
    await safeQuery(sql`
      INSERT INTO services (id, name, blurb, base_one_time_cents, base_monthly_cents, includes)
      VALUES (
        ${b.id},
        ${b.name},
        ${b.blurb || null},
        ${Number(b.base_one_time_cents) || 0},
        ${Number(b.base_monthly_cents) || 0},
        ${JSON.stringify(includes)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        name                 = EXCLUDED.name,
        blurb                = EXCLUDED.blurb,
        base_one_time_cents  = EXCLUDED.base_one_time_cents,
        base_monthly_cents   = EXCLUDED.base_monthly_cents,
        includes             = EXCLUDED.includes,
        updated_at           = NOW()
    `);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) return json(res, 400, { error: 'id required' });
    await safeQuery(sql`DELETE FROM services WHERE id = ${id}`);
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { error: 'Method not allowed' });
}

// --- Add-ons CRUD (raw rows for admin) ---
async function handleAddons(req, res) {
  if (req.method === 'GET') {
    const svc = req.query?.service || null;
    const q = svc
      ? sql`SELECT * FROM addons WHERE service_id=${svc} ORDER BY label ASC`
      : sql`SELECT * FROM addons ORDER BY label ASC`;
    const { rows } = await safeQuery(q);
    return json(res, 200, rows);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const b = req.body || {};
    if (!b.id || !b.service_id || !b.label)
      return json(res, 400, { error: 'id, service_id, label required' });

    const exists = await safeQuery(sql`SELECT 1 FROM services WHERE id=${b.service_id} LIMIT 1`);
    if (!exists.rowCount) return json(res, 400, { error: 'service_id not found' });

    await safeQuery(sql`
      INSERT INTO addons
        (id, service_id, label, description, short, badge, popular,
         price_one_time_cents, price_monthly_cents)
      VALUES
        (
          ${b.id}, ${b.service_id}, ${b.label},
          ${b.description || null}, ${b.short || null}, ${b.badge || null},
          ${!!b.popular},
          ${Number(b.price_one_time_cents) || 0},
          ${Number(b.price_monthly_cents) || 0}
        )
      ON CONFLICT (id) DO UPDATE SET
        service_id           = EXCLUDED.service_id,
        label                = EXCLUDED.label,
        description          = EXCLUDED.description,
        short                = EXCLUDED.short,
        badge                = EXCLUDED.badge,
        popular              = EXCLUDED.popular,
        price_one_time_cents = EXCLUDED.price_one_time_cents,
        price_monthly_cents  = EXCLUDED.price_monthly_cents,
        updated_at           = NOW()
    `);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!id) return json(res, 400, { error: 'id required' });
    await safeQuery(sql`DELETE FROM addons WHERE id=${id}`);
    return json(res, 200, { ok: true });
  }
  return json(res, 405, { error: 'Method not allowed' });
}

// --- Catalog (public shape) ---
// GET: Prefer site_catalog snapshot (admin-ordered). Fallback to composing from tables.
// POST (save-catalog): Persist whole array for front-end to consume.
async function handleCatalogGET(req, res) {
  // Try site_catalog snapshot first
  const snap = await safeQuery(sql`SELECT services FROM site_catalog WHERE id = 1`);
  if (snap.rowCount) {
    const arr = snap.rows[0]?.services;
    if (Array.isArray(arr) && arr.length) {
      return json(res, 200, { services: arr });
    }
  }

  // Fallback: compose from services/addons rows
  const servicesRes = await safeQuery(sql`
    SELECT id, name, blurb, base_one_time_cents, base_monthly_cents, includes
    FROM services
    ORDER BY name ASC
  `);
  const addonsRes = await safeQuery(sql`
    SELECT id, service_id, label, description, short, badge, popular,
           price_one_time_cents, price_monthly_cents
    FROM addons
    ORDER BY label ASC
  `);

  const addonsByService = {};
  for (const a of addonsRes.rows || []) {
    const sid = String(a.service_id);
    if (!addonsByService[sid]) addonsByService[sid] = [];
    addonsByService[sid].push({
      id: String(a.id),
      label: a.label || '',
      desc: a.description || '',
      short: a.short || '',
      badge: a.badge || '',
      popular: !!a.popular,
      price: {
        oneTime: dollarsFromCents(a.price_one_time_cents),
        monthly: dollarsFromCents(a.price_monthly_cents),
      },
    });
  }

  const services = (servicesRes.rows || []).map((s) => {
    const key = String(s.id);
    return {
      key,
      name: s.name || 'Untitled',
      blurb: s.blurb || '',
      base: {
        oneTime: dollarsFromCents(s.base_one_time_cents),
        monthly: dollarsFromCents(s.base_monthly_cents),
      },
      includes: coerceIncludes(s.includes),
      addOns: addonsByService[key] || [],
    };
  });

  return json(res, 200, { services });
}

async function handleCatalogSave(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { services } = req.body || {};
  if (!Array.isArray(services)) {
    return json(res, 400, { error: 'services must be an array' });
  }
  await safeQuery(sql`
    INSERT INTO site_catalog (id, services)
    VALUES (1, ${JSON.stringify(services)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      services = EXCLUDED.services,
      updated_at = NOW()
  `);
  return json(res, 200, { ok: true });
}

// --- main handler ---
module.exports = async (req, res) => {
  try {
    const r = req.query?.r;

    // PUBLIC
    if (r === 'login')     return handleLogin(req, res);
    if (r === 'logout')    return handleLogout(req, res);
    if (r === 'me')        return handleMe(req, res);
    if (r === 'catalog' && req.method === 'GET') return handleCatalogGET(req, res);

    // AUTH REQUIRED
    const user = validateAuth(req, res);
    if (!user) return;

    if (r === 'metrics')   return handleMetrics(req, res);
    if (r === 'orders')    return handleOrders(req, res);
    if (r === 'customers') return handleCustomers(req, res);
    if (r === 'leads')     return handleLeads(req, res);

    if (r === 'services')  return handleServices(req, res);
    if (r === 'addons')    return handleAddons(req, res);

    if (r === 'save-catalog') return handleCatalogSave(req, res);

    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    console.error('admin.js error:', e);
    return json(res, 500, { error: e.message || 'Server error' });
  }
};
