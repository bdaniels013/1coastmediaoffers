// 1CoastMedia Landing Page Application
// Simple, working Alpine.js implementation

// Global utility function
function fmtUSD(amount) {
  if (!amount || amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Simple global modal functions
// Modal helpers that ensure the checkout overlay is properly shown/hidden.
// We remove and add both the `hidden` attribute and utility class so that
// Alpine’s x-cloak or Tailwind utilities don’t conflict with dynamic state.
window.openCheckoutModal = function() {
  console.log('Opening checkout modal');
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    // Unhide the modal by clearing attributes/classes and enabling display
    modal.hidden = false;
    modal.classList.remove('hidden');
    modal.removeAttribute('hidden');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
};

window.closeCheckoutModal = function() {
  console.log('Closing checkout modal');
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    // Hide the modal and restore the page scroll
    modal.hidden = true;
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
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
    
    // Data references
    serviceCategories: {},
    bundles: [],
    addons: [],
    
    // Initialization
    init() {
      console.log('🚀 1CoastMedia app initialized');
      
      // Load data
      this.serviceCategories = window.serviceData?.serviceCategories || {};
      this.bundles = window.serviceData?.bundles || [];
      this.addons = window.serviceData?.addons || [];
      
      console.log('📊 Data loaded:', {
        categories: Object.keys(this.serviceCategories).length,
        bundles: this.bundles.length,
        addons: this.addons.length
      });
    },
    
    // Modal management
    openCheckoutModal() {
      console.log('Alpine: Opening checkout modal');
      this.checkoutModalOpen = true;
      window.openCheckoutModal();
    },
    
    closeCheckoutModal() {
      console.log('Alpine: Closing checkout modal');
      this.checkoutModalOpen = false;
      window.closeCheckoutModal();
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
    
    // Cart calculations - FIXED: Added missing functions
    getCartTotal() {
      return this.getOneTimeTotal() + this.getMonthlyTotal();
    },
    
    getOneTimeTotal() {
      let total = 0;
      
      // Add one-time services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service && this.plan === 'oneTime') {
          total += service.price.oneTime || 0;
        }
      });
      
      // Add one-time bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) {
          total += bundle.price.oneTime || 0;
        }
      });
      
      // Add one-time addons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon && this.plan === 'oneTime') {
          total += addon.price.oneTime || 0;
        }
      });
      
      return total;
    },
    
    getMonthlyTotal() {
      let total = 0;
      
      // Add monthly services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service && this.plan === 'monthly') {
          total += service.price.monthly || 0;
        }
      });
      
      // Add monthly bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) {
          total += bundle.price.monthly || 0;
        }
      });
      
      // Add monthly addons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon && this.plan === 'monthly') {
          total += addon.price.monthly || 0;
        }
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
        default:
          break;
      }
      
      return filteredAddons;
    },
    
    // Checkout and order processing
    async submitOrder() {
      console.log('📤 Submitting order');
      
      // Validate form
      const form = this.validateOrderForm();
      if (!form.isValid) {
        this.showNotification('error', form.message);
        return;
      }
      
      // Build a simplified cart for checkout. Each selected item becomes a
      // plain object containing its name, price, and type. We avoid sending
      // unused keys like `billing` or `key` to simplify the API contract.
      const cart = [];

      // Add selected services
      this.cartServices.forEach((serviceKey) => {
        const service = this.getServiceByKey(serviceKey);
        if (service) {
          cart.push({
            type: 'service',
            name: service.name,
            price: service.price[this.plan] || 0,
          });
        }
      });

      // Add selected bundles
      this.cartBundles.forEach((bundleKey) => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle) {
          cart.push({
            type: 'bundle',
            name: bundle.name,
            price: bundle.price[this.plan] || 0,
          });
        }
      });

      // Add selected add‑ons
      this.cartAddons.forEach((addonKey) => {
        const addon = this.getAddonByKey(addonKey);
        if (addon) {
          cart.push({
            type: 'addon',
            name: addon.name,
            price: addon.price[this.plan] || 0,
          });
        }
      });

      try {
        const payload = {
          plan: this.plan, // 'oneTime' or 'monthly'
          cart: cart,
          contact: form.data,
          // Preserve original customer field for backward compatibility
          customer: form.data,
        };
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        // Accept either the new `url` field or legacy `checkoutUrl`/`success` keys
        const redirectUrl = result.url || result.checkoutUrl;
        if (response.ok && redirectUrl) {
          window.location.href = redirectUrl;
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌊 DOM loaded, Alpine.js should initialize');
  
  if (typeof Alpine === 'undefined') {
    console.error('❌ Alpine.js not found!');
  } else {
    console.log('✅ Alpine.js is available');
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { landingApp, fmtUSD };
}
