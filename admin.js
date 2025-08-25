// Simple admin dashboard logic for the 1CoastMedia site
function adminApp() {
  return {
    serviceCategories: {},
    flatServices: [],
    flatAddons: [],
    addons: [],
    totalSales: 0,
    // Form models for new entries
    newService: { category: '', key: '', name: '', outcome: '', deliverables: '', oneTime: '', monthly: '' },
    newAddon: { key: '', name: '', description: '', oneTime: '', monthly: '' },
    // Save all changes flag (not used but could be for UI)
    saving: false,
    init() {
      // Load data from localStorage if available; fall back to global serviceData
      try {
        const stored = localStorage.getItem('serviceData');
        if (stored) {
          window.serviceData = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Could not parse serviceData from localStorage', err);
      }
      // Ensure window.serviceData exists
      if (!window.serviceData) {
        window.serviceData = { serviceCategories: {}, addons: [] };
      }
      // Copy categories to internal state
      this.serviceCategories = window.serviceData.serviceCategories || {};
      // Flatten services into a single list for display
      this.flatServices = [];
      for (const [catKey, cat] of Object.entries(this.serviceCategories)) {
        (cat.services || []).forEach(svc => {
          this.flatServices.push({
            key: svc.key,
            name: svc.name,
            outcome: svc.outcome || '',
            deliverables: (svc.deliverables || []).join(', '),
            priceOneTime: svc.price?.oneTime || 0,
            priceMonthly: svc.price?.monthly || 0,
            category: catKey
          });
        });
      }
      // Load add-ons
      let addonList = [];
      if (window.serviceData.addons && Array.isArray(window.serviceData.addons)) addonList = window.serviceData.addons;
      else if (window.serviceData.serviceCategories?.addons) addonList = window.serviceData.serviceCategories.addons;
      this.flatAddons = addonList.map(a => ({
        key: a.key,
        name: a.name,
        description: a.description || '',
        priceOneTime: a.price?.oneTime || 0,
        priceMonthly: a.price?.monthly || 0
      }));
      // initialise form categories with first category key if available
      const firstCat = Object.keys(this.serviceCategories)[0] || '';
      if (!this.newService.category) this.newService.category = firstCat;
    },
    /**
     * Find the original service definition by key from the current window.serviceData
     * Used to preserve outcome, deliverables and other metadata when saving changes.
     * @param {string} key
     */
    findOriginalService(key) {
      const cats = window.serviceData?.serviceCategories || {};
      for (const cat of Object.values(cats)) {
        const svc = (cat.services || []).find(s => s.key === key);
        if (svc) return svc;
      }
      return null;
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

    ,
    /**
     * Add a new service to the catalog
     */
    addService() {
      const { category, key, name, outcome, deliverables, oneTime, monthly } = this.newService;
      if (!category || !key || !name) {
        alert('Please fill out category, key and name');
        return;
      }
      // Ensure category exists
      if (!this.serviceCategories[category]) {
        this.serviceCategories[category] = { description: '', services: [] };
      }
      // Check duplicate key
      for (const cat of Object.values(this.serviceCategories)) {
        if (cat.services.some(s => s.key === key)) {
          alert('Service key already exists');
          return;
        }
      }
      const priceOne = parseFloat(oneTime) || 0;
      const priceMon = parseFloat(monthly) || 0;
      // Parse deliverables from comma-separated string
      const deliverableList = (deliverables || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const newSvc = {
        key: key,
        name: name,
        outcome: outcome || '',
        deliverables: deliverableList,
        price: { oneTime: priceOne, monthly: priceMon }
      };
      this.serviceCategories[category].services.push(newSvc);
      this.flatServices.push({ key, name, outcome: outcome || '', deliverables: deliverableList.join(', '), priceOneTime: priceOne, priceMonthly: priceMon, category });
      // Reset form fields
      this.newService.key = '';
      this.newService.name = '';
      this.newService.outcome = '';
      this.newService.deliverables = '';
      this.newService.oneTime = '';
      this.newService.monthly = '';
      // Persist
      this.saveData();
    },
    /**
     * Delete a service by key
     */
    deleteService(key) {
      for (const catKey in this.serviceCategories) {
        const cat = this.serviceCategories[catKey];
        const idx = cat.services.findIndex(s => s.key === key);
        if (idx >= 0) {
          cat.services.splice(idx, 1);
          break;
        }
      }
      this.flatServices = this.flatServices.filter(s => s.key !== key);
      this.saveData();
    },
    /**
     * Add a new add-on
     */
    addAddon() {
      const { key, name, description, oneTime, monthly } = this.newAddon;
      if (!key || !name) {
        alert('Please fill out key and name for the add-on');
        return;
      }
      // Duplicate check
      if (this.flatAddons.some(a => a.key === key)) {
        alert('Add-on key already exists');
        return;
      }
      const priceOne = parseFloat(oneTime) || 0;
      const priceMon = parseFloat(monthly) || 0;
      const newAddon = {
        key: key,
        name: name,
        description: description || '',
        price: { oneTime: priceOne, monthly: priceMon },
        applicableServices: ['all']
      };
      // Add to global data structure
      if (!window.serviceData.addons) window.serviceData.addons = [];
      window.serviceData.addons.push(newAddon);
      this.flatAddons.push({ key, name, description: description || '', priceOneTime: priceOne, priceMonthly: priceMon });
      // Reset form
      this.newAddon.key = '';
      this.newAddon.name = '';
      this.newAddon.description = '';
      this.newAddon.oneTime = '';
      this.newAddon.monthly = '';
      this.saveData();
    },
    /**
     * Delete an add-on by key
     */
    deleteAddon(key) {
      if (window.serviceData.addons) {
        const idx = window.serviceData.addons.findIndex(a => a.key === key);
        if (idx >= 0) window.serviceData.addons.splice(idx, 1);
      }
      this.flatAddons = this.flatAddons.filter(a => a.key !== key);
      this.saveData();
    },
    /**
     * Save all changes made to services and add-ons.
     * This rebuilds the serviceCategories object from the flat lists and
     * merges in existing metadata (e.g. outcome, deliverables).
     */
    saveChanges() {
      // Build new category structure
      const newCategories = {};
      this.flatServices.forEach(svc => {
        const catKey = svc.category || '';
        if (!newCategories[catKey]) {
          // Preserve existing category description if available
          const existingCat = this.serviceCategories[catKey] || {};
          newCategories[catKey] = {
            description: existingCat.description || '',
            services: []
          };
        }
        // Preserve existing metadata
        const orig = this.findOriginalService(svc.key) || {};
        const updatedSvc = {
          key: svc.key,
          name: svc.name,
          // Use edited outcome if provided; otherwise fall back to original
          outcome: svc.outcome !== undefined ? svc.outcome : (orig.outcome || ''),
          // Parse deliverables from comma-separated string if edited, else use original array
          deliverables: svc.deliverables !== undefined
            ? svc.deliverables.split(',').map(d => d.trim()).filter(Boolean)
            : (orig.deliverables || []),
          sla: orig.sla || '',
          price: {
            oneTime: parseFloat(svc.priceOneTime) || 0,
            monthly: parseFloat(svc.priceMonthly) || 0
          }
        };
        newCategories[catKey].services.push(updatedSvc);
      });
      // Replace categories
      this.serviceCategories = newCategories;
      // Update global serviceData
      window.serviceData.serviceCategories = newCategories;
      // Update add-ons
      // Build new add-ons list preserving applicableServices if present
      const newAddons = this.flatAddons.map(a => {
        // Find original addon by key
        let orig = null;
        if (window.serviceData.addons) {
          orig = window.serviceData.addons.find(item => item.key === a.key);
        }
        return {
          key: a.key,
          name: a.name,
          description: a.description || '',
          price: {
            oneTime: parseFloat(a.priceOneTime) || 0,
            monthly: parseFloat(a.priceMonthly) || 0
          },
          applicableServices: orig?.applicableServices || ['all']
        };
      });
      window.serviceData.addons = newAddons;
      // Persist all data
      this.saveData();
      alert('Changes saved successfully');
    },

    /**
     * Move a service up or down in the flat list. Updates only the view; call saveChanges() to persist.
     */
    moveServiceUp(index) {
      if (index <= 0) return;
      const item = this.flatServices.splice(index, 1)[0];
      this.flatServices.splice(index - 1, 0, item);
    },
    moveServiceDown(index) {
      if (index >= this.flatServices.length - 1) return;
      const item = this.flatServices.splice(index, 1)[0];
      this.flatServices.splice(index + 1, 0, item);
    },
    moveAddonUp(index) {
      if (index <= 0) return;
      const item = this.flatAddons.splice(index, 1)[0];
      this.flatAddons.splice(index - 1, 0, item);
    },
    moveAddonDown(index) {
      if (index >= this.flatAddons.length - 1) return;
      const item = this.flatAddons.splice(index, 1)[0];
      this.flatAddons.splice(index + 1, 0, item);
    },

    // Drag-and-drop support
    dragServiceIndex: null,
    dragAddonIndex: null,
    handleServiceDragStart(event, index) {
      this.dragServiceIndex = index;
    },
    handleServiceDrop(event, index) {
      if (this.dragServiceIndex === null || this.dragServiceIndex === index) return;
      const item = this.flatServices.splice(this.dragServiceIndex, 1)[0];
      this.flatServices.splice(index, 0, item);
      this.dragServiceIndex = null;
    },
    handleAddonDragStart(event, index) {
      this.dragAddonIndex = index;
    },
    handleAddonDrop(event, index) {
      if (this.dragAddonIndex === null || this.dragAddonIndex === index) return;
      const item = this.flatAddons.splice(this.dragAddonIndex, 1)[0];
      this.flatAddons.splice(index, 0, item);
      this.dragAddonIndex = null;
    },
    /**
     * Persist current serviceData to localStorage
     */
    saveData() {
      // Update window.serviceData from serviceCategories structure
      window.serviceData.serviceCategories = this.serviceCategories;
      // Save to localStorage
      localStorage.setItem('serviceData', JSON.stringify(window.serviceData));
    }
  };
}