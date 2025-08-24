// app.js
const CATALOG_URL = '/api/admin?r=catalog';

/* ---------- Quote encode/decode ---------- */
function encodeQuote(obj){
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  catch { return ''; }
}
function decodeQuote(s){
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  catch { return null; }
}

/* Try posting a light lead to either /api/forms/lead or /api/forms/leads */
async function postLead(payload){
  try {
    const r = await fetch('/api/forms/lead', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (r.ok) return;
  } catch {}
  try {
    await fetch('/api/forms/leads', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  } catch {}
}

export function landingApp(){
  return {
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',

    // ------- fallback catalog (unchanged content) -------
    services: [/* (your long services/addOns array exactly as before) */],

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

    /* ---------- lifecycle ---------- */
    async init(){
      // Expose Alpine instance so plain buttons can call into it
      window.App = this;

      this.rebuildIndex();

      // Use window.serviceData instead of API fetch
      if (window.serviceData && window.serviceData.serviceCategories) {
        // Convert serviceData structure to expected format
        this.services = [];
        Object.values(window.serviceData.serviceCategories).forEach(category => {
          this.services.push(...category.services);
        });
        
        // Also load addons from window.serviceData
        if (window.serviceData.addons) {
          this.addons = window.serviceData.addons;
        }
        
        this.activeService = this.services[0]?.key || this.services[0]?.key;
        this.rebuildIndex();
      }

      // Load catalog from API
      // Remove or comment out the API fetch section:
      /*
      try{
        const r = await fetch(CATALOG_URL, { cache:'no-store' });
        if(r.ok){
          const j = await r.json();
          if(Array.isArray(j.services) && j.services.length){
            this.services = j.services;
            this.activeService = this.services[0]?.key || 'web';
            this.rebuildIndex();
          }
        }
      }catch{}
      */

      // Restore saved cart
      try{
        const saved = JSON.parse(localStorage.getItem('coast_cart')||'{}');
        this.hydrateFromSaved(saved);
      }catch{}

      // If URL has ?quote=..., hydrate from it
      const q = new URLSearchParams(location.search).get('quote');
      if (q) {
        const decoded = decodeQuote(q);
        if (decoded?.cart) this.hydrateFromSaved(decoded.cart);
      }

      // Sticky CTA
      const onScroll = () => { this.stickyCta = window.scrollY > 640 };
      onScroll(); window.addEventListener('scroll', onScroll);

      // Wire conversion buttons anywhere on the page
      this.bindGlobalButtons();
    },

    rebuildIndex(){
      // Build addon index from window.serviceData.addons if available
      if (window.serviceData && window.serviceData.addons) {
        this.addonIndex = window.serviceData.addons.reduce((acc, addon) => {
          acc[addon.key] = { ...addon, service: addon.applicableServices };
          return acc;
        }, {});
      } else {
        // Fallback to old structure
        this.addonIndex = this.services.reduce((acc, svc) => {
          (svc.addOns||[]).forEach(a => acc[a.id] = { ...a, service: svc.key });
          return acc;
        }, {});
      }
    },

    /* ---------- computeds ---------- */
    get total(){
      const baseSum = this.cartServices.reduce((s, key) => s + (this.services.find(x => x.key === key)?.price?.[this.plan] || 0), 0);
      const addonSum = this.cartAddons.reduce((s, id) => s + (this.addonIndex[id]?.price?.[this.plan] || 0), 0);
      return baseSum + addonSum;
    },

    /* ---------- helpers ---------- */
    serviceName(key){ return (this.services.find(s => s.key === key) || {}).name || key; },
    serviceBase(key){ return (this.services.find(s => s.key === key) || {}).price?.[this.plan] || 0; },
    fmtUSD(v){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v); },
    emailValid(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e||''); },

    getCartSnapshot(){
      return {
        services: this.cartServices.slice(),
        addons: this.cartAddons.slice(),
        plan: this.plan,
        contact: { ...this.contact }
      };
    },
    hydrateFromSaved(saved){
      if(!saved) return;
      if(Array.isArray(saved.services)) this.cartServices = [...new Set(saved.services)];
      if(Array.isArray(saved.addons))   this.cartAddons  = [...new Set(saved.addons)];
      if(saved.plan && (saved.plan==='oneTime' || saved.plan==='monthly')) this.plan = saved.plan;
      if(saved.contact) this.contact = { ...this.contact, ...saved.contact };
      this.save(); // keep localStorage in sync
    },
    save(){ localStorage.setItem('coast_cart', JSON.stringify(this.getCartSnapshot())); },

    /* ---------- UI actions ---------- */
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

    /* ---------- Conversion helpers (buttons) ---------- */
    generateQuoteLink(){
      const code = encodeQuote({ v:2, cart: this.getCartSnapshot(), ts: Date.now() });
      const url = new URL(location.href);
      url.searchParams.set('quote', code);
      return url.toString();
    },

    bindGlobalButtons(){
      // Direct IDs
      const byId = (id)=>document.getElementById(id);
      const btnSave   = byId('btn-save-cart');
      const btnQuote  = byId('btn-email-quote');
      const btnClear2 = byId('btn-clear-cart-2');

      btnSave?.addEventListener('click', () => this.handleSaveCartClick());
      btnQuote?.addEventListener('click', () => this.handleEmailQuoteClick());
      btnClear2?.addEventListener('click', () => this.clearAll());

      // Attribute-based (works anywhere)
      document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-action]');
        if(!el) return;
        const act = el.getAttribute('data-action');
        if(act === 'save-cart'){ this.handleSaveCartClick(); }
        if(act === 'email-quote'){ this.handleEmailQuoteClick(); }
        if(act === 'clear-cart'){ this.clearAll(); }
      });
    },

    handleSaveCartClick(){
      try{
        this.save();
        this.flash('Cart saved');
      }catch{ this.flash('Could not save'); }
    },

    handleEmailQuoteClick(){
      const modal     = document.getElementById('quote-modal');
      const linkInp   = document.getElementById('quote-link');
      const emailInp  = document.getElementById('quote-email');
      const noteInp   = document.getElementById('quote-note');
      const copyBtn   = document.getElementById('quote-copy');
      const sendBtn   = document.getElementById('quote-send');
      const closeBtn  = document.getElementById('quote-close');
      const cancelBtn = document.getElementById('quote-cancel');

      const link = this.generateQuoteLink();

      // If there is a modal in the DOM, use it
      if (modal) {
        if (linkInp)  linkInp.value = link;
        modal.classList.remove('hidden');

        const close = ()=> modal.classList.add('hidden');
        closeBtn?.addEventListener('click', close, { once:true });
        cancelBtn?.addEventListener('click', close, { once:true });

        copyBtn?.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(link); this.flash('Link copied'); }
          catch { this.flash('Copy failed'); }
        }, { once:true });

        sendBtn?.addEventListener('click', () => {
          const email = (emailInp?.value || '').trim();
          const note  = (noteInp?.value || '').trim();
          const subject = encodeURIComponent('1CoastMedia — Your Quote');
          const body = encodeURIComponent(
`Here’s your quote link:

${link}

${note ? `Note: ${note}\n\n` : ''}You can reopen this anytime. When you’re ready, click "Review & Checkout".`
          );
          const href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
          window.location.href = href;
          postLead({ email, message:'Requested quote email', meta:{ link, note }});
          close();
        }, { once:true });

        // focus
        setTimeout(()=> emailInp?.focus(), 0);
        return;
      }

      // Fallback: no modal → simple prompt + mailto
      const email = prompt('Send quote to which email? (leave blank to just copy link)') || '';
      if (email) {
        const subject = encodeURIComponent('1CoastMedia — Your Quote');
        const body = encodeURIComponent(`Here’s your quote link:\n\n${link}\n\nYou can reopen this anytime.`);
        window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
        postLead({ email, message:'Requested quote email (no modal)', meta:{ link }});
      } else {
        navigator.clipboard?.writeText(link).then(
          ()=> this.flash('Link copied'),
          ()=> this.flash(link) // last resort: show the link in toast
        );
      }
    },

    /* ---------- Checkout ---------- */
    async beginCheckout(){
      try{
        if(this.isSubmitting) return;
        if(!this.cartServices.length){ this.flash('Add at least one Base Service.'); return; }
        if(!this.emailValid(this.contact.email)){ this.flash('Enter a valid email.'); return; }

        const cart = this.cartServices.map(svcKey => {
          const svc = this.services.find(s => s.key === svcKey);
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
    
    // Add these functions after the existing UI actions
    
    // Add-ons modal functions
    showAddonsModal: false,
    activeAddonService: '',
    addonSearchQuery: '',
    addonSortBy: 'popular',
    
    openAddonsModal(serviceKey) {
      this.activeAddonService = serviceKey || '';
      this.showAddonsModal = true;
      this.addonSearchQuery = '';
      this.addonSortBy = 'popular';
    },
    
    closeAddonsModal() {
      this.showAddonsModal = false;
    },
    
    loadAddonsForService(serviceKey) {
      if (!window.serviceData || !window.serviceData.addons) return [];
      return window.serviceData.addons.filter(addon => 
        addon.applicableServices.includes('all') || 
        addon.applicableServices.includes(serviceKey)
      );
    },
    
    getAvailableServices() {
      return this.services || [];
    },
    
    getFilteredAddons() {
      const addons = this.loadAddonsForService(this.activeAddonService);
      let filtered = addons;
      
      // Apply search filter
      if (this.addonSearchQuery.trim()) {
        const query = this.addonSearchQuery.toLowerCase();
        filtered = filtered.filter(addon => 
          addon.name.toLowerCase().includes(query) ||
          addon.description.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      switch(this.addonSortBy) {
        case 'price-asc':
          filtered.sort((a, b) => (a.price.oneTime || 0) - (b.price.oneTime || 0));
          break;
        case 'price-desc':
          filtered.sort((a, b) => (b.price.oneTime || 0) - (a.price.oneTime || 0));
          break;
        case 'alpha':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default: // popular
          // Keep original order
          break;
      }
      
      return filtered;
    },
    
    getAddonByKey(key) {
      if (!window.serviceData || !window.serviceData.addons) return null;
      return window.serviceData.addons.find(addon => addon.key === key);
    },
    
    // Update pricing calculations to include add-ons
    getOneTimeTotal() {
      const servicesTotal = this.cartServices.reduce((sum, serviceKey) => {
        const service = this.services.find(s => s.key === serviceKey);
        return sum + (service?.price?.oneTime || 0);
      }, 0);
      
      const addonsTotal = this.cartAddons.reduce((sum, addonKey) => {
        const addon = this.getAddonByKey(addonKey);
        return sum + (addon?.price?.oneTime || 0);
      }, 0);
      
      return servicesTotal + addonsTotal;
    },
    
    getMonthlyTotal() {
      const servicesTotal = this.cartServices.reduce((sum, serviceKey) => {
        const service = this.services.find(s => s.key === serviceKey);
        return sum + (service?.price?.monthly || 0);
      }, 0);
      
      const addonsTotal = this.cartAddons.reduce((sum, addonKey) => {
        const addon = this.getAddonByKey(addonKey);
        return sum + (addon?.price?.monthly || 0);
      }, 0);
      
      return servicesTotal + addonsTotal;
    },
  }
}

// Expose to Alpine
window.landingApp = landingApp;
