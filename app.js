// 1CoastMedia Landing Page Application
// Clean Alpine.js implementation with working checkout modal

// Global utility functions
function fmtUSD(amount) {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Global functions for onclick handlers
// Global functions for modal control
window.openCheckoutModal = function() {
    console.log('Opening checkout modal');
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.hidden = false;
        modal.style.display = 'block';
        console.log('Modal opened successfully');
    } else {
        console.error('Modal element not found');
    }
};

window.closeCheckoutModal = function() {
    console.log('Closing checkout modal');
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
        console.log('Modal closed successfully');
    }
};

// Update the Alpine.js functions to use the global functions
openCheckoutModal() {
    window.openCheckoutModal();
    // Keep Alpine.js state in sync
    this.checkoutModalOpen = true;
},

closeCheckoutModal() {
    window.closeCheckoutModal();
    // Keep Alpine.js state in sync
    this.checkoutModalOpen = false;
},

window.closeCheckoutModal = function() {
  const app = window.Alpine?.store?.() || document.querySelector('[x-data]')?.__x?.$data;
  if (app && app.closeCheckoutModal) {
    app.closeCheckoutModal();
  } else {
    // Fallback direct manipulation
    const modal = document.getElementById('checkout-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
};

// Main Alpine.js application
function landingApp() {
  return {
    // State variables
    year: new Date().getFullYear(),
    plan: 'oneTime',
    activeTab: 'signature',
    checkoutModalOpen: false,
    showAddonsModal: false,
    showMessage: false,
    messageType: 'success',
    messageText: '',
    
    // Cart state
    cartServices: [],
    cartBundles: [],
    cartAddons: [],
    
    // Addon modal state
    activeAddonService: '',
    addonSearchQuery: '',
    addonSortBy: 'popular',
    
    // Data references - initialize as empty, will be populated in init()
    serviceCategories: {},
    bundles: [],
    addons: [],
    
    // Initialization
    init() {
      console.log('🚀 1CoastMedia app initialized');
      
      // Load data after DOM is ready
      this.serviceCategories = window.serviceData?.serviceCategories || {};
      this.bundles = window.serviceData?.bundles || [];
      this.addons = window.serviceData?.addons || [];
      
      this.validateData();
      this.setupGlobalFunctions();
      
      // Debug log to verify data is loaded
      console.log('📊 Service categories loaded:', Object.keys(this.serviceCategories));
    },
    
    // Validate that service data is loaded
    validateData() {
      if (!window.serviceData) {
        console.error('❌ Service data not loaded');
        this.showNotification('error', 'Service data failed to load. Please refresh the page.');
        return false;
      }
      console.log('✅ Service data loaded successfully');
      return true;
    },
    
    // Setup global functions for external access
    setupGlobalFunctions() {
      window.openCheckoutModal = () => this.openCheckoutModal();
      window.closeCheckoutModal = () => this.closeCheckoutModal();
      window.openBuilder = () => this.openCheckoutModal();
      window.testCheckout = () => this.testCheckout();
    },
    
    // Plan management
    setPlan(newPlan) {
      this.plan = newPlan;
      console.log(`📋 Plan changed to: ${newPlan}`);
    },
    
    // Service management
    toggleService(serviceKey) {
      const index = this.cartServices.indexOf(serviceKey);
      if (index > -1) {
        this.cartServices.splice(index, 1);
        console.log(`➖ Removed service: ${serviceKey}`);
      } else {
        this.cartServices.push(serviceKey);
        console.log(`➕ Added service: ${serviceKey}`);
      }
    },
    
    // Bundle management
    toggleBundle(bundleKey) {
      const index = this.cartBundles.indexOf(bundleKey);
      if (index > -1) {
        this.cartBundles.splice(index, 1);
        console.log(`➖ Removed bundle: ${bundleKey}`);
      } else {
        this.cartBundles.push(bundleKey);
        console.log(`➕ Added bundle: ${bundleKey}`);
      }
    },
    
    // Addon management
    toggleAddon(addonKey) {
      const index = this.cartAddons.indexOf(addonKey);
      if (index > -1) {
        this.cartAddons.splice(index, 1);
        console.log(`➖ Removed addon: ${addonKey}`);
        this.showNotification('info', 'Add-on removed from cart');
      } else {
        this.cartAddons.push(addonKey);
        console.log(`➕ Added addon: ${addonKey}`);
        this.showNotification('success', 'Add-on added to cart!');
      }
    },
    
    // Clear all cart items
    clearAll() {
      this.cartServices = [];
      this.cartBundles = [];
      this.cartAddons = [];
      console.log('🗑️ Cart cleared');
    },
    
    // Get service by key - Fixed to match services.js structure
    getServiceByKey(serviceKey) {
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === serviceKey);
        if (service) return service;
      }
      return null;
    },
    
    // Get bundle by key
    getBundleByKey(bundleKey) {
      return this.bundles.find(b => b.key === bundleKey) || null;
    },
    
    // Get addon by key - Fixed to match services.js structure
    getAddonByKey(addonKey) {
      return this.addons.find(a => a.key === addonKey) || null;
    },
    
    // Calculate one-time total
    getOneTimeTotal() {
      let total = 0;
      
      // Services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price.oneTime || 0;
      });
      
      // Bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) total += bundle.price.oneTime || 0;
      });
      
      // Add-ons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) total += addon.price.oneTime || 0;
      });
      
      return total;
    },
    
    // Calculate monthly total
    getMonthlyTotal() {
      let total = 0;
      
      // Services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price.monthly || 0;
      });
      
      // Bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) total += bundle.price.monthly || 0;
      });
      
      // Add-ons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) total += addon.price.monthly || 0;
      });
      
      return total;
    },
    
    // Modal management with direct DOM control
    // Alpine.js method (for @click handlers)
    openCheckoutModal() {
      console.log('🛒 Opening checkout modal');
      this.checkoutModalOpen = true;
      
      const modal = document.getElementById('checkout-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
      }
      
      document.body.style.overflow = 'hidden';
    }
    
    // Global function (for onclick handlers)
    window.openCheckoutModal = function() {
      // Direct DOM manipulation with fallback
    }
    
    closeCheckoutModal() {
      console.log('🚪 Closing checkout modal');
      this.checkoutModalOpen = false;
      
      // Direct DOM manipulation
      const modal = document.getElementById('checkout-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        console.log('✅ Modal closed via DOM manipulation');
      }
      
      document.body.style.overflow = '';
    },
    
    // Add-ons modal management
    openAddons(serviceKey = '') {
      console.log(`🔧 Opening addons for service: ${serviceKey}`);
      this.activeAddonService = serviceKey;
      this.showAddonsModal = true;
      this.addonSearchQuery = '';
    },
    
    closeAddonsModal() {
      console.log('❌ Closing addons modal');
      this.showAddonsModal = false;
      this.addonSearchQuery = '';
    },
    
    // Get available services for addon modal
    getAvailableServices() {
      const allServices = [];
      for (const category of Object.values(this.serviceCategories)) {
        if (category.services) {
          allServices.push(...category.services);
        }
      }
      return allServices;
    },
    
    // Get filtered addons for current service
    getFilteredAddons() {
      let filteredAddons = this.addons.filter(addon => 
        addon.applicableServices.includes('all') || 
        addon.applicableServices.includes(this.activeAddonService)
      );
      
      // Apply search filter
      if (this.addonSearchQuery.trim()) {
        const query = this.addonSearchQuery.toLowerCase();
        filteredAddons = filteredAddons.filter(addon => 
          addon.name.toLowerCase().includes(query) ||
          addon.description.toLowerCase().includes(query)
        );
      }
      
      // Apply sorting
      switch(this.addonSortBy) {
        case 'price-asc':
          filteredAddons.sort((a, b) => (a.price.oneTime || 0) - (b.price.oneTime || 0));
          break;
        case 'price-desc':
          filteredAddons.sort((a, b) => (b.price.oneTime || 0) - (a.price.oneTime || 0));
          break;
        case 'alpha':
          filteredAddons.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default: // popular
          // Keep original order
          break;
      }
      
      return filteredAddons;
    },
    
    // Form submission
    async submitOrder() {
      console.log('📤 Submitting order to Stripe');
      
      // Validate form
      const form = this.validateOrderForm();
      if (!form.isValid) {
        this.showNotification('error', form.message);
        return;
      }
      
      // Build cart array for Stripe API
      const cart = [];
      
      // Add services to cart
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) {
          cart.push({
            service: serviceKey,
            name: service.name,
            base: this.plan === 'monthly' ? service.price.monthly : service.price.oneTime,
            addons: []
          });
        }
      });
      
      // Add bundles to cart
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) {
          cart.push({
            service: bundleKey,
            name: bundle.name,
            base: this.plan === 'monthly' ? bundle.price.monthly : bundle.price.oneTime,
            addons: []
          });
        }
      });
      
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: this.plan,
            cart: cart,
            contact: {
              name: form.data.name,
              email: form.data.email,
              phone: form.data.phone || '',
              company: form.data.company || '',
              notes: form.data.notes || ''
            }
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.url) {
          window.location.href = result.url;
        } else {
          throw new Error(result.error || 'Checkout failed');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        this.showNotification('error', 'Checkout failed. Please try again.');
      }
    },
    
    // Validate order form
    validateOrderForm() {
      const name = document.getElementById('checkout-name')?.value?.trim();
      const email = document.getElementById('checkout-email')?.value?.trim();
      const phone = document.getElementById('checkout-phone')?.value?.trim();
      const company = document.getElementById('checkout-company')?.value?.trim();
      const notes = document.getElementById('checkout-notes')?.value?.trim();
      const terms = document.getElementById('checkout-terms')?.checked;
      
      if (!name) {
        return { isValid: false, message: 'Please enter your name' };
      }
      
      if (!email || !email.includes('@')) {
        return { isValid: false, message: 'Please enter a valid email address' };
      }
      
      if (!terms) {
        return { isValid: false, message: 'Please agree to the terms of service' };
      }
      
      return {
        isValid: true,
        data: { name, email, phone, company, notes }
      };
    },
    
    // Clear order form
    clearOrderForm() {
      const fields = ['checkout-name', 'checkout-email', 'checkout-phone', 'checkout-company', 'checkout-notes'];
      fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
      });
      
      const terms = document.getElementById('checkout-terms');
      if (terms) terms.checked = false;
    },
    
    // Notification system
    showNotification(type, message) {
      this.messageType = type;
      this.messageText = message;
      this.showMessage = true;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.showMessage = false;
      }, 5000);
    },
    
    // Test function
    testCheckout() {
      console.log('🧪 Testing checkout system');
      
      // Add test items to cart
      if (this.serviceCategories.signature?.services?.length > 0) {
        this.cartServices.push(this.serviceCategories.signature.services[0].key);
      }
      
      if (this.bundles.length > 0) {
        this.cartBundles.push(this.bundles[0].key);
      }
      
      // Open modal
      this.openCheckoutModal();
      
      this.showNotification('info', 'Test items added to cart!');
    },
    
    // Utility methods for formatting
    fmtUSD(amount) {
      return fmtUSD(amount);
    }
  };
}

// Expose functions globally
window.landingApp = landingApp;
window.fmtUSD = fmtUSD;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌐 DOM loaded, Alpine.js should initialize soon');
  
  // Check if Alpine.js is available
  if (typeof Alpine !== 'undefined') {
    console.log('✅ Alpine.js is available');
  } else {
    console.log('⏳ Waiting for Alpine.js to load...');
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { landingApp, fmtUSD };
}