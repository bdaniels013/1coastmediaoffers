 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
    const { plan, cart, contact } = req.body || {};
    if(!Array.isArray(cart) || cart.length===0) return res.status(400).json({error:'Cart empty'});

    // Build line items
    const line_items = [];
    cart.forEach(item=>{
      // Base
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.service.toUpperCase()} — Base (${plan==='oneTime'?'One-time':'Monthly'})`,
            description: item.notes?.slice(0, 400) || '',
            metadata: { service:item.service, type:'base', plan }
          },
          unit_amount: Math.round(item.base * 100)
        }
      });
      // Add-ons
      item.addons.forEach(a=>{
        line_items.push({
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.service.toUpperCase()} — ${a.name}`,
              metadata: { service:item.service, type:'addon', plan, addon_id:a.id }
            },
            unit_amount: Math.round(a.price * 100)
          }
        });
      });
    });

    const session = await stripe.checkout.sessions.create({
      mode: plan==='oneTime' ? 'payment' : 'subscription',
      line_items,
      success_url: 'https://yourdomain.com/?status=success',
      cancel_url: 'https://yourdomain.com/?status=cancelled',
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
  };
