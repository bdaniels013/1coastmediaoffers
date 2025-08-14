import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { plan, cart, contact } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) return res.status(400).json({ error: 'Cart empty' });

    // Provisional order (we finalize on webhook)
    const totalCents = cart.reduce((sum, item) => {
      const base = Math.round((item.base || 0) * 100);
      const addons = (item.addons || []).reduce((a, x) => a + Math.round((x.price || 0) * 100), 0);
      return sum + base + addons;
    }, 0);

    const { rows: customerRows } = await sql`
      INSERT INTO customers (name, email, phone, company, notes)
      VALUES (${contact?.name || null}, ${contact?.email || null}, ${contact?.phone || null}, ${contact?.company || null}, ${contact?.notes || null})
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, customers.name),
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        company = COALESCE(EXCLUDED.company, customers.company),
        notes = COALESCE(EXCLUDED.notes, customers.notes)
      RETURNING *;
    `;
    const customer = customerRows[0];

    const { rows: orderRows } = await sql`
      INSERT INTO orders (plan, status, currency, total_cents, customer_id, contact_name, contact_email, contact_phone, contact_company, notes)
      VALUES (${plan}, 'created', 'usd', ${totalCents}, ${customer.id}, ${contact?.name || null}, ${contact?.email || null}, ${contact?.phone || null}, ${contact?.company || null}, ${contact?.notes || null})
      RETURNING *;
    `;
    const order = orderRows[0];

    // Record event
    await sql`INSERT INTO events (type, data) VALUES ('checkout_start', ${JSON.stringify({ order_id: order.id, plan })}::jsonb);`;

    // Build Stripe line items
    const line_items = [];
    cart.forEach(item => {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.service.toUpperCase()} — Base (${plan === 'oneTime' ? 'One-time' : 'Monthly'})`,
            description: item.notes?.slice(0, 400) || undefined,
            metadata: { service: item.service, type: 'base', plan }
          },
          unit_amount: Math.round(item.base * 100),
          ...(plan === 'monthly' ? { recurring: { interval: 'month' } } : {})
        }
      });
      (item.addons || []).forEach(a => {
        line_items.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.service.toUpperCase()} — ${a.name}`,
              metadata: { service: item.service, type: 'addon', plan, addon_id: a.id }
            },
            unit_amount: Math.round(a.price * 100),
            ...(plan === 'monthly' ? { recurring: { interval: 'month' } } : {})
          }
        });
      });
    });

    const session = await stripe.checkout.sessions.create({
      mode: plan === 'oneTime' ? 'payment' : 'subscription',
      line_items,
      success_url: 'https://1coastmedia.com/?status=success',
      cancel_url: 'https://1coastmedia.com/?status=cancelled',
      customer_email: contact?.email || undefined,
      metadata: { plan, order_id: order.id }
    });

    await sql`UPDATE orders SET stripe_session_id = ${session.id} WHERE id = ${order.id};`;
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
