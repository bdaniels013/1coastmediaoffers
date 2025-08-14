import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || null;

      // Expand line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      // Compute totals & capture
      const total = session.amount_total || 0;
      const pi = session.payment_intent;
      const status = 'paid';

      await sql`
        UPDATE orders
        SET status = ${status},
            stripe_payment_intent = ${pi},
            total_cents = ${total},
            contact_email = COALESCE(${session.customer_details?.email || null}, contact_email)
        WHERE id = ${orderId}
      `;

      // Remove any old items & insert fresh
      await sql`DELETE FROM order_items WHERE order_id = ${orderId}`;
      for (const li of lineItems.data) {
        const md = li.price?.product_data?.metadata || {};
        await sql`
          INSERT INTO order_items (order_id, item_type, service_key, addon_id, name, amount_cents, recurring_interval, quantity)
          VALUES (
            ${orderId},
            ${md.type === 'addon' ? 'addon' : 'base'},
            ${md.service || 'unknown'},
            ${md.addon_id || null},
            ${li.description || li.price?.product?.name || 'Item'},
            ${li.amount_total || li.amount_subtotal || 0},
            ${li.price?.recurring?.interval || null},
            ${li.quantity || 1}
          )
        `;
      }

      await sql`INSERT INTO events (type, data) VALUES ('checkout_paid', ${JSON.stringify({ order_id: orderId })}::jsonb);`;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('Server error');
  }
}
