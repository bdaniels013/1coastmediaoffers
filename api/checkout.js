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
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Extract incoming payload. We support both the new shape (plan, cart, contact)
    // and a legacy shape that might use `customer` instead of `contact`.
    const body = req.body || {};
    const plan   = body.plan;
    const cart   = Array.isArray(body.cart) ? body.cart : [];
    const contact = body.contact || body.customer || {};

    // Validate input
    if (!plan || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Invalid cart or plan' });
    }

    // Determine checkout mode based on plan. Treat any non-'monthly' plan as one-time.
    const mode = plan === 'monthly' ? 'subscription' : 'payment';

    const line_items = [];

    // Build line items. Accept both complex service structures (with base and addons)
    // and simplified items (with price and type).
    for (const item of cart) {
      // Old shape: service with base price and optional add-ons
      if (Object.prototype.hasOwnProperty.call(item, 'base') || Array.isArray(item.addons)) {
        const svcKey = item?.service || 'service';
        const baseAmount = toCents(item?.base);
        if (baseAmount > 0) {
          line_items.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Base: ${item.name || svcKey}`,
              },
              ...(mode === 'subscription'
                ? { recurring: { interval: 'month' }, unit_amount: baseAmount }
                : { unit_amount: baseAmount }),
            },
            quantity: 1,
          });
        }
        for (const add of item.addons || []) {
          const addAmount = toCents(add?.price);
          if (addAmount <= 0) continue;
          line_items.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Add-on: ${add?.name || 'Line item'}`,
                ...(add?.desc ? { description: String(add.desc).slice(0, 500) } : {}),
              },
              ...(mode === 'subscription'
                ? { recurring: { interval: 'month' }, unit_amount: addAmount }
                : { unit_amount: addAmount }),
            },
            quantity: 1,
          });
        }
        continue;
      }

      // New shape: simple item with `price` and optional `type`
      const amt = toCents(item?.price);
      if (amt <= 0) continue;
      // Compose a reasonable product name. Prefix by type if available.
      let namePrefix = '';
      if (item?.type === 'addon') namePrefix = 'Add-on: ';
      else if (item?.type === 'bundle') namePrefix = 'Bundle: ';
      else namePrefix = 'Service: ';
      const productName = `${namePrefix}${item?.name || 'Line item'}`;
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          ...(mode === 'subscription'
            ? { recurring: { interval: 'month' }, unit_amount: amt }
            : { unit_amount: amt }),
        },
        quantity: 1,
      });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Compute origin for redirect URLs. Prefer the `Origin` header, else derive from host.
    const origin =
      req.headers.origin ||
      (req.headers.host ? `https://${req.headers.host}` : 'https://1coastmedia.com');

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items,
      success_url: `${origin}/?success=1`,
      cancel_url: `${origin}/?canceled=1`,
      metadata: {
        plan,
        email: contact?.email || '',
        name: contact?.name || '',
        company: contact?.company || '',
        phone: contact?.phone || '',
        notes: contact?.notes || '',
      },
      allow_promotion_codes: false,
      automatic_tax: { enabled: false },
    });

    // Return a more descriptive payload for the client. Include both the new
    // `url` property and the old `checkoutUrl`/`success` flag for backwards
    // compatibility.
    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      url: session.url,
      id: session.id,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    const message =
      err?.raw?.message || err?.message || 'Failed to create checkout session';
    return res.status(500).json({ error: message });
  }
}
