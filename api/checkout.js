// /api/checkout.js  (Vercel Serverless Function - CommonJS)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan, cart, contact } = req.body || {};

    // Basic validation
    if (!['oneTime', 'monthly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart empty' });
    }

    const isSubscription = plan === 'monthly';
    const recurring = isSubscription ? { recurring: { interval: 'month' } } : {};

    const line_items = [];

    for (const item of cart) {
      const service = String(item.service || '').toLowerCase();
      const base = Number(item.base || 0);

      // Base (skip zero)
      if (base > 0) {
        const product_data = {
          name: `${service.toUpperCase()} — Base (${isSubscription ? 'Monthly' : 'One-time'})`,
          metadata: { service, type: 'base', plan }
        };
        // only include description if non-empty (prevents Stripe 500 you saw)
        const notes = (item.notes || '').toString().trim();
        if (notes) product_data.description = notes.slice(0, 400);

        line_items.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(base * 100),
            product_data,
            ...recurring
          }
        });
      }

      // Add-ons
      const addons = Array.isArray(item.addons) ? item.addons : [];
      for (const a of addons) {
        const price = Number(a.price || 0);
        // Stripe doesn't allow $0 recurring items; skip $0 always
        if (price <= 0) continue;

        const product_data = {
          name: `${service.toUpperCase()} — ${a.name}`,
          metadata: { service, type: 'addon', plan, addon_id: a.id }
        };

        line_items.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(price * 100),
            product_data,
            ...recurring
          }
        });
      }
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'No billable items' });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items,
      success_url: `${origin}/?status=success`,
      cancel_url: `${origin}/?status=cancelled`,
      customer_email: contact?.email || undefined,
      metadata: {
        plan,
        customer_name: contact?.name || '',
        customer_company: contact?.company || '',
        customer_phone: contact?.phone || '',
        notes: contact?.notes || ''
      }
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
