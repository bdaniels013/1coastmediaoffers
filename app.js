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

// Global functions for modal control (fallback for onclick handlers)
window.openCheckoutModal = function() {
  console.log('Global: Opening checkout modal');
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.hidden = false;
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    
    // Sync with Alpine.js state if available
    const app = document.querySelector('[x-data]')?.__x?.$data;
    if (app) {
      app.checkoutModalOpen = true;
    }
  }
};

window.closeCheckoutModal = function() {
  console.log('Global: Closing checkout modal');
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.hidden = true;
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
    document.body.style.overflow = '';
    
    // Sync with Alpine.js state if available
    const app = document.querySelector('[x-data]')?.__x?.$data;
    if (app) {
      app.checkoutModalOpen = false;
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
      
      // Verify data loaded
      console.log('📊 Data loaded:', {
        categories: Object.keys(this.serviceCategories).length,
        bundles: this.bundles.length,
        addons: this.addons.length
      });
      
      // Setup global functions
      this.setupGlobalFunctions();
    },
    
    setupGlobalFunctions() {
      // Ensure global functions are available
      if (typeof window.openCheckoutModal !== 'function') {
        window.openCheckoutModal = () => this.openCheckoutModal();
      }
      if (typeof window.closeCheckoutModal !== 'function') {
        window.closeCheckoutModal = () => this.closeCheckoutModal();
      }
    },
    
    // Modal management
    openCheckoutModal() {
      console.log('Alpine: Opening checkout modal');
      this.checkoutModalOpen = true;
      
      // Direct DOM manipulation for reliability
      const modal = document.getElementById('checkout-modal');
      if (modal) {
        modal.hidden = false;
        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        document.body.style.overflow = 'hidden';
      }
    },
    
    closeCheckoutModal() {
      console.log('Alpine: Closing checkout modal');
      this.checkoutModalOpen = false;
      
      // Direct DOM manipulation for reliability
      const modal = document.getElementById('checkout-modal');
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        document.body.style.overflow = '';
      }
    },
    
    openAddonsModal(serviceKey = '') {
      this.activeAddonService = serviceKey;
      this.showAddonsModal = true;
      document.body.style.overflow = 'hidden';
    },
    
    closeAddonsModal() {
      this.showAddonsModal = false;
      this.activeAddonService = '';
      this.addonSearchQuery = '';
      document.body.style.overflow = '';
    },
    
    // Service management
    getServiceByKey(key) {
      for (const category of Object.values(this.serviceCategories)) {
        const service = category.services?.find(s => s.key === key);
        if (service) return service;
      }
      return null;
    },
    
    getBundleByKey(key) {
      return this.bundles.find(b => b.key === key) || null;
    },
    
    getAddonByKey(key) {
      return this.addons.find(a => a.key === key) || null;
    },
    
    // Cart management
    toggleService(serviceKey) {
      const index = this.cartServices.indexOf(serviceKey);
      if (index > -1) {
        this.cartServices.splice(index, 1);
        this.showNotification('info', 'Service removed from cart');
      } else {
        this.cartServices.push(serviceKey);
        this.showNotification('success', 'Service added to cart');
      }
    },
    
    toggleBundle(bundleKey) {
      const index = this.cartBundles.indexOf(bundleKey);
      if (index > -1) {
        this.cartBundles.splice(index, 1);
        this.showNotification('info', 'Bundle removed from cart');
      } else {
        this.cartBundles.push(bundleKey);
        this.showNotification('success', 'Bundle added to cart');
      }
    },
    
    toggleAddon(addonKey) {
      const index = this.cartAddons.indexOf(addonKey);
      if (index > -1) {
        this.cartAddons.splice(index, 1);
        this.showNotification('info', 'Add-on removed from cart');
      } else {
        this.cartAddons.push(addonKey);
        this.showNotification('success', 'Add-on added to cart');
      }
    },
    
    clearCart() {
      this.cartServices = [];
      this.cartBundles = [];
      this.cartAddons = [];
      this.showNotification('info', 'Cart cleared');
    },
    
    // Cart calculations
    getCartTotal() {
      let total = 0;
      
      // Add services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) total += service.price[this.plan] || 0;
      });
      
      // Add bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) total += bundle.price[this.plan] || 0;
      });
      
      // Add addons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) total += addon.price[this.plan] || 0;
      });
      
      return total;
    },
    
    getCartItemCount() {
      return this.cartServices.length + this.cartBundles.length + this.cartAddons.length;
    },
    
    hasCartItems() {
      return this.getCartItemCount() > 0;
    },
    
    // Service filtering and search
    getServicesByCategory(categoryKey) {
      return this.serviceCategories[categoryKey]?.services || [];
    },
    
    getAvailableServices() {
      const allServices = [];
      for (const category of Object.values(this.serviceCategories)) {
        if (category.services) {
          allServices.push(...category.services);
        }
      }
      return allServices;
    },
    
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
        case 'price-low':
          filteredAddons.sort((a, b) => (a.price[this.plan] || 0) - (b.price[this.plan] || 0));
          break;
        case 'price-high':
          filteredAddons.sort((a, b) => (b.price[this.plan] || 0) - (a.price[this.plan] || 0));
          break;
        case 'name':
          filteredAddons.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default: // 'popular'
          // Keep original order
          break;
      }
      
      return filteredAddons;
    },
    
    // Checkout and order processing
    async submitOrder() {
      console.log('📤 Submitting order to Stripe');
      
      // Validate form
      const form = this.validateOrderForm();
      if (!form.isValid) {
        this.showNotification('error', form.message);
        return;
      }
      
      // Build cart items
      const cart = [];
      
      // Add services to cart
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service) {
          cart.push({
            type: 'service',
            key: serviceKey,
            name: service.name,
            price: service.price[this.plan] || 0,
            billing: this.plan
          });
        }
      });
      
      // Add bundles to cart
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) {
          cart.push({
            type: 'bundle',
            key: bundleKey,
            name: bundle.name,
            price: bundle.price[this.plan] || 0,
            billing: this.plan
          });
        }
      });
      
      // Add addons to cart
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) {
          cart.push({
            type: 'addon',
            key: addonKey,
            name: addon.name,
            price: addon.price[this.plan] || 0,
            billing: this.plan
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
            customer: form.data,
            cart: cart,
            total: this.getCartTotal()
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          throw new Error(result.message || 'Checkout failed');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        this.showNotification('error', 'Checkout failed. Please try again.');
      }
    },
    
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
    
    clearOrderForm() {
      const fields = ['checkout-name', 'checkout-email', 'checkout-phone', 'checkout-company', 'checkout-notes'];
      fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = '';
      });
      
      const terms = document.getElementById('checkout-terms');
      if (terms) terms.checked = false;
    },
    
    // Notifications
    showNotification(type, message) {
      this.messageType = type;
      this.messageText = message;
      this.showMessage = true;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.showMessage = false;
      }, 5000);
    },
    
    // Testing and debugging
    testCheckout() {
      console.log('🧪 Testing checkout system');
      
      // Add test items to cart
      if (this.serviceCategories.signature?.services?.length > 0) {
        this.cartServices.push(this.serviceCategories.signature.services[0].key);
      }
      
      if (this.bundles.length > 0) {
        this.cartBundles.push(this.bundles[0].key);
      }
      
      this.openCheckoutModal();
      this.showNotification('info', 'Test items added to cart!');
    },
    
    // Utility functions
    fmtUSD(amount) {
      return fmtUSD(amount);
    }
  };
}

// Export functions for global access
window.landingApp = landingApp;
window.fmtUSD = fmtUSD;

// Initialize Alpine.js when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌊 DOM loaded, Alpine.js should initialize');
  
  // Verify Alpine.js is available
  if (typeof Alpine === 'undefined') {
    console.error('❌ Alpine.js not found! Make sure it\'s loaded.');
  } else {
    console.log('✅ Alpine.js is available');
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { landingApp, fmtUSD };
}