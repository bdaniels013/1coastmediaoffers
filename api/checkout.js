 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const PRICE_TABLE = {
    web: { oneTimeBase: 30000, monthlyBase: 50000, addons: { 'web-mvp':{ot:50000,mo:50000}, 'web-seo':{ot:15000,mo:15000}, 'web-auto':{ot:10000,mo:10000}, 'web-api':{ot:25000,mo:25000}, 'web-shop':{ot:30000,mo:30000}, 'web-adv':{ot:null,mo:20000}, 'web-dash':{ot:null,mo:25000} } },
    video:{ oneTimeBase: 60000, monthlyBase:120000, addons: { 'vid-audio':{ot:20000,mo:25000}, 'vid-adv':{ot:80000,mo:100000}, 'vid-drone-p':{ot:30000,mo:30000}, 'vid-drone-pro':{ot:150000,mo:150000}, 'vid-edit':{ot:30000,mo:50000} } },
    events:{ oneTimeBase:100000, monthlyBase:120000, addons: { 'ev-ven':{ot:50000,mo:60000}, 'ev-digital':{ot:20000,mo:20000}, 'ev-media':{ot:30000,mo:30000}, 'ev-auto':{ot:15000,mo:15000}, 'ev-hybrid':{ot:40000,mo:40000} } },
    ugc:  { oneTimeBase: 45000, monthlyBase: 60000, addons: { 'ugc-repurpose':{ot:20000,mo:20000}, 'ugc-leads':{ot:25000,mo:25000}, 'ugc-enhance':{ot:15000,mo:15000}, 'ugc-captions':{ot:10000,mo:10000}, 'ugc-brand':{ot:15000,mo:15000}, 'ugc-views-10k':{ot:15000,mo:15000}, 'ugc-views-20k':{ot:30000,mo:30000}, 'ugc-views-70k':{ot:105000,mo:105000} } }
  };

  module.exports = async (req, res) => {
    try{
      if(req.method !== 'POST') return res.status(405).send('Method Not Allowed');
      const { cart, customer } = req.body || {};
      if(!Array.isArray(cart) || !cart.length) return res.status(400).send('Cart required');

      const line_items = [];
      for(const item of cart){
        const { serviceKey, plan, addons, notes } = item;
        if(!['web','video','events','ugc'].includes(serviceKey)) continue;
        if(!['oneTime','monthly'].includes(plan)) continue;
        const t = PRICE_TABLE[serviceKey];
        const isMonthly = plan==='monthly';
        // Base
        line_items.push({ price_data: { currency: 'usd', product_data: { name: `${serviceKey.toUpperCase()} — ${isMonthly?'Monthly':'One‑time'} Base`, description: notes?`Notes: ${notes}`:undefined, metadata:{service:serviceKey,type:'base',plan,notes:notes||''} }, unit_amount: isMonthly? t.monthlyBase : t.oneTimeBase, ...(isMonthly? {recurring:{interval:'month'}} : {}) }, quantity: 1 });
        // Add-ons
        for(const id of Array.isArray(addons)?addons:[]){
          const a=t.addons[id]; if(!a) continue; const amt=isMonthly? a.mo : a.ot; if(!amt) continue;
          line_items.push({ price_data: { currency: 'usd', product_data: { name: `Add‑on: ${id}`, description: notes?`Service notes: ${notes}`:undefined, metadata:{service:serviceKey,type:'addon',id,plan,notes:notes||''} }, unit_amount: amt, ...(isMonthly? {recurring:{interval:'month'}} : {}) }, quantity: 1 });
        }
      }

      if(!line_items.length) return res.status(400).send('No billable items');

      const session = await stripe.checkout.sessions.create({
        mode: cart.some(c=>c.plan==='monthly') ? 'subscription' : 'payment',
        line_items,
        success_url: `${req.headers.origin || 'https://yourdomain.com'}/#contact`,
        cancel_url: `${req.headers.origin || 'https://yourdomain.com'}/#pricing`,
        allow_promotion_codes: true,
        metadata: { cart: JSON.stringify(cart), ...(customer||{}) },
        customer_email: customer?.email || undefined
      });

      res.status(200).json({ id: session.id });
    }catch(err){
      console.error(err);
      res.status(500).send(err.message || 'Server error');
    }
  }
