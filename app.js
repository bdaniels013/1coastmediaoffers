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

// Main Alpine.js application
function landingApp() {
  return {
    // State variables
    year: new Date().getFullYear(),
    plan: 'oneTime',
    activeTab: 'signature',
    checkoutModalOpen: false,
    showMessage: false,
    messageType: 'success',
    messageText: '',
    
    // Cart state
    cartServices: [],
    cartBundles: [],
    cartAddons: [],
    
    // Data references
    serviceCategories: window.serviceData?.serviceCategories || {},
    bundles: window.serviceData?.bundles || [],
    addons: window.serviceData?.addons || {},
    
    // Initialization
    init() {
      console.log('🚀 1CoastMedia app initialized');
      this.validateData();
      this.setupGlobalFunctions();
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
      } else {
        this.cartAddons.push(addonKey);
        console.log(`➕ Added addon: ${addonKey}`);
      }
    },
    
    // Clear all cart items
    clearAll() {
      this.cartServices = [];
      this.cartBundles = [];
      this.cartAddons = [];
      console.log('🗑️ Cart cleared');
    },
    
    // Get service by key
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
    
    // Get addon by key
    getAddonByKey(addonKey) {
      for (const category of Object.values(this.addons)) {
        const addon = category.find(a => a.key === addonKey);
        if (addon) return addon;
      }
      return null;
    },
    
    // Calculate totals
    getOneTimeTotal() {
      let total = 0;
      
      // Add services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service?.price?.oneTime) {
          total += service.price.oneTime;
        }
      });
      
      // Add bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle?.price?.oneTime) {
          total += bundle.price.oneTime;
        }
      });
      
      // Add addons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon?.price?.oneTime) {
          total += addon.price.oneTime;
        }
      });
      
      return total;
    },
    
    getMonthlyTotal() {
      let total = 0;
      
      // Add services
      this.cartServices.forEach(serviceKey => {
        const service = this.getServiceByKey(serviceKey);
        if (service?.price?.monthly) {
          total += service.price.monthly;
        }
      });
      
      // Add bundles
      this.cartBundles.forEach(bundleKey => {
        const bundle = this.getBundleByKey(bundleKey);
        if (bundle?.price?.monthly) {
          total += bundle.price.monthly;
        }
      });
      
      // Add addons
      this.cartAddons.forEach(addonKey => {
        const addon = this.getAddonByKey(addonKey);
        if (addon?.price?.monthly) {
          total += addon.price.monthly;
        }
      });
      
      return total;
    },
    
    // Modal management
    openCheckoutModal() {
      console.log('🛒 Opening checkout modal');
      this.checkoutModalOpen = true;
      document.body.style.overflow = 'hidden';
    },
    
    closeCheckoutModal() {
      console.log('❌ Closing checkout modal');
      this.checkoutModalOpen = false;
      document.body.style.overflow = '';
    },
    
    // Addon modal (placeholder)
    openAddons(category) {
      console.log(`🔧 Opening addons for category: ${category}`);
      this.showNotification('info', 'Add-ons feature coming soon!');
    },
    
    // Form submission
    async submitOrder() {
      console.log('📤 Submitting order');
      
      // Validate form
      const form = this.validateOrderForm();
      if (!form.isValid) {
        this.showNotification('error', form.message);
        return;
      }
      
      // Prepare order data
      const orderData = {
        services: this.cartServices.map(key => this.getServiceByKey(key)).filter(Boolean),
        bundles: this.cartBundles.map(key => this.getBundleByKey(key)).filter(Boolean),
        addons: this.cartAddons.map(key => this.getAddonByKey(key)).filter(Boolean),
        totals: {
          oneTime: this.getOneTimeTotal(),
          monthly: this.getMonthlyTotal()
        },
        customer: form.data,
        timestamp: new Date().toISOString()
      };
      
      try {
        // Submit to API
        const response = await this.submitToAPI(orderData);
        
        if (response.success) {
          this.showNotification('success', 'Order submitted successfully! We\'ll contact you within 24 hours.');
          this.clearAll();
          this.closeCheckoutModal();
          this.clearOrderForm();
        } else {
          throw new Error(response.message || 'Submission failed');
        }
      } catch (error) {
        console.error('❌ Order submission error:', error);
        this.showNotification('error', 'Failed to submit order. Please try again or contact us directly.');
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
      
      // Validation
      if (!name) {
        return { isValid: false, message: 'Name is required' };
      }
      
      if (!email || !this.isValidEmail(email)) {
        return { isValid: false, message: 'Valid email is required' };
      }
      
      if (!terms) {
        return { isValid: false, message: 'Please agree to the terms of service' };
      }
      
      if (this.cartServices.length === 0 && this.cartBundles.length === 0) {
        return { isValid: false, message: 'Please select at least one service or bundle' };
      }
      
      return {
        isValid: true,
        data: { name, email, phone, company, notes }
      };
    },
    
    // Email validation
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
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
    
    // Submit to API
    async submitToAPI(orderData) {
      const endpoint = document.querySelector('meta[name="checkout-endpoint"]')?.content || '/api/checkout';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
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

// Make landingApp available globally
window.landingApp = landingApp;

// Expose utility function globally
window.fmtUSD = fmtUSD;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌊 1CoastMedia app.js loaded successfully');
  
  // Verify Alpine.js is available
  if (typeof Alpine === 'undefined') {
    console.warn('⚠️ Alpine.js not yet loaded');
  }
  
  // Setup global test function
  window.testCheckout = function() {
    console.log('🧪 Global test function called');
    if (window.Alpine && window.Alpine.store) {
      // If Alpine store is available, use it
      const app = window.Alpine.store('app');
      if (app && app.testCheckout) {
        app.testCheckout();
      }
    } else {
      // Fallback: try to find Alpine component
      const body = document.querySelector('body');
      if (body && body._x_dataStack && body._x_dataStack[0]) {
        const appData = body._x_dataStack[0];
        if (appData.testCheckout) {
          appData.testCheckout();
        }
      }
    }
  };
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { landingApp, fmtUSD };
}