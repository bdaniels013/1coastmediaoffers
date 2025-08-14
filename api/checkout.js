 // /api/checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { plan, cart, contact } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart empty' });
    }
    if (plan !== 'oneTime' && plan !== 'monthly') {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const isSubscription = plan === 'monthly';

    // Build line items
    const line_items = [];
    for (const item of cart) {
      // Validate required fields
      if (!item?.service || typeof item?.base !== 'number') {
        return res.status(400).json({ error: 'Invalid cart format' });
      }

      // Base line
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${String(item.service).toUpperCase()} — Base (${isSubscription ? 'Monthly' : 'One-time'})`,
            description: (item.notes || '').slice(0, 400),
            metadata: { service: item.service, type: 'base', plan }
          },
          unit_amount: Math.round(item.base * 100),
          ...(isSubscription ? { recurring: { interval: 'month' } } : {})
        }
      });

      // Add-ons
      const addons = Array.isArray(item.addons) ? item.addons : [];
      for (const a of addons) {
        if (!a?.id || !a?.name || typeof a?.price !== 'number') continue;
        line_items.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${String(item.service).toUpperCase()} — ${a.name}`,
              metadata: { service: item.service, type: 'addon', plan, addon_id: a.id }
            },
            unit_amount: Math.round(a.price * 100),
            ...(isSubscription ? { recurring: { interval: 'month' } } : {})
          }
        });
      }
    }

    // Success/Cancel URLs based on host (fallbacks safe for local dev)
    const origin = (req.headers.origin || `https://${req.headers.host || 'localhost:3000'}`).replace(/\/$/, '');
    const success_url = `${origin}/?status=success`;
    const cancel_url  = `${origin}/?status=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items,
      success_url,
      cancel_url,
      customer_email: contact?.email || undefined,
      metadata: {
        plan,
        customer_name: contact?.name || '',
        customer_company: contact?.company || '',
        customer_phone: contact?.phone || '',
        notes: contact?.notes || ''
      },
      // Optional niceties:
      allow_promotion_codes: true,
      // automatic_tax: { enabled: true }, // enable if you’ve configured tax
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
};
