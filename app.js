// app.js - Enhanced implementation with comprehensive fixes
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

/* Enhanced lead posting with better error handling */
async function postLead(payload){
  const endpoints = ['/api/forms/lead', '/api/forms/leads'];
  
  for (const endpoint of endpoints) {
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (r.ok) return { success: true, endpoint };
    } catch (error) {
      console.warn(`Failed to post to ${endpoint}:`, error);
    }
  }
  return { success: false };
}

function landingApp(){
  return {
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',
    activeTab: 'signature',
    
    // Add-ons modal state
    addonSearch: '',
    addonFilter: 'all', 
    addonSort: 'price-asc',

    // Service data from services.js
    serviceCategories: window.serviceData?.serviceCategories || {},
    bundles: window.serviceData?.bundles || [],
    addons: window.serviceData?.addons || [],

    // Enhanced cart state
    cartServices: [],
    cartAddons: [],
    cartBundles: [],
    
    // Modal states
    builderOpen: false,
    addonsOpen: false,
    quoteOpen: false,
    dependencyModalOpen: false,
    bundleModalOpen: false,
    checkoutModalOpen: false,

    // ADD MISSING VARIABLES HERE:
    bundlesOpen: false,
    bundleQuery: '',
    dependencyReason: '',
    missingDependencies: [],
    
    // Enhanced contact form with validation
    contact: { 
      name: '', 
      email: '', 
      company: '', 
      phone: '', 
      notes: '',
      preferredContact: 'email',
      timeline: 'asap'
    },
    contactErrors: {},
    quoteEmail: '',
    quoteNote: '',
    
    // Enhanced UI state
    stickyCta: false,
    toast: { show: false, text: '', type: 'info' },
    isSubmitting: false,
    openDescs: {},
    loading: false,
    
    // Dependencies and bundles
    dependencyService: null,
    dependentServices: [],
    selectedBundle: null,
    
    // Animation states
    animatingItems: new Set(),
    
    // Checkout state
    checkoutStep: 'review', // review, contact, payment
    paymentMethod: 'stripe',
    agreedToTerms: false,

    /* ---------- Enhanced Lifecycle ---------- */
    async init(){
      // Expose Alpine instance
      window.App = this;

      // Restore saved cart with validation
      try{
        const saved = JSON.parse(localStorage.getItem('coast_cart')||'{}');
        this.hydrateFromSaved(saved);
      }catch(e){
        console.warn('Failed to restore cart:', e);
      }

      // Enhanced URL quote handling
      const q = new URLSearchParams(location.search).get('quote');
      if (q) {
        const decoded = decodeQuote(q);
        if (decoded?.cart) {
          this.hydrateFromSaved(decoded.cart);
          this.flash('Quote loaded successfully!', 'success');
        }
      }

      // Enhanced sticky CTA with smooth transitions
      const onScroll = () => { 
        const shouldShow = window.scrollY > 640;
        if (shouldShow !== this.stickyCta) {
          this.stickyCta = shouldShow;
        }
      };
      onScroll(); 
      window.addEventListener('scroll', onScroll, { passive: true });
      
      // Initialize tooltips and animations
      this.initializeAnimations();
    },
    
    initializeAnimations() {
      // Add entrance animations for service cards
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      }, { threshold: 0.1 });
      
      // Observe service cards when they're added to DOM
      setTimeout(() => {
        document.querySelectorAll('.service-card, .addon-card, .bundle-card').forEach(card => {
          observer.observe(card);
        });
      }, 100);
    },

    /* ---------- Enhanced Computeds ---------- */
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
      
      // Calculate bundle totals with discounts
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.bundles.find(b => b.key === bundleKey);
        if (bundle) {
          oneTimeTotal += bundle.price.oneTime || 0;
          monthlyTotal += bundle.price.monthly || 0;
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
    
    get totalSavings() {
      let savings = 0;
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.bundles.find(b => b.key === bundleKey);
        if (bundle?.originalPrice) {
          const bundlePrice = this.plan === 'monthly' ? bundle.price.monthly : bundle.price.oneTime;
          const originalPrice = this.plan === 'monthly' ? bundle.originalPrice.monthly : bundle.originalPrice.oneTime;
          savings += (originalPrice - bundlePrice);
        }
      });
      return savings;
    },

    get visibleAddons(){
      return this.addons.filter(addon => {
        if (!this.addonQuery) return true;
        const query = this.addonQuery.toLowerCase();
        return addon.name.toLowerCase().includes(query) || 
               addon.description.toLowerCase().includes(query) ||
               addon.tags?.some(tag => tag.toLowerCase().includes(query));
      });
    },

    get visibleBundles() {
      if (!this.bundleQuery.trim()) {
        return this.bundles;
      }
      const query = this.bundleQuery.toLowerCase();
      return this.bundles.filter(bundle => 
        bundle.name.toLowerCase().includes(query) ||
        bundle.description.toLowerCase().includes(query)
      );
    },
    
    get cartItemCount() {
      return this.cartServices.length + this.cartBundles.length + this.cartAddons.length;
    },
    
    get isCartEmpty() {
      return this.cartItemCount === 0;
    },
    
    get canProceedToCheckout() {
      return !this.isCartEmpty && this.emailValid(this.contact.email) && this.contact.name.trim();
    },

    /* ---------- Enhanced Helpers ---------- */
    fmtUSD(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);
    },

    emailValid(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
    },
    
    phoneValid(phone) {
      return /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/.test(phone || '');
    },
    
    validateContact() {
      const errors = {};
      
      if (!this.contact.name.trim()) errors.name = 'Name is required';
      if (!this.emailValid(this.contact.email)) errors.email = 'Valid email is required';
      if (this.contact.phone && !this.phoneValid(this.contact.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
      
      this.contactErrors = errors;
      return Object.keys(errors).length === 0;
    },

    getServiceByKey(key) {
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === key);
        if (service) return service;
      }
      return null;
    },
    
    getBundleByKey(key) {
      return this.bundles.find(b => b.key === key);
    },
    
    getAddonByKey(key) {
      return this.addons.find(a => a.key === key);
    },

    getCartSnapshot(){
      return {
        services: this.cartServices.slice(),
        addons: this.cartAddons.slice(),
        bundles: this.cartBundles.slice(),
        plan: this.plan,
        contact: { ...this.contact }
      };
    },

    hydrateFromSaved(saved){
      if(!saved) return;
      if(Array.isArray(saved.services)) this.cartServices = [...new Set(saved.services)];
      if(Array.isArray(saved.addons)) this.cartAddons = [...new Set(saved.addons)];
      if(Array.isArray(saved.bundles)) this.cartBundles = [...new Set(saved.bundles)];
      if(saved.plan && ['oneTime', 'monthly'].includes(saved.plan)) this.plan = saved.plan;
      if(saved.contact) this.contact = { ...this.contact, ...saved.contact };
      this.save();
    },

    save() {
      try {
        localStorage.setItem('coast_cart', JSON.stringify(this.getCartSnapshot()));
      } catch (e) {
        console.warn('Failed to save cart:', e);
      }
    },

    flash(text, type = 'info') {
      this.toast = { text, type, show: true };
      setTimeout(() => this.toast.show = false, type === 'error' ? 5000 : 3000);
    },
    
    animateItem(element, animation = 'pulse') {
      if (!element) return;
      element.classList.add(`animate-${animation}`);
      setTimeout(() => element.classList.remove(`animate-${animation}`), 600);
    },

    /* ---------- Enhanced Service Management ---------- */
    setPlan(plan) {
      if (['oneTime', 'monthly'].includes(plan)) {
        this.plan = plan;
        this.save();
        this.flash(`Switched to ${plan === 'oneTime' ? 'one-time' : 'monthly'} pricing`, 'success');
      }
    },

    toggleService(serviceKey, element = null) {
      const index = this.cartServices.indexOf(serviceKey);
      const service = this.getServiceByKey(serviceKey);
      
      if (index > -1) {
        this.cartServices.splice(index, 1);
        // Remove related addons
        this.cartAddons = this.cartAddons.filter(addonKey => {
          const addon = this.addons.find(a => a.key === addonKey);
          return !addon?.applicableServices?.includes(serviceKey);
        });
        this.flash(`Removed ${service?.name || serviceKey}`, 'info');
      } else {
        this.cartServices.push(serviceKey);
        this.flash(`Added ${service?.name || serviceKey}`, 'success');
      }
      
      if (element) this.animateItem(element);
      this.save();
    },
    
    /* ---------- Enhanced Bundle Management ---------- */
    toggleBundle(bundleKey, element = null) {
      const index = this.cartBundles.indexOf(bundleKey);
      const bundle = this.getBundleByKey(bundleKey);
      
      if (index > -1) {
        this.cartBundles.splice(index, 1);
        this.flash(`Removed ${bundle?.name || bundleKey}`, 'info');
      } else {
        this.cartBundles.push(bundleKey);
        this.flash(`Added ${bundle?.name || bundleKey}`, 'success');
        
        // Show savings if applicable
        if (bundle?.originalPrice) {
          const savings = this.plan === 'monthly' 
            ? bundle.originalPrice.monthly - bundle.price.monthly
            : bundle.originalPrice.oneTime - bundle.price.oneTime;
          if (savings > 0) {
            setTimeout(() => this.flash(`You saved ${this.fmtUSD(savings)}!`, 'success'), 1000);
          }
        }
      }
      
      if (element) this.animateItem(element);
      this.save();
    },
    
    openBundleModal(bundle) {
      this.selectedBundle = bundle;
      this.bundleModalOpen = true;
      document.body.classList.add('no-scroll');
    },
    
    closeBundleModal() {
      this.bundleModalOpen = false;
      this.selectedBundle = null;
      document.body.classList.remove('no-scroll');
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
        const service = this.getServiceByKey(serviceKey);
        this.flash(`Added ${service?.name || serviceKey}`, 'success');
      }
      this.closeDependencyModal();
    },

    getDependentServices(serviceKey) {
      // Enhanced dependency logic
      const service = this.getServiceByKey(serviceKey);
      if (!service?.dependencies) return [];
      
      return service.dependencies.map(depKey => this.getServiceByKey(depKey)).filter(Boolean);
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

    /* ---------- Enhanced Cart Management ---------- */
    getOneTimeTotal() {
      let total = 0;
      
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price.oneTime || 0;
      });
      
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) total += bundle.price.oneTime || 0;
      });
      
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
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
      
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) total += bundle.price.monthly || 0;
      });
      
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) total += addon.price.monthly || 0;
      });
      
      return total;
    },

    getMinTermsInfo() {
      const terms = [];
      
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service?.minTerm) terms.push(`${service.name}: ${service.minTerm}`);
      });
      
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle?.minTerm) terms.push(`${bundle.name}: ${bundle.minTerm}`);
      });
      
      return terms.length > 0 ? terms : null;
    },

    clearAll() {
      this.cartServices = [];
      this.cartAddons = [];
      this.cartBundles = [];
      this.save();
      this.flash('Cart cleared', 'info');
    },
    
    removeCartItem(type, key) {
      switch(type) {
        case 'service':
          this.toggleService(key);
          break;
        case 'bundle':
          this.toggleBundle(key);
          break;
        case 'addon':
          this.toggleAddon(key);
          break;
      }
    },

    /* ---------- Enhanced Modal Management ---------- */
    openBuilder() {
      // If cart has items, this should be checkout, not builder
      if (!this.isCartEmpty) {
        this.openCheckoutModal();
        return;
      }
      // If cart is empty and this was a checkout attempt, show helpful message
      if (event && event.target && event.target.textContent.includes('Checkout')) {
        this.flash('Please select some services first, then click Review & Checkout', 'info');
      }
      // Otherwise, open the builder as normal
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
    
    openCheckoutModal() {
      if (this.isCartEmpty) {
        this.flash('Add items to your cart first', 'error');
        return;
      }
      this.checkoutModalOpen = true;
      this.checkoutStep = 'review';
      document.body.classList.add('no-scroll');
    },
    
    closeCheckoutModal() {
      this.checkoutModalOpen = false;
      this.checkoutStep = 'review';
      document.body.classList.remove('no-scroll');
    },
    
    nextCheckoutStep() {
      if (this.checkoutStep === 'review') {
        this.checkoutStep = 'contact';
      } else if (this.checkoutStep === 'contact') {
        if (this.validateContact()) {
          this.checkoutStep = 'payment';
        }
      }
    },
    
    prevCheckoutStep() {
      if (this.checkoutStep === 'payment') {
        this.checkoutStep = 'contact';
      } else if (this.checkoutStep === 'contact') {
        this.checkoutStep = 'review';
      }
    },

    /* ---------- Add-ons Modal Functions ---------- */
    addonSearch: '',
    addonFilter: 'all',
    addonSort: 'price-asc',
    
    getFilteredAddons() {
      let filtered = this.addons.slice();
      
      // Apply search filter
      if (this.addonSearch.trim()) {
        const query = this.addonSearch.toLowerCase();
        filtered = filtered.filter(addon => 
          addon.name.toLowerCase().includes(query) ||
          addon.description.toLowerCase().includes(query) ||
          (addon.tags && addon.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      
      // Apply category filter
      if (this.addonFilter !== 'all') {
        filtered = filtered.filter(addon => 
          addon.applicableServices && addon.applicableServices.includes(this.addonFilter)
        );
      }
      
      // Apply sorting
      if (this.addonSort === 'price-asc') {
        filtered.sort((a, b) => (a.price.oneTime || 0) - (b.price.oneTime || 0));
      } else if (this.addonSort === 'price-desc') {
        filtered.sort((a, b) => (b.price.oneTime || 0) - (a.price.oneTime || 0));
      } else if (this.addonSort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return filtered;
    },
    
    getAddonsTotal() {
      return this.cartAddons.reduce((total, addonKey) => {
        const addon = this.addons.find(a => a.key === addonKey);
        if (addon) {
          return total + (this.plan === 'monthly' ? addon.price.monthly || 0 : addon.price.oneTime || 0);
        }
        return total;
      }, 0);
    },
    
    getCartTotal() {
      return this.total; // This already exists and calculates the full cart total
    },
    
    /* ---------- Enhanced Add-ons ---------- */
    toggleAddon(addonKey, element = null) {
      const index = this.cartAddons.indexOf(addonKey);
      const addon = this.getAddonByKey(addonKey);
      
      if (index > -1) {
        this.cartAddons.splice(index, 1);
        this.flash(`Removed ${addon?.name || addonKey}`, 'info');
      } else {
        // Check if addon is applicable to current cart
        const hasApplicableService = addon?.applicableServices?.some(serviceKey => 
          serviceKey === 'all' || 
          this.cartServices.includes(serviceKey) || 
          this.cartBundles.some(bundleKey => {
            const bundle = this.getBundleByKey(bundleKey);
            return bundle?.services?.includes(serviceKey);
          })
        );
        
        if (!hasApplicableService && addon?.applicableServices?.length > 0) {
          this.flash('This add-on requires specific services in your cart', 'error');
          return;
        }
        
        this.cartAddons.push(addonKey);
        this.flash(`Added ${addon?.name || addonKey}`, 'success');
      }
      
      if (element) this.animateItem(element);
      this.save();
    },
    
    getApplicableAddons() {
      return this.addons.filter(addon => {
        if (!addon.applicableServices || addon.applicableServices.includes('all')) {
          return true;
        }
        
        return addon.applicableServices.some(serviceKey => 
          this.cartServices.includes(serviceKey) ||
          this.cartBundles.some(bundleKey => {
            const bundle = this.getBundleByKey(bundleKey);
            return bundle?.services?.includes(serviceKey);
          })
        );
      });
    },

    /* ---------- Enhanced Quote Management ---------- */
    generateQuoteLink(){
      const code = encodeQuote({ 
        v: 3, 
        cart: this.getCartSnapshot(), 
        ts: Date.now(),
        metadata: {
          total: this.total,
          plan: this.plan,
          savings: this.totalSavings
        }
      });
      const url = new URL(location.href);
      url.searchParams.set('quote', code);
      return url.toString();
    },

    downloadQuoteFile() {
      const quoteData = {
        timestamp: new Date().toISOString(),
        plan: this.plan,
        contact: this.contact,
        services: this.cartServices.map(key => {
          const service = this.getServiceByKey(key);
          return {
            key,
            name: service?.name || key,
            description: service?.description,
            price: this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime,
            deliverables: service?.deliverables
          };
        }),
        bundles: this.cartBundles.map(key => {
          const bundle = this.getBundleByKey(key);
          return {
            key,
            name: bundle?.name || key,
            description: bundle?.description,
            price: this.plan === 'monthly' ? bundle?.price.monthly : bundle?.price.oneTime,
            services: bundle?.services,
            savings: bundle?.originalPrice ? 
              (this.plan === 'monthly' ? bundle.originalPrice.monthly - bundle.price.monthly : bundle.originalPrice.oneTime - bundle.price.oneTime) : 0
          };
        }),
        addons: this.cartAddons.map(key => {
          const addon = this.getAddonByKey(key);
          return {
            key,
            name: addon?.name || key,
            description: addon?.description,
            price: this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime
          };
        }),
        totals: {
          subtotal: this.total,
          savings: this.totalSavings,
          final: this.total
        }
      };
      
      const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1coastmedia-quote-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.flash('Quote downloaded successfully', 'success');
    },

    handleOpenEmailDraft() {
      if (!this.quoteEmail || !this.emailValid(this.quoteEmail)) {
        this.flash('Please enter a valid email address', 'error');
        return;
      }
      
      const subject = encodeURIComponent('1Coast Media Service Quote Request');
      
      const services = this.cartServices.map(key => {
        const service = this.getServiceByKey(key);
        return `• ${service?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime)}`;
      }).join('\n');
      
      const bundles = this.cartBundles.map(key => {
        const bundle = this.getBundleByKey(key);
        const price = this.fmtUSD(this.plan === 'monthly' ? bundle?.price.monthly : bundle?.price.oneTime);
        const savings = bundle?.originalPrice ? 
          this.fmtUSD(this.plan === 'monthly' ? bundle.originalPrice.monthly - bundle.price.monthly : bundle.originalPrice.oneTime - bundle.price.oneTime) : '';
        return `• ${bundle?.name || key}: ${price}${savings ? ` (Save ${savings})` : ''}`;
      }).join('\n');
      
      const addons = this.cartAddons.map(key => {
        const addon = this.getAddonByKey(key);
        return `• ${addon?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime)}`;
      }).join('\n');
      
      let body = `Hi,\n\nI'm interested in the following services from 1Coast Media:\n\n`;
      
      if (services) body += `Services:\n${services}\n\n`;
      if (bundles) body += `Bundles:\n${bundles}\n\n`;
      if (addons) body += `Add-ons:\n${addons}\n\n`;
      
      body += `Total: ${this.fmtUSD(this.total)}${this.plan === 'monthly' ? '/month' : ''}`;
      
      if (this.totalSavings > 0) {
        body += `\nTotal Savings: ${this.fmtUSD(this.totalSavings)}`;
      }
      
      if (this.quoteNote) {
        body += `\n\nAdditional Notes:\n${this.quoteNote}`;
      }
      
      body += `\n\nPlease let me know the next steps.\n\nThanks!`;
      
      window.open(`mailto:${this.quoteEmail}?subject=${subject}&body=${encodeURIComponent(body)}`);
      this.closeQuote();
      this.flash('Email draft opened', 'success');
    },

    /* ---------- ENHANCED CHECKOUT SYSTEM ---------- */
    // Update the proceedToCheckout function around line 732
    async proceedToCheckout(){
    // If checkout modal is not open, open it first
    if (!this.checkoutModalOpen) {
    this.openCheckoutModal();
    return;
    }
    
    // If we're in contact step, validate and move to payment
    if (this.checkoutStep === 'contact') {
    if (!this.contact.name || !this.contact.email || !this.contact.phone || !this.agreedToTerms) {
    this.flash('Please fill in all required fields and agree to terms.', 'error');
    return;
    }
    this.checkoutStep = 'payment';
    // Continue with payment processing below
    }
    
    if (this.validateContact()) {
      this.checkoutStep = 'payment';
    }
    },
    
    prevCheckoutStep() {
      if (this.checkoutStep === 'payment') {
        this.checkoutStep = 'contact';
      } else if (this.checkoutStep === 'contact') {
        this.checkoutStep = 'review';
      }
    },

    /* ---------- Enhanced Add-ons ---------- */
    toggleAddon(addonKey, element = null) {
      const index = this.cartAddons.indexOf(addonKey);
      const addon = this.getAddonByKey(addonKey);
      
      if (index > -1) {
        this.cartAddons.splice(index, 1);
        this.flash(`Removed ${addon?.name || addonKey}`, 'info');
      } else {
        // Check if addon is applicable to current cart
        const hasApplicableService = addon?.applicableServices?.some(serviceKey => 
          serviceKey === 'all' || 
          this.cartServices.includes(serviceKey) || 
          this.cartBundles.some(bundleKey => {
            const bundle = this.getBundleByKey(bundleKey);
            return bundle?.services?.includes(serviceKey);
          })
        );
        
        if (!hasApplicableService && addon?.applicableServices?.length > 0) {
          this.flash('This add-on requires specific services in your cart', 'error');
          return;
        }
        
        this.cartAddons.push(addonKey);
        this.flash(`Added ${addon?.name || addonKey}`, 'success');
      }
      
      if (element) this.animateItem(element);
      this.save();
    },
    
    getApplicableAddons() {
      return this.addons.filter(addon => {
        if (!addon.applicableServices || addon.applicableServices.includes('all')) {
          return true;
        }
        
        return addon.applicableServices.some(serviceKey => 
          this.cartServices.includes(serviceKey) ||
          this.cartBundles.some(bundleKey => {
            const bundle = this.getBundleByKey(bundleKey);
            return bundle?.services?.includes(serviceKey);
          })
        );
      });
    },

    /* ---------- Enhanced Quote Management ---------- */
    generateQuoteLink(){
      const code = encodeQuote({ 
        v: 3, 
        cart: this.getCartSnapshot(), 
        ts: Date.now(),
        metadata: {
          total: this.total,
          plan: this.plan,
          savings: this.totalSavings
        }
      });
      const url = new URL(location.href);
      url.searchParams.set('quote', code);
      return url.toString();
    },

    downloadQuoteFile() {
      const quoteData = {
        timestamp: new Date().toISOString(),
        plan: this.plan,
        contact: this.contact,
        services: this.cartServices.map(key => {
          const service = this.getServiceByKey(key);
          return {
            key,
            name: service?.name || key,
            description: service?.description,
            price: this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime,
            deliverables: service?.deliverables
          };
        }),
        bundles: this.cartBundles.map(key => {
          const bundle = this.getBundleByKey(key);
          return {
            key,
            name: bundle?.name || key,
            description: bundle?.description,
            price: this.plan === 'monthly' ? bundle?.price.monthly : bundle?.price.oneTime,
            services: bundle?.services,
            savings: bundle?.originalPrice ? 
              (this.plan === 'monthly' ? bundle.originalPrice.monthly - bundle.price.monthly : bundle.originalPrice.oneTime - bundle.price.oneTime) : 0
          };
        }),
        addons: this.cartAddons.map(key => {
          const addon = this.getAddonByKey(key);
          return {
            key,
            name: addon?.name || key,
            description: addon?.description,
            price: this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime
          };
        }),
        totals: {
          subtotal: this.total,
          savings: this.totalSavings,
          final: this.total
        }
      };
      
      const blob = new Blob([JSON.stringify(quoteData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `1coastmedia-quote-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.flash('Quote downloaded successfully', 'success');
    },

    handleOpenEmailDraft() {
      if (!this.quoteEmail || !this.emailValid(this.quoteEmail)) {
        this.flash('Please enter a valid email address', 'error');
        return;
      }
      
      const subject = encodeURIComponent('1Coast Media Service Quote Request');
      
      const services = this.cartServices.map(key => {
        const service = this.getServiceByKey(key);
        return `• ${service?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime)}`;
      }).join('\n');
      
      const bundles = this.cartBundles.map(key => {
        const bundle = this.getBundleByKey(key);
        const price = this.fmtUSD(this.plan === 'monthly' ? bundle?.price.monthly : bundle?.price.oneTime);
        const savings = bundle?.originalPrice ? 
          this.fmtUSD(this.plan === 'monthly' ? bundle.originalPrice.monthly - bundle.price.monthly : bundle.originalPrice.oneTime - bundle.price.oneTime) : '';
        return `• ${bundle?.name || key}: ${price}${savings ? ` (Save ${savings})` : ''}`;
      }).join('\n');
      
      const addons = this.cartAddons.map(key => {
        const addon = this.getAddonByKey(key);
        return `• ${addon?.name || key}: ${this.fmtUSD(this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime)}`;
      }).join('\n');
      
      let body = `Hi,\n\nI'm interested in the following services from 1Coast Media:\n\n`;
      
      if (services) body += `Services:\n${services}\n\n`;
      if (bundles) body += `Bundles:\n${bundles}\n\n`;
      if (addons) body += `Add-ons:\n${addons}\n\n`;
      
      body += `Total: ${this.fmtUSD(this.total)}${this.plan === 'monthly' ? '/month' : ''}`;
      
      if (this.totalSavings > 0) {
        body += `\nTotal Savings: ${this.fmtUSD(this.totalSavings)}`;
      }
      
      if (this.quoteNote) {
        body += `\n\nAdditional Notes:\n${this.quoteNote}`;
      }
      
      body += `\n\nPlease let me know the next steps.\n\nThanks!`;
      
      window.open(`mailto:${this.quoteEmail}?subject=${subject}&body=${encodeURIComponent(body)}`);
      this.closeQuote();
      this.flash('Email draft opened', 'success');
    },

    /* ---------- ENHANCED CHECKOUT SYSTEM ---------- */
    async proceedToCheckout(){
      // If checkout modal is not open, open it first
      if (!this.checkoutModalOpen) {
        this.openCheckoutModal();
        return;
      }
      
      // If we're in contact step, validate and move to payment
      if (this.checkoutStep === 'contact') {
        if (!this.contact.name || !this.contact.email || !this.contact.phone || !this.agreedToTerms) {
          this.flash('Please fill in all required fields and agree to terms.', 'error');
          return;
        }
        this.checkoutStep = 'payment';
        // Continue with payment processing below
      }

      try{
        if(this.isSubmitting) return;
        
        // Enhanced validation
        if(this.isCartEmpty){ 
          this.flash('Add at least one service or bundle to proceed.', 'error'); 
          return; 
        }
        
        if(!this.validateContact()){ 
          this.flash('Please fill in all required contact information.', 'error'); 
          return; 
        }
        
        if(!this.agreedToTerms) {
          this.flash('Please agree to the terms and conditions.', 'error');
          return;
        }

        this.isSubmitting = true;
        this.loading = true;
        
        // Build enhanced cart data for Stripe
        const cartData = {
          services: this.cartServices.map(svcKey => {
            const service = this.getServiceByKey(svcKey);
            return {
              id: svcKey,
              name: service?.name || svcKey,
              description: service?.description,
              price: this.plan === 'monthly' ? service?.price.monthly : service?.price.oneTime,
              type: 'service',
              category: service?.category
            };
          }),
          bundles: this.cartBundles.map(bundleKey => {
            const bundle = this.getBundleByKey(bundleKey);
            return {
              id: bundleKey,
              name: bundle?.name || bundleKey,
              description: bundle?.description,
              price: this.plan === 'monthly' ? bundle?.price.monthly : bundle?.price.oneTime,
              originalPrice: bundle?.originalPrice ? 
                (this.plan === 'monthly' ? bundle.originalPrice.monthly : bundle.originalPrice.oneTime) : null,
              type: 'bundle',
              services: bundle?.services || []
            };
          }),
          addons: this.cartAddons.map(addonKey => {
            const addon = this.getAddonByKey(addonKey);
            return {
              id: addonKey,
              name: addon?.name || addonKey,
              description: addon?.description,
              price: this.plan === 'monthly' ? addon?.price.monthly : addon?.price.oneTime,
              type: 'addon',
              applicableServices: addon?.applicableServices
            };
          })
        };

        const payload = {
          plan: this.plan,
          cart: cartData,
          contact: { ...this.contact },
          totals: {
            subtotal: this.total,
            savings: this.totalSavings,
            final: this.total
          },
          metadata: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            paymentMethod: this.paymentMethod
          }
        };

        const endpoint = document.querySelector('meta[name="checkout-endpoint"]')?.content || '/api/checkout';
        
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });
        
        const result = await res.json().catch(() => ({}));
        
        if (!res.ok) { 
          throw new Error(result?.error || `Checkout failed (${res.status}): ${res.statusText}`); 
        }

        // Enhanced Stripe integration
        if (result?.url) { 
          // Direct redirect URL
          this.flash('Redirecting to secure checkout...', 'success');
          setTimeout(() => location.assign(result.url), 1000);
        } else if (result?.sessionId && window.Stripe) {
          // Stripe Checkout Session
          const pk = document.querySelector('meta[name="stripe-publishable-key"]')?.content;
          if (!pk) throw new Error('Stripe publishable key not found');
          
          const stripe = Stripe(pk);
          this.flash('Redirecting to secure checkout...', 'success');
          
          const { error } = await stripe.redirectToCheckout({ sessionId: result.sessionId });
          if (error) throw error;
        } else {
          throw new Error('Invalid checkout response: missing URL or session ID');
        }
        
        // Clear cart on successful checkout initiation
        this.clearAll();
        
      } catch(e) {
        console.error('Checkout error:', e);
        this.flash(e.message || 'Checkout failed. Please try again.', 'error');
      } finally {
        this.isSubmitting = false;
        this.loading = false;
      }
    },
    
    // Quick checkout for single items
    async quickCheckout(type, key) {
      this.clearAll();
      
      switch(type) {
        case 'service':
          this.toggleService(key);
          break;
        case 'bundle':
          this.toggleBundle(key);
          break;
        case 'addon':
          this.toggleAddon(key);
          break;
      }
      
      this.openCheckoutModal();
    },

    sendQuote() {
      this.handleOpenEmailDraft();
    },
    
    /* ---------- Enhanced Analytics & Tracking ---------- */
    trackEvent(event, data = {}) {
      // Enhanced analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', event, {
          event_category: 'ecommerce',
          ...data
        });
      }
      
      if (typeof fbq !== 'undefined') {
        fbq('track', event, data);
      }
      
      // Custom analytics
      if (window.analytics) {
        window.analytics.track(event, data);
      }
    },
    
    trackCartAction(action, item) {
      this.trackEvent('cart_action', {
        action,
        item_name: item.name,
        item_id: item.key,
        item_category: item.type,
        value: this.plan === 'monthly' ? item.price?.monthly : item.price?.oneTime
      });
    },
    
    trackCheckoutStep(step) {
      this.trackEvent('checkout_progress', {
        checkout_step: step,
        cart_value: this.total,
        items_count: this.cartItemCount
      });
    }
  };
}

// Make landingApp globally available
window.landingApp = landingApp;

// Enhanced error handling
window.addEventListener('error', (e) => {
  console.error('Application error:', e.error);
  if (window.App) {
    window.App.flash('An unexpected error occurred. Please refresh the page.', 'error');
  }
});

// Enhanced performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('Page load performance:', {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart
      });
    }, 0);
  });
}
