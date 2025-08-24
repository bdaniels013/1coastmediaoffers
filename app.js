// Simple client-side shopping cart application for 1CoastMedia
function app() {
  return {
    // UI state
    cartOpen: false,
    // Data collections
    serviceCategories: {},
    cartServices: [],
    // Init loads services from global `serviceData`
    init() {
      this.serviceCategories = window.serviceData?.serviceCategories || {};
    },
    // Format a number as USD
    fmtUSD(amount) {
      if (!amount || amount === 0) return '$0';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    },
    // Get service by key
    getServiceByKey(key) {
      for (const category of Object.values(this.serviceCategories)) {
        const svc = category.services.find(s => s.key === key);
        if (svc) return svc;
      }
      return null;
    },
    // Toggle service in cart
    toggleService(key) {
      const idx = this.cartServices.indexOf(key);
      if (idx >= 0) {
        this.cartServices.splice(idx, 1);
      } else {
        this.cartServices.push(key);
      }
    },
    // Cart count
    cartCount() {
      return this.cartServices.length;
    },
    // Calculate cart total
    cartTotal() {
      let total = 0;
      this.cartServices.forEach(key => {
        const svc = this.getServiceByKey(key);
        if (svc && svc.price && svc.price.oneTime) {
          total += svc.price.oneTime;
        }
      });
      return total;
    },
    // Checkout via API
    async checkout() {
      if (this.cartServices.length === 0) return;
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ services: this.cartServices })
        });
        const data = await response.json();
        if (data && data.url) {
          window.location = data.url;
        } else {
          alert('Unable to initiate checkout.');
        }
      } catch (err) {
        console.error(err);
        alert('Checkout error.');
      }
    }
  };
}