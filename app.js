// app.js (root)
// Public catalog (no auth)
const CATALOG_URL = '/api/admin?r=catalog';

/* ---------- Quote encode/decode (used by Save/Email Quote) ---------- */
function encodeQuote(obj){
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  catch { return ''; }
}
function decodeQuote(s){
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  catch { return null; }
}

export function landingApp(){
  return {
    // --- STATE ---
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',
    activeTab: 'signature',

    // Complete 1CoastMedia Service Catalog (fallback)
    serviceCategories: {
      signature: {
        name: '★ Signature',
        description: 'Standout lead offers with fast turnarounds',
        services: [
          {
            key: '48h-launch',
            name: '48-Hour Launch Funnel',
            outcome: 'Complete funnel live in 48 hours',
            deliverables: ['Landing page + thank-you', 'GA4/pixels setup', '3 ad creatives', '1 welcome email'],
            price: { oneTime: 1950, monthly: null },
            sla: '48 hours',
            acceptance: 'Test lead, analytics events, QA report',
            badge: 'Fastest ROI',
            popular: true
          },
          {
            key: 'local-authority',
            name: 'Local Authority Sprint',
            outcome: 'Dominate local search in 7 days',
            deliverables: ['GBP overhaul', 'Top-20 citation cleanup', 'Local schema', '4 posts', '10 geo-photos', '1 local landing page'],
            price: { oneTime: 1500, monthly: null },
            sla: '7 days',
            acceptance: 'Schema validates, posts live, citations log',
            badge: 'Local Favorite',
            popular: true
          },
          {
            key: 'event-surge',
            name: 'Event Surge Kit',
            outcome: 'Event ready with full promotion setup',
            deliverables: ['Event page/ticket embed', '2 short promos', '3 flyer sizes', 'GBP Event', 'Geo ad setup', 'Email blast'],
            price: { oneTime: 1200, monthly: null },
            sla: '5-7 days',
            acceptance: 'Page live, test opt-in fires',
            badge: 'Event-Ready'
          },
          {
            key: 'brand-day',
            name: 'Brand-in-a-Day Intensive',
            outcome: 'Complete brand identity in one day',
            deliverables: ['Logo (2 concepts + 1 rev)', 'Palette + typography', 'Mini brand guide', '6 social templates', '1 motion bumper'],
            price: { oneTime: 1750, monthly: null },
            sla: '1 day',
            acceptance: 'All files delivered, brand guide complete',
            badge: 'Best Seller'
          },
          {
            key: 'site-week',
            name: 'Site-in-a-Week (6pp)',
            outcome: 'Professional 6-page website in 7 days',
            deliverables: ['6 responsive pages', 'Design system', 'Basic SEO', 'CRM/lead handoff', 'Analytics', 'Training'],
            price: { oneTime: 3500, monthly: null },
            sla: '7 days',
            acceptance: 'Lighthouse ≥90, forms working',
            badge: 'Best Seller'
          },
          {
            key: 'creator-concierge',
            name: 'Creator Concierge',
            outcome: 'Full-service creator management',
            deliverables: ['8 short videos', '12 posts', 'Engagement 30m/day', '2 UGC assets', 'Monthly insights'],
            price: { oneTime: null, monthly: 1800 },
            sla: 'Monthly',
            minTerm: '3 months',
            acceptance: 'Content calendar delivered, engagement metrics',
            badge: 'Best Seller'
          },
          {
            key: 'cannabis-kit',
            name: 'Compliance-Safe Cannabis/Hemp Kit',
            outcome: 'Compliant marketing that converts',
            deliverables: ['2 SEO articles', 'Compliant directory placement', 'Email/SMS flows', 'GBP hygiene'],
            price: { oneTime: null, monthly: 1400 },
            sla: 'Monthly',
            minTerm: '3 months',
            acceptance: 'Compliance review passed, flows active'
          },
          {
            key: 'review-rocket',
            name: 'Review Rocket',
            outcome: 'Automated review generation system',
            deliverables: ['Review landing page', 'Automation (100 invites)', 'Templates', 'Signage file'],
            price: { oneTime: 350, monthly: null },
            addOns: [{ name: 'Print QR codes', price: 50 }],
            sla: '5 days',
            acceptance: 'Landing page live, automation tested'
          },
          {
            key: 'roi-guard-ppc',
            name: 'ROI-Guard PPC Management',
            outcome: 'Guaranteed PPC performance',
            deliverables: ['Campaign build + creatives', 'Weekly optimization', 'Performance reporting'],
            price: { oneTime: 800, monthly: '12% ad spend (min $700/mo)' },
            sla: 'Setup: 7 days, Ongoing: Weekly',
            minTerm: '3 months',
            guarantee: 'No conversions by day 45 → 2 free A/B tests',
            acceptance: 'Campaigns live, tracking verified'
          },
          {
            key: 'ugc-lab',
            name: 'UGC Lab (Starter)',
            outcome: 'Professional UGC content pipeline',
            deliverables: ['4 UGC videos/month via micro-creators', 'Hook library updates'],
            price: { oneTime: null, monthly: 1200 },
            sla: 'Monthly',
            minTerm: '2 months',
            acceptance: 'Videos delivered, hook library updated'
          }
        ]
      },
      core: {
        name: 'Core',
        description: 'Optimized base packages for essential needs',
        services: [
          {
            key: 'website-launch-pro',
            name: 'Website Launch — Pro',
            outcome: 'Professional website with full setup',
            deliverables: ['6 pages', 'Design system', 'SEO basics', 'CRM/pixel handoff', 'GA4 goals', 'Training'],
            price: { oneTime: 2800, monthly: null },
            sla: '3-4 weeks',
            acceptance: 'Lighthouse ≥90, all integrations working'
          },
          {
            key: 'brand-essentials',
            name: 'Brand Essentials Kit',
            outcome: 'Complete brand identity package',
            deliverables: ['Logo (3 concepts, 2 revs)', 'Palette + typography', 'Mini brand guide', 'Avatars/banners'],
            price: { oneTime: 1200, monthly: null },
            sla: '1-2 weeks',
            acceptance: 'All brand assets delivered'
          },
          {
            key: 'content-sprint-30',
            name: 'Content Sprint — 30 Days',
            outcome: 'Month of ready-to-post content',
            deliverables: ['12 posts', '2 short videos', '20 photos', 'Content calendar'],
            price: { oneTime: 1950, monthly: null },
            sla: '4 weeks',
            acceptance: 'All content delivered, calendar provided'
          },
          {
            key: 'local-growth',
            name: 'Local Growth Kit',
            outcome: 'Local SEO foundation established',
            deliverables: ['GBP optimization', 'Citations cleanup', 'Local schema', 'Review system'],
            price: { oneTime: 1000, monthly: null },
            sla: '2-3 weeks',
            acceptance: 'Schema validates, GBP optimized'
          }
        ]
      },
      oneTime: {
        name: 'One-Time',
        description: 'Project boosts and standalone services',
        services: [
          {
            key: 'logo-design',
            name: 'Logo Design',
            outcome: 'Professional logo with full file set',
            deliverables: ['3 concepts', '2 revisions', 'Full file set'],
            price: { oneTime: 400, monthly: null },
            sla: '5 days'
          },
          {
            key: 'brand-style-mini',
            name: 'Brand Style Guide Mini',
            outcome: 'Consistent brand guidelines',
            deliverables: ['Fonts/colors guide', '2 template covers'],
            price: { oneTime: 350, monthly: null },
            sla: '4 days'
          },
          {
            key: 'copywriting-sprint',
            name: 'Copywriting Sprint (≤6pp)',
            outcome: 'Compelling copy for up to 6 pages',
            deliverables: ['Website copy', 'SEO optimization', 'Brand voice consistency'],
            price: { oneTime: 500, monthly: null },
            sla: '5 days'
          },
          {
            key: 'landing-page',
            name: 'Landing Page (Design+Build)',
            outcome: 'High-converting landing page',
            deliverables: ['Custom design', 'Mobile responsive', 'QA ≥90 desktop'],
            price: { oneTime: 1200, monthly: null },
            sla: '7 days'
          },
          {
            key: 'promo-video',
            name: 'Promo Video (30-45s)',
            outcome: 'Professional promotional video',
            deliverables: ['30-45 second edit', '2 aspect ratios', 'Captions included'],
            price: { oneTime: 800, monthly: null },
            sla: '6 days'
          },
          {
            key: 'event-flyer',
            name: 'Event Flyer',
            outcome: 'Print and digital event promotion',
            deliverables: ['Print-ready design', 'Instagram format'],
            price: { oneTime: 200, monthly: null },
            sla: '3 days'
          },
          {
            key: 'email-campaign',
            name: 'Email Campaign Setup',
            outcome: 'Professional email marketing setup',
            deliverables: ['Campaign design', 'List setup', 'Automation config'],
            price: { oneTime: 300, monthly: null },
            sla: '3 days'
          },
          {
            key: 'seo-audit',
            name: 'SEO Starter Audit & Fix (10 items)',
            outcome: 'Improved search visibility',
            deliverables: ['Technical audit', '10 priority fixes', 'Recommendations report'],
            price: { oneTime: 600, monthly: null },
            sla: '7 days'
          },
          {
            key: 'photography-pack',
            name: 'Photography Pack (20 edits)',
            outcome: 'Professional photo editing',
            deliverables: ['20 edited photos', 'Color correction', 'Optimization for web'],
            price: { oneTime: 450, monthly: null },
            sla: '7 days'
          },
          {
            key: 'checkout-booking',
            name: 'Checkout/Booking Integration',
            outcome: 'Seamless payment and booking system',
            deliverables: ['Payment gateway setup', 'Booking system integration', 'Testing'],
            price: { oneTime: 350, monthly: null },
            sla: '4 days'
          }
        ]
      },
      monthly: {
        name: 'Monthly',
        description: 'Recurring services with minimum terms',
        services: [
          {
            key: 'social-starter',
            name: 'Social Media Starter',
            outcome: 'Consistent social presence',
            deliverables: ['1 platform', '12 posts', 'Engagement 15m/day', 'Monthly report'],
            price: { oneTime: null, monthly: 900 },
            minTerm: '3 months'
          },
          {
            key: 'social-growth',
            name: 'Social Media Growth',
            outcome: 'Multi-platform social strategy',
            deliverables: ['2 platforms', '16 posts', '2 reels', '30m/day engagement', 'Insights report'],
            price: { oneTime: null, monthly: 1400 },
            minTerm: '3 months'
          },
          {
            key: 'website-maintenance',
            name: 'Website Maintenance',
            outcome: 'Worry-free website management',
            deliverables: ['Weekly updates', '3h monthly edits', 'Uptime monitoring', 'Monthly report'],
            price: { oneTime: null, monthly: 300 },
            minTerm: '3 months'
          },
          {
            key: 'seo-retainer-std',
            name: 'SEO Retainer Standard',
            outcome: 'Steady search growth',
            deliverables: ['2 SEO articles', 'Keyword planning', 'On-page fixes', 'Monthly report'],
            price: { oneTime: null, monthly: 1200 },
            minTerm: '4 months'
          },
          {
            key: 'seo-retainer-growth',
            name: 'SEO Retainer Growth',
            outcome: 'Aggressive search domination',
            deliverables: ['4 articles', 'Technical fixes', 'Citation building', 'Growth roadmap'],
            price: { oneTime: null, monthly: 1800 },
            minTerm: '4 months'
          },
          {
            key: 'paid-ads-mgmt',
            name: 'Paid Ads Management',
            outcome: 'Profitable ad campaigns',
            deliverables: ['Campaign management', 'Creative testing', 'Weekly optimization'],
            price: { oneTime: 800, monthly: '12% spend (min $700/mo)' },
            minTerm: '3 months'
          },
          {
            key: 'email-marketing-std',
            name: 'Email Marketing Standard',
            outcome: 'Effective email campaigns',
            deliverables: ['2 sends/month', 'List hygiene', 'Performance report'],
            price: { oneTime: null, monthly: 700 },
            minTerm: '2 months'
          },
          {
            key: 'email-marketing-growth',
            name: 'Email Marketing Growth',
            outcome: 'Advanced email strategy',
            deliverables: ['4 sends/month', 'A/B testing', 'Automation setup', 'Insights report'],
            price: { oneTime: null, monthly: 1200 },
            minTerm: '3 months'
          },
          {
            key: 'content-retainer-lite',
            name: 'Content Retainer Lite',
            outcome: 'Regular content creation',
            deliverables: ['Half-day shoot', '30 photos', '2 videos'],
            price: { oneTime: null, monthly: 1300 },
            minTerm: '3 months'
          },
          {
            key: 'content-retainer-pro',
            name: 'Content Retainer Pro',
            outcome: 'Premium content production',
            deliverables: ['Full-day shoot', '50 photos', '4 videos'],
            price: { oneTime: null, monthly: 2100 },
            minTerm: '3 months'
          },
          {
            key: 'analytics-cro',
            name: 'Analytics & CRO',
            outcome: 'Data-driven optimization',
            deliverables: ['Custom dashboard', 'Event tracking', '1 A/B test/month'],
            price: { oneTime: null, monthly: 450 },
            minTerm: '2 months'
          }
        ]
      }
    },

    // Bundles for value stacking
    bundles: [
      {
        key: 'local-dominator',
        name: 'Local Dominator',
        description: 'Complete local market domination',
        includes: ['Local Authority Sprint', 'GBP posts', 'Review Rocket'],
        price: { oneTime: 1000, monthly: 300 }
      },
      {
        key: 'growth-wave',
        name: 'Growth Wave (Quarterly)',
        description: 'Quarterly growth acceleration',
        includes: ['Campaign refresh', 'LP refresh', '6 graphics', '2 shorts', 'Email/GBP'],
        price: { quarterly: 2500 }
      },
      {
        key: 'launch-ads',
        name: 'Launch + Ads',
        description: 'Website launch with immediate traffic',
        includes: ['Website Launch Pro', 'ROI-Guard PPC', '1 A/B test'],
        price: { oneTime: 2800, monthly: 'PPC fee' }
      }
    ],

    addonIndex:{},
    openDescs:{},
    cartServices:[],
    cartAddons:[],
    builderOpen:false,
    addonsOpen:false,
    activeService:'signature',
    stickyCta:false,
    toast:{show:false,text:''},
    isSubmitting:false,
    contact:{ name:'', email:'', company:'', phone:'', notes:'' },

    /* ---------- lifecycle ---------- */
    async init(){
      // expose Alpine instance for global helpers
      window.App = this;

      // Try to fetch from API and convert to serviceCategories format
      try{
        const r = await fetch(CATALOG_URL, { cache:'no-store' });
        if(r.ok){
          const j = await r.json();
          if(Array.isArray(j.services) && j.services.length){
            // Convert old API format to new serviceCategories format
            this.serviceCategories = this.convertApiToCategories(j.services);
            console.log('Loaded services from API and converted to categories');
          }
        } else {
          console.warn('Catalog fetch failed, using fallback', r.status);
        }
      }catch(e){
        console.warn('Catalog fetch error, using fallback', e);
      }

      // Restore cart from localStorage
      try{
        const saved = JSON.parse(localStorage.getItem('coast_cart')||'{}');
        this.hydrateFromSaved(saved);
      }catch{}

      // If we have a quote param, hydrate from it
      const q = new URLSearchParams(location.search).get('quote');
      if (q) {
        const decoded = decodeQuote(q);
        if (decoded?.cart) this.hydrateFromSaved(decoded.cart);
      }

      // Sticky CTA
      const onScroll = () => { this.stickyCta = window.scrollY > 640 };
      onScroll(); window.addEventListener('scroll', onScroll);

      // Wire Save / Email Quote buttons
      wireConversionButtons();
    },

    // Convert old API services array to new serviceCategories format
    convertApiToCategories(apiServices) {
      const categories = {
        signature: { name: '★ Signature', description: 'Standout lead offers with fast turnarounds', services: [] },
        core: { name: 'Core', description: 'Optimized base packages for essential needs', services: [] },
        oneTime: { name: 'One-Time', description: 'Project boosts and standalone services', services: [] },
        monthly: { name: 'Monthly', description: 'Recurring services with minimum terms', services: [] }
      };

      // Map API services to categories based on naming patterns or price structure
      apiServices.forEach(service => {
        const convertedService = {
          key: service.key,
          name: service.name,
          outcome: service.blurb || `Professional ${service.name.toLowerCase()}`,
          deliverables: service.includes || ['Service delivery as specified'],
          price: {
            oneTime: service.base?.oneTime || null,
            monthly: service.base?.monthly || null
          },
          sla: '5-7 days', // default
          acceptance: 'Delivery confirmed and approved'
        };

        // Categorize based on service characteristics
        const name = service.name.toLowerCase();
        if (name.includes('48') || name.includes('hour') || name.includes('sprint') || name.includes('intensive')) {
          categories.signature.services.push(convertedService);
        } else if (service.base?.monthly && !service.base?.oneTime) {
          categories.monthly.services.push(convertedService);
        } else if (service.base?.oneTime && !service.base?.monthly) {
          categories.oneTime.services.push(convertedService);
        } else {
          categories.core.services.push(convertedService);
        }
      });

      return categories;
    },

    /* ---------- computeds ---------- */
    get total(){
      let baseSum = 0;
      this.cartServices.forEach(key => {
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services?.find(s => s.key === key);
          if (service && service.price[this.plan]) {
            baseSum += service.price[this.plan];
            break;
          }
        }
      });
      
      const addonSum = this.cartAddons.reduce((s, id) => s + (this.addonIndex[id]?.price?.[this.plan] || 0), 0);
      return baseSum + addonSum;
    },

    // Add missing computed properties for monthly and one-time totals
    get getMonthlyTotal(){
      let baseSum = 0;
      this.cartServices.forEach(key => {
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services?.find(s => s.key === key);
          if (service && service.price.monthly) {
            baseSum += service.price.monthly;
            break;
          }
        }
      });
      
      const addonSum = this.cartAddons.reduce((s, id) => s + (this.addonIndex[id]?.price?.monthly || 0), 0);
      return baseSum + addonSum;
    },

    get getOneTimeTotal(){
      let baseSum = 0;
      this.cartServices.forEach(key => {
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services?.find(s => s.key === key);
          if (service && service.price.oneTime) {
            baseSum += service.price.oneTime;
            break;
          }
        }
      });
      
      const addonSum = this.cartAddons.reduce((s, id) => s + (this.addonIndex[id]?.price?.oneTime || 0), 0);
      return baseSum + addonSum;
    },

    /* ---------- helpers ---------- */
    serviceName(key){ 
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === key);
        if (service) return service.name;
      }
      return key;
    },
    
    servicePrice(key){ 
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === key);
        if (service && service.price[this.plan]) return service.price[this.plan];
      }
      return 0;
    },
    
    fmtUSD(v){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v); },
    save(){
      localStorage.setItem('coast_cart', JSON.stringify(this.getCartSnapshot()));
    },
    emailValid(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e||''); },

    // snapshot of current cart
    getCartSnapshot(){
      return {
        services: this.cartServices.slice(),
        addons: this.cartAddons.slice(),
        plan: this.plan,
        contact: { ...this.contact }
      };
    },
    
    // apply saved cart to UI
    hydrateFromSaved(saved){
      if(!saved) return;
      if(Array.isArray(saved.services)) this.cartServices = [...new Set(saved.services)];
      if(Array.isArray(saved.addons)) this.cartAddons = [...new Set(saved.addons)];
      if(saved.plan && (saved.plan==='oneTime' || saved.plan==='monthly')) this.plan = saved.plan;
      if(saved.contact) this.contact = { ...this.contact, ...saved.contact };
    },

    /* ---------- UI actions ---------- */
    setPlan(p){ this.plan = p; this.save(); },
    toggleService(key){ 
      const i=this.cartServices.indexOf(key); 
      if(i>-1) this.cartServices.splice(i,1); 
      else this.cartServices.push(key); 
      this.save(); 
    },
    
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

    /* ---------- Checkout ---------- */
    async beginCheckout(){
      try{
        if(this.isSubmitting) return;
        if(!this.cartServices.length){ this.flash('Add at least one Base Service.'); return; }
        if(!this.emailValid(this.contact.email)){ this.flash('Enter a valid email.'); return; }

        const cart = this.cartServices.map(svcKey => {
          // Fix: Find service in serviceCategories instead of this.services
          let svc = null;
          for (const category of Object.values(this.serviceCategories)) {
            svc = category.services?.find(s => s.key === svcKey);
            if (svc) break;
          }
          
          const base = svc?.price?.[this.plan] || 0;
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

/* ---------- Wire Save Cart + Email Quote buttons (global) ---------- */
function wireConversionButtons(){
  // Buttons (if present in DOM)
  const btnSave   = document.getElementById('btn-save-cart');
  const btnQuote  = document.getElementById('btn-email-quote');
  const btnClear2 = document.getElementById('btn-clear-cart-2'); // optional extra clear button

  // Modal elements
  const modal     = document.getElementById('quote-modal');
  const closeBtn  = document.getElementById('quote-close');
  const cancelBtn = document.getElementById('quote-cancel');
  const sendBtn   = document.getElementById('quote-send');
  const copyBtn   = document.getElementById('quote-copy');
  const linkInp   = document.getElementById('quote-link');
  const emailInp  = document.getElementById('quote-email');
  const noteInp   = document.getElementById('quote-note');

  const toast = (msg) => window.App?.flash ? window.App.flash(msg) : alert(msg);

  function makeQuoteLink(){
    const snap = window.App?.getCartSnapshot ? window.App.getCartSnapshot() : { services:[], addons:[], plan:'monthly' };
    const code = encodeQuote({ v:2, cart: snap, ts: Date.now() });
    const url = new URL(location.href);
    url.searchParams.set('quote', code);
    return url.toString();
  }
  function openModal(){
    if(!modal) return;
    if(linkInp) linkInp.value = makeQuoteLink();
    modal.classList.remove('hidden');
    setTimeout(()=> emailInp?.focus(), 0);
  }
  function closeModal(){
    modal?.classList.add('hidden');
  }

  btnSave?.addEventListener('click', () => {
    try {
      // ensure the latest state is persisted to localStorage
      const snap = window.App?.getCartSnapshot ? window.App.getCartSnapshot() : null;
      if (snap) localStorage.setItem('coast_cart', JSON.stringify(snap));
      toast('Cart saved');
    } catch { toast('Could not save'); }
  });

  btnQuote?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(linkInp.value);
      toast('Link copied');
    } catch { toast('Copy failed'); }
  });

  sendBtn?.addEventListener('click', () => {
    const email = (emailInp?.value || '').trim();
    const link  = linkInp?.value || makeQuoteLink();
    const note  = (noteInp?.value || '').trim();

    const subject = encodeURIComponent('1CoastMedia — Your Quote');
    const body = encodeURIComponent(
`Here’s your quote link:

${link}

${note ? `Note: ${note}\n\n` : ''}You can reopen this anytime. When you’re ready, click "Review & Checkout".`
    );

    const href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
    window.location.href = href;

    // Non-blocking: record a light lead
    fetch('/api/forms/leads', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email, message:'Requested quote email', meta:{ link, note } })
    }).catch(()=>{});

    closeModal();
  });

  // optional: extra clear button near checkout bar
  btnClear2?.addEventListener('click', () => window.App?.clearAll && window.App.clearAll());
}

// Expose to Alpine
window.landingApp = landingApp;
