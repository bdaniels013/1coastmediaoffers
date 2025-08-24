// Simple admin dashboard logic for the 1CoastMedia site
function adminApp() {
  return {
    serviceCategories: {},
    flatServices: [],
    flatAddons: [],
    addons: [],
    totalSales: 0,
    init() {
      // Load data from global serviceData
      this.serviceCategories = window.serviceData?.serviceCategories || {};
      // Flatten services into a single list for display
      this.flatServices = [];
      for (const [catKey, cat] of Object.entries(this.serviceCategories)) {
        (cat.services || []).forEach(svc => {
          this.flatServices.push({
            key: svc.key,
            name: svc.name,
            priceOneTime: svc.price?.oneTime || 0,
            priceMonthly: svc.price?.monthly || 0,
            category: catKey
          });
        });
      }
      // Load add-ons
      let addonList = [];
      if (window.serviceData?.addons) addonList = window.serviceData.addons;
      else if (window.serviceData?.serviceCategories?.addons) addonList = window.serviceData.serviceCategories.addons;
      this.flatAddons = addonList.map(a => ({
        key: a.key,
        name: a.name,
        description: a.description,
        priceOneTime: a.price?.oneTime || 0
      }));
    },
    // Computed counts
    get servicesCount() {
      return this.flatServices.length;
    },
    get addonsCount() {
      return this.flatAddons.length;
    },
    // Format USD
    fmtUSD(amount) {
      if (!amount || amount === 0) return '$0';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    }
  };
}