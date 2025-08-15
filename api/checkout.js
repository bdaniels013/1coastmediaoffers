// api/stripe/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

function toCents(n) {
  const v = Number(n || 0);
  return Math.round(v * 100);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { plan, cart, contact } = req.body || {};

    // Basic validation
    if (!plan || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Invalid cart or plan' });
    }

    // Derive mode from plan
    const mode = plan === 'monthly' ? 'subscription' : 'payment';

    // Build line items. We only include non-empty fields (Stripe dislikes empty strings).
    const line_items = [];

    for (const svc of cart) {
      const svcKey = svc?.service || 'service';
      const baseAmount = toCents(svc?.base);

      if (baseAmount > 0) {
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              // Prefer a human name if frontend sends it; else fall back to key
              name: `Base: ${svc.name || svcKey}`,
            },
            // If monthly, create a recurring price on the fly
            ...(mode === 'subscription'
              ? { recurring: { interval: 'month' }, unit_amount: baseAmount }
              : { unit_amount: baseAmount }),
          },
          quantity: 1,
        });
      }

      for (const add of svc?.addons || []) {
        const addAmount = toCents(add?.price);
        if (addAmount <= 0) continue;

        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Add-on: ${add?.name || 'Line item'}`,
              // DO NOT send empty description strings
              ...(add?.desc ? { description: String(add.desc).slice(0, 500) } : {}),
            },
            ...(mode === 'subscription'
              ? { recurring: { interval: 'month' }, unit_amount: addAmount }
              : { unit_amount: addAmount }),
          },
          quantity: 1,
        });
      }
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Figure out your site origin for return URLs
    const origin =
      req.headers.origin ||
      (req.headers.host ? `https://${req.headers.host}` : 'https://1coastmedia.com');

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items,
      success_url: `${origin}/?success=1`,
      cancel_url: `${origin}/?canceled=1`,
      // A little metadata to recognize the order later
      metadata: {
        plan,
        email: contact?.email || '',
        name: contact?.name || '',
        company: contact?.company || '',
        phone: contact?.phone || '',
        notes: contact?.notes || '',
      },
      // Optional niceties:
      allow_promotion_codes: false,
      automatic_tax: { enabled: false },
    });

    // Prefer URL redirect (cleanest)
    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    const message =
      err?.raw?.message || err?.message || 'Failed to create checkout session';
    return res.status(500).json({ error: message });
  }
}
