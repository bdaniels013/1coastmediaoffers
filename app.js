// app.js (root)
// Public catalog (no auth)
const CATALOG_URL = '/api/admin?r=catalog';

export function landingApp(){
  return {
    // --- STATE ---
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',
    // Fallback catalog so the site never renders blank
    services: [
      { key:'web', name:'Web & App', blurb:'Launch a clean, mobile-first site fast.', base:{oneTime:300, monthly:500}, includes:['Kickoff & setup','Landing page (3–5 sections)','Light copy help'], addOns:[
        { id:'web-seo', label:'SEO Basics', desc:'Titles, speed checks, findable.', short:'Quick search wins', price:{oneTime:150, monthly:150}, badge:'Quick win', popular:true },
        { id:'web-auto', label:'Lead Automations', desc:'Instant replies to leads.', short:'Never miss a lead', price:{oneTime:100, monthly:100}, badge:'Hands-off', popular:true },
        { id:'web-api', label:'Payments & Maps', desc:'Stripe checkout + maps.', short:'High-impact add', price:{oneTime:250, monthly:250}, badge:'High impact' },
        { id:'web-mvp', label:'Clickable MVP', desc:'Tap-through prototype.', short:'Test ideas', price:{oneTime:500, monthly:500}, badge:'Prototype' },
        { id:'web-copy', label:'Website Copywriting', desc:'We write clear, on-brand copy.', short:'Words that sell', price:{oneTime:120, monthly:120}, badge:'Done-for-you' },
        { id:'web-speed', label:'Speed & Security', desc:'Performance boosts + hardening.', short:'Faster & safer', price:{oneTime:150, monthly:150}, badge:'Speed' },
        { id:'web-forms', label:'Smart Forms', desc:'Lead routing + spam block.', short:'Higher conversions', price:{oneTime:150, monthly:100}, badge:'Leads' },
        { id:'web-analytics', label:'Analytics Setup', desc:'Simple dashboard + goals.', short:'Know what works', price:{oneTime:100, monthly:120}, badge:'Insight' },
        { id:'web-blog', label:'Blog/CMS Setup', desc:'Easy updates, categories, tags.', short:'Publish fast', price:{oneTime:200, monthly:150}, badge:'Content' },
        { id:'web-booking', label:'Booking Integration', desc:'Calendly/Square appointments.', short:'Fewer no-shows', price:{oneTime:150, monthly:120}, badge:'Conversion' },
        { id:'web-reviews', label:'Reviews Widget', desc:'Pull Google/FB reviews on site.', short:'Build trust', price:{oneTime:100, monthly:100}, badge:'Trust' },
        { id:'web-a11y', label:'Accessibility Audit', desc:'WCAG quick audit + fixes.', short:'Compliance wins', price:{oneTime:180, monthly:150}, badge:'Compliance' },
        { id:'web-i18n', label:'Multi-language', desc:'Key pages in 2nd language.', short:'Expand reach', price:{oneTime:220, monthly:150}, badge:'Reach' },
        { id:'web-dns', label:'Domain & DNS', desc:'Purchase, connect, SSL.', short:'We handle setup', price:{oneTime:80, monthly:0}, badge:'Setup' },
        { id:'web-section', label:'Custom Section', desc:'1 bespoke section block.', short:'Tailored UI', price:{oneTime:120, monthly:120}, badge:'Custom' },
        { id:'web-photos', label:'Photo Sourcing', desc:'Handpicked stock + edits.', short:'Better visuals', price:{oneTime:90, monthly:90}, badge:'Visuals' },
        { id:'web-brandkit', label:'Brand Kit', desc:'Fonts, colors, components.', short:'Consistent look', price:{oneTime:200, monthly:150}, badge:'Brand' },
      ]},
      { key:'video', name:'Video / Audio', blurb:'Short, on-brand edits that convert.', base:{oneTime:600, monthly:1200}, includes:['Kickoff & plan','1–2 min edit','Clean edit, coastal vibe'], addOns:[
        { id:'vid-audio', label:'Clean Audio + Captions', desc:'Noise fix + captions.', short:'Watchable anywhere', price:{oneTime:200, monthly:250}, badge:'Accessibility', popular:true },
        { id:'vid-adv', label:'Advanced Edit / Series', desc:'More story, motion, polish.', short:'Flagship content', price:{oneTime:800, monthly:1000}, badge:'Premium', popular:true },
        { id:'vid-drone-p', label:'Drone B-roll (Basic)', desc:'Dynamic aerial flavor.', short:'Wow factor', price:{oneTime:300, monthly:300}, badge:'Wow' },
        { id:'vid-drone-pro', label:'Drone Cinematics (Pro)', desc:'Licensed pilot + pro gear.', short:'Top-tier aerials', price:{oneTime:1500, monthly:1500}, badge:'Cinematic' },
        { id:'vid-extra', label:'Extra Edit Pass', desc:'More refinements + cuts.', short:'Sharper pacing', price:{oneTime:300, monthly:500}, badge:'Polish' },
        { id:'vid-script', label:'Script & Shotlist', desc:'Plan lines + shots.', short:'Shoot with ease', price:{oneTime:150, monthly:150}, badge:'Plan' },
        { id:'vid-color', label:'Pro Color Grade', desc:'Crisp, cinematic look.', short:'Standout look', price:{oneTime:150, monthly:150}, badge:'Look' },
        { id:'vid-sizes', label:'All Social Sizes', desc:'9:16, 1:1, 16:9 outputs.', short:'Every platform', price:{oneTime:120, monthly:120}, badge:'Everywhere' },
        { id:'vid-thumbs', label:'Thumbnail Pack (x3)', desc:'Scroll-stopping covers.', short:'Higher CTR', price:{oneTime:100, monthly:100}, badge:'Hook' },
        { id:'vid-raw', label:'Raw Footage Delivery', desc:'We hand you the files.', short:'Own the source', price:{oneTime:60, monthly:60}, badge:'Archive' },
        { id:'vid-voice', label:'Voiceover', desc:'Pro VO talent included.', short:'Narration', price:{oneTime:220, monthly:220}, badge:'Pro' },
        { id:'vid-tele', label:'Teleprompter', desc:'Confident on-camera lines.', short:'Confidence', price:{oneTime:90, monthly:90}, badge:'Assist' },
        { id:'vid-studio', label:'Studio Day', desc:'Lighting, backdrops, sound.', short:'Controlled set', price:{oneTime:700, monthly:700}, badge:'Studio' },
        { id:'vid-multi', label:'Multi-location Shoot', desc:'Up to 3 locations.', short:'More variety', price:{oneTime:400, monthly:400}, badge:'Scope' },
        { id:'vid-cast', label:'Talent Casting', desc:'Find on-brand talent.', short:'Right faces', price:{oneTime:300, monthly:300}, badge:'Talent' },
      ]},
      { key:'events', name:'Events', blurb:'Plan smooth, run tight, look great.', base:{oneTime:1000, monthly:1200}, includes:['Scope & timeline','Basic coordination','Day-of support'], addOns:[
        { id:'ev-ven', label:'Vendor/Venue Handling', desc:'We wrangle calls.', short:'Stress-free', price:{oneTime:500, monthly:600}, badge:'Stress-free', popular:true },
        { id:'ev-digital', label:'RSVP/Tickets Page', desc:'Modern guest flow.', short:'Smooth RSVPs', price:{oneTime:200, monthly:200}, badge:'Modern' },
        { id:'ev-media', label:'Highlight Media', desc:'Recap video + photos.', short:'Shareworthy', price:{oneTime:300, monthly:300}, badge:'Content' },
        { id:'ev-auto', label:'Guest Automations', desc:'Reminders + check-in.', short:'No bottlenecks', price:{oneTime:150, monthly:150}, badge:'Smooth' },
        { id:'ev-hybrid', label:'Livestream Setup', desc:'Hybrid reach, simple.', short:'Reach more', price:{oneTime:400, monthly:400}, badge:'Reach' },
        { id:'ev-host', label:'Host / MC', desc:'Energy + timing control.', short:'Keep pace', price:{oneTime:250, monthly:250}, badge:'Energy' },
        { id:'ev-runshow', label:'Run-of-Show', desc:'Minute-by-minute plan.', short:'Clarity', price:{oneTime:150, monthly:150}, badge:'Clarity' },
        { id:'ev-sponsor', label:'Sponsor Kit + Outreach', desc:'Deck + outreach.', short:'New revenue', price:{oneTime:200, monthly:200}, badge:'Revenue' },
        { id:'ev-security', label:'Permits & Security Guide', desc:'Who to call + when.', short:'Safer event', price:{oneTime:120, monthly:120}, badge:'Safety' },
        { id:'ev-vip', label:'VIP/Backstage Mgmt', desc:'Green room + access.', short:'White-glove', price:{oneTime:200, monthly:200}, badge:'VIP' },
        { id:'ev-photobooth', label:'Photo Booth', desc:'Branded photos on site.', short:'Fun moments', price:{oneTime:350, monthly:350}, badge:'Fun' },
        { id:'ev-ticketing', label:'Ticketing Integration', desc:'Stripe/Square, QR.', short:'Faster gates', price:{oneTime:220, monthly:220}, badge:'Revenue' },
      ]},
      { key:'ugc', name:'UGC', blurb:'Creators + clips that actually get seen.', base:{oneTime:450, monthly:600}, includes:['Kickoff & setup','30k verified views','Simple report'], addOns:[
        { id:'ugc-repurpose', label:'Ads-Ready Pack', desc:'Cut-downs + hooks.', short:'Convert more', price:{oneTime:200, monthly:200}, badge:'Ads-ready', popular:true },
        { id:'ugc-leads', label:'Lead Capture Page', desc:'Turn views to contacts.', short:'Capture demand', price:{oneTime:250, monthly:250}, badge:'Leads' },
        { id:'ugc-enhance', label:'Eye-Candy Overlays', desc:'On-brand text, beats.', short:'More watch time', price:{oneTime:150, monthly:150}, badge:'Engaging' },
        { id:'ugc-captions', label:'SEO Captions', desc:'Be found & tapped.', short:'Search hits', price:{oneTime:100, monthly:100}, badge:'Search' },
        { id:'ugc-brand', label:'Branding Pack', desc:'Logos, end-slates.', short:'Brand recall', price:{oneTime:150, monthly:150}, badge:'Brand' },
        { id:'ugc-views-10k', label:'+10k Views', desc:'~10,000 verified views.', short:'+10k reach', price:{oneTime:150, monthly:150}, badge:'+10k' },
        { id:'ugc-views-20k', label:'+20k Views', desc:'~20,000 verified views.', short:'+20k reach', price:{oneTime:300, monthly:300}, badge:'+20k' },
        { id:'ugc-views-70k', label:'+70k Views', desc:'~70,000 verified views.', short:'+70k reach', price:{oneTime:1050, monthly:1050}, badge:'+70k' },
        { id:'ugc-creator', label:'Creator Matching', desc:'Shortlist best locals.', short:'Best fit', price:{oneTime:100, monthly:100}, badge:'Match' },
        { id:'ugc-studio', label:'Studio Polish', desc:'Re-cut with pro touch.', short:'Pro finish', price:{oneTime:150, monthly:150}, badge:'Pro' },
        { id:'ugc-comment', label:'Comment Reply Pack', desc:'Smart replies to boost.', short:'Engage more', price:{oneTime:100, monthly:100}, badge:'Engage' },
        { id:'ugc-tracking', label:'Tracking Upgrade', desc:'Deeper insights.', short:'Better decisions', price:{oneTime:120, monthly:120}, badge:'Insight' },
        { id:'ugc-white', label:'Whitelisting Rights', desc:'Run creator posts as ads.', short:'Run as ads', price:{oneTime:220, monthly:220}, badge:'Rights' },
        { id:'ugc-usage', label:'Usage Rights Extension', desc:'Extend paid usage.', short:'More time', price:{oneTime:180, monthly:180}, badge:'Rights' },
        { id:'ugc-hooks', label:'A/B Hooks Pack', desc:'5 alt hooks to test.', short:'Test faster', price:{oneTime:140, monthly:140}, badge:'Test' },
      ]},
    ],
    addonIndex:{},
    openDescs:{},
    cartServices:[],
    cartAddons:[],
    builderOpen:false,
    addonsOpen:false,
    activeService:'web',
    stickyCta:false,
    toast:{show:false,text:''},
    isSubmitting:false,
    contact:{ name:'', email:'', company:'', phone:'', notes:'' },

    async init(){
      // Build index from fallback
      this.rebuildIndex();

      // Hydrate from DB catalog
      try{
        const r = await fetch(CATALOG_URL, { cache:'no-store' });
        if(r.ok){
          const j = await r.json();
          if(Array.isArray(j.services) && j.services.length){
            this.services = j.services;
            this.activeService = this.services[0]?.key || 'web';
            this.rebuildIndex();
          }
        } else {
          console.warn('Catalog fetch failed', r.status);
        }
      }catch(e){
        console.warn('Catalog fetch error', e);
      }

      // Restore cart
      try{
        const saved = JSON.parse(localStorage.getItem('coast_cart')||'{}');
        if(saved.services) this.cartServices = saved.services;
        if(saved.addons)   this.cartAddons  = saved.addons;
        if(saved.plan)     this.plan        = saved.plan;
        if(saved.contact)  this.contact     = { ...this.contact, ...saved.contact };
      }catch{}

      // Sticky CTA
      const onScroll = () => { this.stickyCta = window.scrollY > 640 };
      onScroll(); window.addEventListener('scroll', onScroll);
    },

    rebuildIndex(){
      this.addonIndex = this.services.reduce((acc, svc) => {
        (svc.addOns||[]).forEach(a => acc[a.id] = { ...a, service: svc.key });
        return acc;
      }, {});
    },

    // --- COMPUTEDS ---
    get total(){
      const baseSum = this.cartServices.reduce((s, key) => s + (this.services.find(x => x.key === key)?.base?.[this.plan] || 0), 0);
      const addonSum = this.cartAddons.reduce((s, id) => s + (this.addonIndex[id]?.price?.[this.plan] || 0), 0);
      return baseSum + addonSum;
    },
    get visibleAddons(){
      let items = (this.services.find(s => s.key === this.activeService)?.addOns || []).slice();
      const q = this.addonQuery.trim().toLowerCase();
      if(q) items = items.filter(a => a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || (a.short||'').toLowerCase().includes(q));
      if(this.sortBy==='price-asc') items.sort((a,b)=>a.price[this.plan]-b.price[this.plan]);
      else if(this.sortBy==='price-desc') items.sort((a,b)=>b.price[this.plan]-a.price[this.plan]);
      else if(this.sortBy==='alpha') items.sort((a,b)=>a.label.localeCompare(b.label));
      else items.sort((a,b)=> (b.popular?1:0) - (a.popular?1:0));
      return items;
    },

    // --- HELPERS ---
    serviceName(key){ return (this.services.find(s => s.key === key) || {}).name || key; },
    serviceBase(key){ return (this.services.find(s => s.key === key) || {}).base?.[this.plan] || 0; },
    fmtUSD(v){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v); },
    save(){ localStorage.setItem('coast_cart', JSON.stringify({ services:this.cartServices, addons:this.cartAddons, plan:this.plan, contact:this.contact })); },
    emailValid(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e||''); },

    // --- UI actions ---
    setPlan(p){ this.plan = p; this.save(); },
    toggleService(key){ const i=this.cartServices.indexOf(key); if(i>-1) this.cartServices.splice(i,1); else this.cartServices.push(key); this.save(); },
    toggleAddon(id){
      const svcKey = this.addonIndex[id]?.service;
      const i = this.cartAddons.indexOf(id);
      if(i>-1){ this.cartAddons.splice(i,1); }
      else{
        if(svcKey && !this.cartServices.includes(svcKey)) this.cartServices.push(svcKey);
        this.cartAddons.push(id);
      }
      this.save();
    },
    toggleDesc(id){ this.openDescs = { ...this.openDescs, [id]: !this.openDescs[id] }; },
    quickPick(kind){
      const maps = {
        essentials: { web:['web-seo','web-auto'], video:['vid-audio','vid-sizes'], events:['ev-digital','ev-media'], ugc:['ugc-captions','ugc-enhance'] },
        premium:    { web:['web-mvp','web-api','web-copy'], video:['vid-adv','vid-drone-p'], events:['ev-ven','ev-hybrid'], ugc:['ugc-repurpose','ugc-leads','ugc-views-20k'] },
      };
      const add = maps[kind]?.[this.activeService] || [];
      for(const id of add){
        if(!this.cartAddons.includes(id)){
          const svcKey = this.addonIndex[id]?.service;
          if(svcKey && !this.cartServices.includes(svcKey)) this.cartServices.push(svcKey);
          this.cartAddons.push(id);
        }
      }
      this.save();
    },
    openAddons(key){ this.activeService = key || 'web'; this.addonsOpen = true; },
    openBuilder(){ this.builderOpen = true; },
    clearAll(){ this.cartServices = []; this.cartAddons = []; this.save(); },
    flash(text){ this.toast = { text, show:true }; setTimeout(()=> this.toast.show=false, 1400); },

    // --- Checkout ---
    async beginCheckout(){
      try{
        if(this.isSubmitting) return;
        if(!this.cartServices.length){ this.flash('Add at least one Base Service.'); return; }
        if(!this.emailValid(this.contact.email)){ this.flash('Enter a valid email.'); return; }

        const cart = this.cartServices.map(svcKey => {
          const svc = this.services.find(s => s.key === svcKey);
          const base = svc?.base?.[this.plan] || 0;
          const addons = this.cartAddons
            .filter(id => this.addonIndex[id]?.service === svcKey)
            .map(id => ({ id, name: this.addonIndex[id].label, price: this.addonIndex[id].price[this.plan] }));
          return { service: svcKey, base, addons };
        });

        const endpoint = document.querySelector('meta[name="checkout-endpoint"]')?.content || '/api/checkout';
        this.isSubmitting = true;

        const res = await fetch(endpoint, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ plan: this.plan, cart, contact: { ...this.contact } })
        });
        const out = await res.json().catch(()=> ({}));
        if(!res.ok){ throw new Error(out?.error || `Checkout failed (${res.status})`); }

        if(out?.url){ location.assign(out.url); }
        else if(out?.id && window.Stripe){
          const pk = document.querySelector('meta[name="stripe-publishable-key"]')?.content;
          const stripe = Stripe(pk);
          const { error } = await stripe.redirectToCheckout({ sessionId: out.id });
          if(error) throw error;
        }else{
          throw new Error('Checkout response missing url');
        }
      }catch(e){
        console.error(e);
        this.flash(e.message || 'Checkout failed.');
        this.isSubmitting = false;
      }
    }
  }
}

// Expose to Alpine
window.landingApp = landingApp;
