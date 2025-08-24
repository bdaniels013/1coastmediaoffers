// app.js - Complete implementation with proper checkout
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

function landingApp(){
  return {
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',
    activeTab: 'signature',

    // Service data from services.js
    serviceCategories: window.serviceData?.serviceCategories || {},
    bundles: window.serviceData?.bundles || [],
    addons: window.serviceData?.addons || [],

    // Cart state
    cartServices: [],
    cartAddons: [],
    
    // Modal states
    builderOpen: false,
    addonsOpen: false,
    quoteOpen: false,
    dependencyModalOpen: false,
    
    // Contact form
    contact: { name: '', email: '', company: '', phone: '', notes: '' },
    quoteEmail: '',
    quoteNote: '',
    
    // UI state
    stickyCta: false,
    toast: { show: false, text: '' },
    isSubmitting: false,
    openDescs: {},
    
    // Dependencies
    dependencyService: null,
    dependentServices: [],

    /* ---------- Lifecycle ---------- */
    async init(){
      // Expose Alpine instance
      window.App = this;

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
      onScroll(); 
      window.addEventListener('scroll', onScroll);
    },

    /* ---------- Computeds ---------- */
    get total(){
      let oneTimeTotal = 0;
      let monthlyTotal = 0;
      
      // Calculate service totals
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) {
          oneTimeTotal += service.price.oneTime || 0;
          monthlyTotal += service.price.monthly || 0;
        }
      });
      
      // Calculate addon totals
      this.cartAddons.forEach(addonKey => {
        const addon = this.addons.find(a => a.key === addonKey);
        if (addon) {
          oneTimeTotal += addon.price.oneTime || 0;
          monthlyTotal += addon.price.monthly || 0;
        }
      });
      
      return this.plan === 'monthly' ? monthlyTotal : oneTimeTotal;
    },

    get visibleAddons(){
      return this.addons.filter(addon => {
        if (!this.addonQuery) return true;
        const query = this.addonQuery.toLowerCase();
        return addon.name.toLowerCase().includes(query) || 
               addon.description.toLowerCase().includes(query);
      });
    },

    /* ---------- Helpers ---------- */
    fmtUSD(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },

    emailValid(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
    },

    getServiceByKey(key) {
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === key);
        if (service) return service;
      }
      return null;
    },

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
      if(Array.isArray(saved.addons)) this.cartAddons = [...new Set(saved.addons)];
      if(saved.plan && (saved.plan==='oneTime' || saved.plan==='monthly')) this.plan = saved.plan;
      if(saved.contact) this.contact = { ...this.contact, ...saved.contact };
      this.save();
    },

    save() {
      localStorage.setItem('coast_cart', JSON.stringify(this.getCartSnapshot()));
    },

    flash(text) {
      this.toast = { text, show: true };
      setTimeout(() => this.toast.show = false, 3000);
    },

    /* ---------- Service Management ---------- */
    setPlan(plan) {
      this.plan = plan;
      this.save();
    },

    toggleService(serviceKey) {
      const index = this.cartServices.indexOf(serviceKey);
      if (index > -1) {
        this.cartServices.splice(index, 1);
        // Remove related addons
        this.cartAddons = this.cartAddons.filter(addonKey => {
          const addon = this.addons.find(a => a.key === addonKey);
          return !addon?.applicableServices?.includes(serviceKey);
        });
      } else {
        this.cartServices.push(serviceKey);
      }
      this.save();
    },

    addWithDependencies(serviceKey) {
      const service = this.getServiceByKey(serviceKey);
      if (!service) return;
      
      const dependencies = this.getDependentServices(serviceKey);
      if (dependencies.length > 0) {
        this.dependencyService = service;
        this.dependentServices = dependencies;
        this.dependencyModalOpen = true;
      } else {
        this.addWithoutDependencies(serviceKey);
      }
    },

    addWithoutDependencies(serviceKey) {
      if (!this.cartServices.includes(serviceKey)) {
        this.cartServices.push(serviceKey);
        this.save();
      }
      this.closeDependencyModal();
    },

    getDependentServices(serviceKey) {
      // This would contain logic to determine service dependencies
      // For now, return empty array
      return [];
    },

    getDependencyTotal() {
      return this.dependentServices.reduce((total, service) => {
        return total + (this.plan === 'monthly' ? service.price.monthly : service.price.oneTime);
      }, 0);
    },

    closeDependencyModal() {
      this.dependencyModalOpen = false;
      this.dependencyService = null;
      this.dependentServices = [];
    },

    /* ---------- Cart Management ---------- */
    getOneTimeTotal() {
      let total = 0;
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price.oneTime || 0;
      });
      this.cartAddons.forEach(addonKey => {
        const addon = this.addons.find(a => a.key === addonKey);
        if (addon) total += addon.price.oneTime || 0;
      });
      return total;
    },

    getMonthlyTotal() {
      let total = 0;
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price.monthly || 0;
      });
      this.cartAddons.forEach(addonKey => {
        const addon = this.addons.find(a => a.key === addonKey);
        if (addon) total += addon.price.monthly || 0;
      });
      return total;
    },

    getMinTermsInfo() {
      const terms = [];
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service?.minTerm) terms.push(service.minTerm);
      });
      return terms.length > 0 ? terms.join(', ') : null;
    },

    clearAll() {
      this.cartServices = [];
      this.cartAddons = [];
      this.save();
    },

    /* ---------- Modal Management ---------- */
    openBuilder() {
      this.builderOpen = true;
      document.body.classList.add('no-scroll');
    },

    closeBuilder() {
      this.builderOpen = false;
      document.body.classList.remove('no-scroll');
    },

    openAddons() {
      this.addonsOpen = true;
      document.body.classList.add('no-scroll');
    },

    closeAddons() {
      this.addonsOpen = false;
      document.body.classList.remove('no-scroll');
    },

    openQuote() {
      this.quoteOpen = true;
      document.body.classList.add('no-scroll');
    },

    closeQuote() {
      this.quoteOpen = false;
      document.body.classList.remove('no-scroll');
    },

    /* ---------- Add-ons ---------- */
    toggleAddon(addonKey) {
      const index = this.cartAddons.indexOf(addonKey);
      if (index > -1) {
        this.cartAddons.splice(index, 1);
      } else {
        this.cartAddons.push(addonKey);
      }
      this.save();
    },

    /* ---------- Quote Management ---------- */
    generateQuoteLink(){
      const code = encodeQuote({ v:2, cart: this.getCartSnapshot(), ts: Date.now() });
      const url = new URL(location.href);
      url.searchParams.set('quote', code);
      return url.toString();
    },

    downloadQuoteFile() {
      const quoteData = {
        services: this.cartServices.map(key => {
          const service = this.getServiceByKey(key);
          return {
            name: service?.name || key,
            price: this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime
          };
        }),
        addons: this.cartAddons.map(key => {
          const addon = this.addons.find(a => a.key === key);
          return {
            name: addon?.name || key,
            price: this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime
          };
        }),
        total: this.total,
        plan: this.plan
      };
      
      const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1coastmedia-quote-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    handleOpenEmailDraft() {
      const subject = encodeURIComponent('1Coast Media Service Quote');
      const services = this.cartServices.map(key => {
        const service = this.getServiceByKey(key);
        return `• ${service?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime)}`;
      }).join('\n');
      
      const addons = this.cartAddons.map(key => {
        const addon = this.addons.find(a => a.key === key);
        return `• ${addon?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime)}`;
      }).join('\n');
      
      const body = encodeURIComponent(
        `Hi,\n\nI'm interested in the following services:\n\n${services}${addons ? '\n\nAdd-ons:\n' + addons : ''}\n\nTotal: ${this.fmtUSD(this.total)}${this.plan === 'monthly' ? '/month' : ''}\n\n${this.quoteNote || ''}\n\nThanks!`
      );
      
      window.open(`mailto:${this.quoteEmail}?subject=${subject}&body=${body}`);
      this.closeQuote();
    },

    /* ---------- FIXED CHECKOUT ---------- */
    async proceedToCheckout(){
      try{
        if(this.isSubmitting) return;
        if(!this.cartServices.length){ 
          this.flash('Add at least one service to proceed.'); 
          return; 
        }
        if(!this.emailValid(this.contact.email)){ 
          this.flash('Please enter a valid email address.'); 
          return; 
        }

        // Build cart data for Stripe
        const cart = this.cartServices.map(svcKey => {
          const service = this.getServiceByKey(svcKey);
          const base = this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime;
          const addons = this.cartAddons
            .filter(addonKey => {
              const addon = this.addons.find(a => a.key === addonKey);
              return addon?.applicableServices?.includes(svcKey) || addon?.applicableServices?.includes('all');
            })
            .map(addonKey => {
              const addon = this.addons.find(a => a.key === addonKey);
              return { 
                id: addonKey, 
                name: addon?.name || addonKey, 
                price: this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime 
              };
            });
          return { 
            service: svcKey, 
            name: service?.name || svcKey,
            base: base || 0, 
            addons 
          };
        });

        const endpoint = document.querySelector('meta[name="checkout-endpoint"]')?.content || '/api/checkout';
        this.isSubmitting = true;

        const res = await fetch(endpoint, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ 
            plan: this.plan, 
            cart, 
            contact: { ...this.contact } 
          })
        });
        
        const out = await res.json().catch(()=> ({}));
        if(!res.ok){ 
          throw new Error(out?.error || `Checkout failed (${res.status})`); 
        }

        // Redirect to Stripe Checkout
        if(out?.url){ 
          location.assign(out.url); 
        }
        else if(out?.id && window.Stripe){
          const pk = document.querySelector('meta[name="stripe-publishable-key"]')?.content;
          const stripe = Stripe(pk);
          const { error } = await stripe.redirectToCheckout({ sessionId: out.id });
          if(error) throw error;
        }else{
          throw new Error('Checkout response missing URL');
        }
      }catch(e){
        console.error('Checkout error:', e);
        this.flash(e.message || 'Checkout failed. Please try again.');
        this.isSubmitting = false;
      }
    },

    sendQuote() {
      this.handleOpenEmailDraft();
    }
  };
}

// Make landingApp globally available
window.landingApp = landingApp;
