// /api/checkout.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan, cart, contact } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart empty' });
    }

    const recurring = plan === 'monthly' ? { recurring: { interval: 'month' } } : {};

    const line_items = cart.flatMap((item) => {
      const base = {
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.service?.toUpperCase() || 'SERVICE'} — Base (${plan === 'oneTime' ? 'One-time' : 'Monthly'})`,
            description: (item.notes || '').slice(0, 400),
            metadata: { service: item.service || '', type: 'base', plan }
          },
          unit_amount: Math.round(Number(item.base || 0) * 100),
          ...recurring
        }
      };

      const addons = (item.addons || []).map((a) => ({
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.service?.toUpperCase() || 'SERVICE'} — ${a.name}`,
            metadata: { service: item.service || '', type: 'addon', plan, addon_id: a.id }
          },
          unit_amount: Math.round(Number(a.price || 0) * 100),
          ...recurring
        }
      }));

      return [base, ...addons];
    });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: plan === 'oneTime' ? 'payment' : 'subscription',
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

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    // Common tell: using pk_ key will throw "Invalid API Key provided"
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
