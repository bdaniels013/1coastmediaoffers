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

function landingApp(){
  return {
    // --- STATE ---
    year: new Date().getFullYear(),
    plan: 'oneTime',
    addonQuery: '',
    sortBy: 'popular',
    activeTab: 'signature',

    // Load service categories from external data
    serviceCategories: window.serviceData?.serviceCategories || {},
    bundles: window.serviceData?.bundles || [],

    // Cart state
    cartServices: [],
    cartAddons: [],
    builderOpen: false,
    addonsOpen: false,
    activeService: 'web',
    quoteOpen: false,
    quoteEmail: '',
    quoteFormat: 'pdf',
    quoteNote: '',
    quoteLink: '',
    isSubmitting: false,

    // Dependency modal state
    dependencyModalOpen: false,
    pendingService: null,
    missingDependencies: [],
    dependencyReason: '',

    // Methods
    init() {
      console.log('1CoastMedia app initialized');
    },

    setPlan(newPlan) {
      this.plan = newPlan;
    },

    // Enhanced toggleService with dependency checking
    toggleService(serviceKey) {
      if (this.cartServices.includes(serviceKey)) {
        // Removing service - check for dependents
        const dependents = this.getDependentServices(serviceKey);
        if (dependents.length > 0) {
          // Show warning about dependent services
          const dependentNames = dependents.map(key => this.getServiceByKey(key)?.name).join(', ');
          this.dependencyReason = `Removing this service will also remove: ${dependentNames}`;
          this.pendingService = serviceKey;
          this.missingDependencies = dependents;
          this.dependencyModalOpen = true;
          return;
        }
        // Safe to remove
        this.cartServices = this.cartServices.filter(key => key !== serviceKey);
      } else {
        // Adding service - check dependencies
        const service = this.getServiceByKey(serviceKey);
        if (service?.dependencies) {
          const missing = service.dependencies.filter(dep => !this.cartServices.includes(dep));
          if (missing.length > 0) {
            // Show dependency modal
            this.pendingService = serviceKey;
            this.missingDependencies = missing;
            this.dependencyReason = service.dependencyReason || 'This service requires additional services to function properly.';
            this.dependencyModalOpen = true;
            return;
          }
        }
        // Safe to add
        this.cartServices.push(serviceKey);
      }
    },

    // Add service with dependencies
    addWithDependencies() {
      if (this.pendingService) {
        // Add all missing dependencies first
        this.missingDependencies.forEach(dep => {
          if (!this.cartServices.includes(dep)) {
            this.cartServices.push(dep);
          }
        });
        // Add the main service
        this.cartServices.push(this.pendingService);
      }
      this.closeDependencyModal();
    },

    // Add service without dependencies (or remove with dependents)
    addWithoutDependencies() {
      if (this.pendingService) {
        if (this.cartServices.includes(this.pendingService)) {
          // Removing - also remove dependents
          this.cartServices = this.cartServices.filter(key => 
            key !== this.pendingService && !this.missingDependencies.includes(key)
          );
        } else {
          // Adding without dependencies (not recommended but allowed)
          this.cartServices.push(this.pendingService);
        }
      }
      this.closeDependencyModal();
    },

    // Close dependency modal
    closeDependencyModal() {
      this.dependencyModalOpen = false;
      this.pendingService = null;
      this.missingDependencies = [];
      this.dependencyReason = '';
      document.body.classList.remove('no-scroll');
    },

    // Get service by key from all categories
    getServiceByKey(serviceKey) {
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services.find(s => s.key === serviceKey);
        if (service) return service;
      }
      return null;
    },

    // Get services that depend on a given service
    getDependentServices(serviceKey) {
      const dependents = [];
      for (const category of Object.values(this.serviceCategories)) {
        for (const service of category.services) {
          if (service.dependencies && service.dependencies.includes(serviceKey) && this.cartServices.includes(service.key)) {
            dependents.push(service.key);
          }
        }
      }
      return dependents;
    },

    // Get dependency total cost
    getDependencyTotal() {
      let total = 0;
      this.missingDependencies.forEach(key => {
        const service = this.getServiceByKey(key);
        if (service && service.price[this.plan]) {
          total += service.price[this.plan];
        }
      });
      return total;
    },

    clearAll() {
      this.cartServices = [];
      this.cartAddons = [];
    },

    openBuilder() {
      this.builderOpen = true;
      document.body.classList.add('no-scroll');
    },

    closeBuilder() {
      this.builderOpen = false;
      document.body.classList.remove('no-scroll');
    },

    openAddons(serviceKey) {
      this.activeService = serviceKey;
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

    fmtUSD(amount) {
      if (typeof amount !== 'number') return '$0';
      // Handle dollar amounts directly (not cents)
      return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    },

    getOneTimeTotal() {
      let total = 0;
      this.cartServices.forEach(serviceKey => {
        // Find service in all categories
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services.find(s => s.key === serviceKey);
          if (service && service.price.oneTime) {
            total += service.price.oneTime;
            break;
          }
        }
      });
      return total;
    },

    getMonthlyTotal() {
      let total = 0;
      this.cartServices.forEach(serviceKey => {
        // Find service in all categories
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services.find(s => s.key === serviceKey);
          if (service && service.price.monthly) {
            total += service.price.monthly;
            break;
          }
        }
      });
      return total;
    },

    getMinTermsInfo() {
      const terms = [];
      this.cartServices.forEach(serviceKey => {
        for (const category of Object.values(this.serviceCategories)) {
          const service = category.services.find(s => s.key === serviceKey);
          if (service && service.minTerm) {
            terms.push(service.minTerm);
            break;
          }
        }
      });
      return terms.length > 0 ? terms.join(', ') : null;
    },

    get total() {
      return this.plan === 'oneTime' ? this.getOneTimeTotal() : this.getMonthlyTotal();
    },

    downloadQuoteFile() {
      console.log('Downloading quote as', this.quoteFormat);
      // Implementation for PDF/DOCX generation
    },

    handleOpenEmailDraft() {
      const subject = encodeURIComponent('1CoastMedia Service Quote');
      const body = encodeURIComponent(`Hi,\n\nPlease find my service quote below:\n\n${this.quoteNote}\n\nTotal: ${this.fmtUSD(this.total)}\n\nThanks!`);
      window.open(`mailto:${this.quoteEmail}?subject=${subject}&body=${body}`);
    }
  };
}

// Make landingApp globally available
window.landingApp = landingApp;


toggleAddon(addonKey) {
  const index = this.cartAddons.indexOf(addonKey);
  if (index > -1) {
    this.cartAddons.splice(index, 1);
  } else {
    this.cartAddons.push(addonKey);
  }
  this.save();
},

proceedToCheckout() {
  // Implement Stripe checkout logic
  console.log('Proceeding to checkout with:', {
    services: this.cartServices,
    addons: this.cartAddons,
    plan: this.plan,
    total: this.total
  });
  // Add actual Stripe integration here
},

sendQuote() {
  const subject = encodeURIComponent('1CoastMedia Service Quote');
  const body = encodeURIComponent(`Hi,\n\nHere's my service quote:\n\nServices: ${this.cartServices.length}\nAdd-ons: ${this.cartAddons.length}\nTotal: ${this.fmtUSD(this.total)}${this.plan === 'monthly' ? '/month' : ''}\n\n${this.quoteNote || ''}\n\nThanks!`);
  window.open(`mailto:${this.quoteEmail}?subject=${subject}&body=${body}`);
  this.closeQuote();
},
