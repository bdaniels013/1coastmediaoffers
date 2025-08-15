/* public/assets/js/app.js */
/* global Alpine */
(function () {
  'use strict';

  var CATALOG_URL = '/api/admin?r=catalog';

  function normalizeIncludes(v) {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      try { var parsed = JSON.parse(v); if (Array.isArray(parsed)) return parsed; } catch (e) {}
      return v.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    return [];
  }

  function dollars(n) {
    var x = Number(n) || 0;
    // If looks like cents (>= $10.00), treat as cents
    if (x >= 1000) return Math.round(x / 100);
    return Math.round(x);
  }

  function normalizeService(s) {
    // Accept either {id} or {key}
    var key = String(s.key || s.id || '');
    var base = s.base || {};
    var oneTime = ('oneTime' in base) ? base.oneTime : ('base_one_time_cents' in s ? dollars(s.base_one_time_cents) : 0);
    var monthly = ('monthly' in base) ? base.monthly : ('base_monthly_cents' in s ? dollars(s.base_monthly_cents) : 0);

    var addOnsRaw = s.addOns || s.addons || [];
    var addOns = (Array.isArray(addOnsRaw) ? addOnsRaw : []).map(function (a) {
      var price = a.price || {};
      var pOne = ('oneTime' in price) ? price.oneTime : ('price_one_time_cents' in a ? dollars(a.price_one_time_cents) : 0);
      var pMon = ('monthly' in price) ? price.monthly : ('price_monthly_cents' in a ? dollars(a.price_monthly_cents) : 0);
      return {
        id: String(a.id || ''),
        label: a.label || '',
        desc: a.desc || a.description || '',
        short: a.short || '',
        badge: a.badge || '',
        popular: !!a.popular,
        price: { oneTime: dollars(pOne), monthly: dollars(pMon) }
      };
    });

    return {
      key: key || s.name || 'svc-' + Math.random().toString(36).slice(2),
      name: s.name || 'Untitled',
      blurb: s.blurb || '',
      base: { oneTime: dollars(oneTime), monthly: dollars(monthly) },
      includes: normalizeIncludes(s.includes),
      addOns: addOns
    };
  }

  // ---- HARD-CODED FALLBACK so the page never renders blank
  var FALLBACK_SERVICES = [
    { key:'web', name:'Web & App', blurb:'Launch a clean, mobile-first site fast.', base:{oneTime:300, monthly:500}, includes:['Kickoff & setup','Landing page (3–5 sections)','Light copy help'], addOns:[
      { id:'web-seo', label:'SEO Basics', desc:'Titles, speed checks, findable.', short:'Quick search wins', price:{oneTime:150, monthly:150}, badge:'Quick win', popular:true },
      { id:'web-auto', label:'Lead Automations', desc:'Instant replies to leads.', short:'Never miss a lead', price:{oneTime:100, monthly:100}, badge:'Hands-off', popular:true },
      { id:'web-api', label:'Payments & Maps', desc:'Stripe checkout + maps.', short:'High-impact add', price:{oneTime:250, monthly:250}, badge:'High impact' },
      { id:'web-mvp', label:'Clickable MVP', desc:'Tap-through prototype.', short:'Test ideas', price:{oneTime:500, monthly:500}, badge:'Prototype' },
      { id:'web-copy', label:'Website Copywriting', desc:'We write clear, on-brand copy.', short:'Words that sell', price:{oneTime:120, monthly:120}, badge:'Done-for-you' },
      { id:'web-speed', label:'Speed & Security', desc:'Performance boosts + hardening.', short:'Faster & safer', price:{oneTime:150, monthly:150}, badge:'Speed' },
      { id:'web-forms', label:'Smart Forms', desc:'Lead routing + spam block.', short:'Higher conversions', price:{oneTime:150, monthly:100}, badge:'Leads' },
      { id:'web-analytics', label:'Analytics Setup', desc:'Simple dashboard + goals.', short:'Know what works', price:{oneTime:100, monthly:120}, badge:'Insight' },
      { id:'web-blog', label:'Blog/CMS Setup', desc:'Easy updates, categories, tags.', short:'Publish fast', price:{oneTime:200, monthly:150}, badge:'Content' },
      { id:'web-booking', label:'Booking Integration', desc:'Calendly/Square appointments.', short:'Fewer no-shows', price:{oneTime:150, monthly:120}, badge:'Conversion' },
      { id:'web-reviews', label:'Reviews Widget', desc:'Pull Google/FB reviews on site.', short:'Build trust', price:{oneTime:100, monthly:100}, badge:'Trust' },
      { id:'web-a11y', label:'Accessibility Audit', desc:'WCAG quick audit + fixes.', short:'Compliance wins', price:{oneTime:180, monthly:150}, badge:'Compliance' },
      { id:'web-i18n', label:'Multi-language', desc:'Key pages in 2nd language.', short:'Expand reach', price:{oneTime:220, monthly:150}, badge:'Reach' },
      { id:'web-dns', label:'Domain & DNS', desc:'Purchase, connect, SSL.', short:'We handle setup', price:{oneTime:80, monthly:0}, badge:'Setup' },
      { id:'web-section', label:'Custom Section', desc:'1 bespoke section block.', short:'Tailored UI', price:{oneTime:120, monthly:120}, badge:'Custom' },
      { id:'web-photos', label:'Photo Sourcing', desc:'Handpicked stock + edits.', short:'Better visuals', price:{oneTime:90, monthly:90}, badge:'Visuals' },
      { id:'web-brandkit', label:'Brand Kit', desc:'Fonts, colors, components.', short:'Consistent look', price:{oneTime:200, monthly:150}, badge:'Brand' }
    ]},
    { key:'video', name:'Video / Audio', blurb:'Short, on-brand edits that convert.', base:{oneTime:600, monthly:1200}, includes:['Kickoff & plan','1–2 min edit','Clean edit, coastal vibe'], addOns:[
      { id:'vid-audio', label:'Clean Audio + Captions', desc:'Noise fix + captions.', short:'Watchable anywhere', price:{oneTime:200, monthly:250}, badge:'Accessibility', popular:true },
      { id:'vid-adv', label:'Advanced Edit / Series', desc:'More story, motion, polish.', short:'Flagship content', price:{oneTime:800, monthly:1000}, badge:'Premium', popular:true },
      { id:'vid-drone-p', label:'Drone B-roll (Basic)', desc:'Dynamic aerial flavor.', short:'Wow factor', price:{oneTime:300, monthly:300}, badge:'Wow' },
      { id:'vid-drone-pro', label:'Drone Cinematics (Pro)', desc:'Licensed pilot + pro gear.', short:'Top-tier aerials', price:{oneTime:1500, monthly:1500}, badge:'Cinematic' },
      { id:'vid-extra', label:'Extra Edit Pass', desc:'More refinements + cuts.', short:'Sharper pacing', price:{oneTime:300, monthly:500}, badge:'Polish' },
      { id:'vid-script', label:'Script & Shotlist', desc:'Plan lines + shots.', short:'Shoot with ease', price:{oneTime:150, monthly:150}, badge:'Plan' },
      { id:'vid-color', label:'Pro Color Grade', desc:'Crisp, cinematic look.', short:'Standout look', price:{oneTime:150, monthly:150}, badge:'Look' },
      { id:'vid-sizes', label:'All Social Sizes', desc:'9:16, 1:1, 16:9 outputs.', short:'Every platform', price:{oneTime:120, monthly:120}, badge:'Everywhere' },
      { id:'vid-thumbs', label:'Thumbnail Pack (x3)', desc:'Scroll-stopping covers.', short:'Higher CTR', price:{oneTime:100, monthly:100}, badge:'Hook' },
      { id:'vid-raw', label:'Raw Footage Delivery', desc:'We hand you the files.', short:'Own the source', price:{oneTime:60, monthly:60}, badge:'Archive' },
      { id:'vid-voice', label:'Voiceover', desc:'Pro VO talent included.', short:'Narration', price:{oneTime:220, monthly:220}, badge:'Pro' },
      { id:'vid-tele', label:'Teleprompter', desc:'Confident on-camera lines.', short:'Confidence', price:{oneTime:90, monthly:90}, badge:'Assist' },
      { id:'vid-studio', label:'Studio Day', desc:'Lighting, backdrops, sound.', short:'Controlled set', price:{oneTime:700, monthly:700}, badge:'Studio' },
      { id:'vid-multi', label:'Multi-location Shoot', desc:'Up to 3 locations.', short:'More variety', price:{oneTime:400, monthly:400}, badge:'Scope' },
      { id:'vid-cast', label:'Talent Casting', desc:'Find on-brand talent.', short:'Right faces', price:{oneTime:300, monthly:300}, badge:'Talent' }
    ]},
    { key:'events', name:'Events', blurb:'Plan smooth, run tight, look great.', base:{oneTime:1000, monthly:1200}, includes:['Scope & timeline','Basic coordination','Day-of support'], addOns:[
      { id:'ev-ven', label:'Vendor/Venue Handling', desc:'We wrangle calls.', short:'Stress-free', price:{oneTime:500, monthly:600}, badge:'Stress-free', popular:true },
      { id:'ev-digital', label:'RSVP/Tickets Page', desc:'Modern guest flow.', short:'Smooth RSVPs', price:{oneTime:200, monthly:200}, badge:'Modern' },
      { id:'ev-media', label:'Highlight Media', desc:'Recap video + photos.', short:'Shareworthy', price:{oneTime:300, monthly:300}, badge:'Content' },
      { id:'ev-auto', label:'Guest Automations', desc:'Reminders + check-in.', short:'No bottlenecks', price:{oneTime:150, monthly:150}, badge:'Smooth' },
      { id:'ev-hybrid', label:'Livestream Setup', desc:'Hybrid reach, simple.', short:'Reach more', price:{oneTime:400, monthly:400}, badge:'Reach' },
      { id:'ev-host', label:'Host / MC', desc:'Energy + timing control.', short:'Keep pace', price:{oneTime:250, monthly:250}, badge:'Energy' },
      { id:'ev-runshow', label:'Run-of-Show', desc:'Minute-by-minute plan.', short:'Clarity', price:{oneTime:150, monthly:150}, badge:'Clarity' },
      { id:'ev-sponsor', label:'Sponsor Kit + Outreach', desc:'Deck + outreach.', short:'New revenue', price:{oneTime:200, monthly:200}, badge:'Revenue' },
      { id:'ev-security', label:'Permits & Security Guide', desc:'Who to call + when.', short:'Safer event', price:{oneTime:120, monthly:120}, badge:'Safety' },
      { id:'ev-vip', label:'VIP/Backstage Mgmt', desc:'Green room + access.', short:'White-glove', price:{oneTime:200, monthly:200}, badge:'VIP' },
      { id:'ev-photobooth', label:'Photo Booth', desc:'Branded photos on site.', short:'Fun moments', price:{oneTime:350, monthly:350}, badge:'Fun' },
      { id:'ev-ticketing', label:'Ticketing Integration', desc:'Stripe/Square, QR.', short:'Faster gates', price:{oneTime:220, monthly:220}, badge:'Revenue' }
    ]},
    { key:'ugc', name:'UGC', blurb:'Creators + clips that actually get seen.', base:{oneTime:450, monthly:600}, includes:['Kickoff & setup','30k verified views','Simple report'], addOns:[
      { id:'ugc-repurpose', label:'Ads-Ready Pack', desc:'Cut-downs + hooks.', short:'Convert more', price:{oneTime:200, monthly:200}, badge:'Ads-ready', popular:true },
      { id:'ugc-leads', label:'Lead Capture Page', desc:'Turn views to contacts.', short:'Capture demand', price:{oneTime:250, monthly:250}, badge:'Leads' },
      { id:'ugc-enhance', label:'Eye-Candy Overlays', desc:'On-brand text, beats.', short:'More watch time', price:{oneTime:150, monthly:150}, badge:'Engaging' },
      { id:'ugc-captions', label:'SEO Captions', desc:'Be found & tapped.', short:'Search hits', price:{oneTime:100, monthly:100}, badge:'Search' },
      { id:'ugc-brand', label:'Branding Pack', desc:'Logos, end-slates.', short:'Brand recall', price:{oneTime:150, monthly:150}, badge:'Brand' },
      { id:'ugc-views-10k', label:'+10k Views', desc:'~10,000 verified views.', short:'+10k reach', price:{oneTime:150, monthly:150}, badge:'+10k' },
      { id:'ugc-views-20k', label:'+20k Views', desc:'~20,000 verified views.', short:'+20k reach', price:{oneTime:300, monthly:300}, badge:'+20k' },
      { id:'ugc-views-70k', label:'+70k Views', desc:'~70,000 verified views.', short:'+70k reach', price:{oneTime:1050, monthly:1050}, badge:'+70k' },
      { id:'ugc-creator', label:'Creator Matching', desc:'Shortlist best locals.', short:'Best fit', price:{oneTime:100, monthly:100}, badge:'Match' },
      { id:'ugc-studio', label:'Studio Polish', desc:'Re-cut with pro touch.', short:'Pro finish', price:{oneTime:150, monthly:150}, badge:'Pro' },
      { id:'ugc-comment', label:'Comment Reply Pack', desc:'Smart replies to boost.', short:'Engage more', price:{oneTime:100, monthly:100}, badge:'Engage' },
      { id:'ugc-tracking', label:'Tracking Upgrade', desc:'Deeper insights.', short:'Better decisions', price:{oneTime:120, monthly:120}, badge:'Insight' },
      { id:'ugc-white', label:'Whitelisting Rights', desc:'Run creator posts as ads.', short:'Run as ads', price:{oneTime:220, monthly:220}, badge:'Rights' },
      { id:'ugc-usage', label:'Usage Rights Extension', desc:'Extend paid usage.', short:'More time', price:{oneTime:180, monthly:180}, badge:'Rights' },
      { id:'ugc-hooks', label:'A/B Hooks Pack', desc:'5 alt hooks to test.', short:'Test faster', price:{oneTime:140, monthly:140}, badge:'Test' }
    ]}
  ];

  // Expose globally so Alpine can call it from x-data
  window.landingApp = function () {
    return {
      // --- STATE ---
      year: (new Date()).getFullYear(),
      plan: 'oneTime',
      addonQuery: '',
      sortBy: 'popular',
      services: FALLBACK_SERVICES.slice(),
      addonIndex: {},
      openDescs: {},
      cartServices: [],
      cartAddons: [],
      builderOpen: false,
      addonsOpen: false,
      activeService: 'web',
      stickyCta: false,
      toast: { show: false, text: '' },
      isSubmitting: false,
      contact: { name: '', email: '', company: '', phone: '', notes: '' },

      // --- INIT ---
      init: async function () {
        this.rebuildIndex();

        // Try to hydrate from DB (only if non-empty)
        try {
          var res = await fetch(CATALOG_URL, { cache: 'no-store' });
          if (res.ok) {
            var data = await res.json();
            if (Array.isArray(data.services) && data.services.length > 0) {
              this.services = data.services.map(normalizeService);
              this.activeService = this.services[0] && this.services[0].key ? this.services[0].key : this.activeService;
              this.rebuildIndex();
              console.info('Catalog loaded from DB:', this.services.length, 'services');
            } else {
              console.info('Catalog API returned empty; keeping fallback.');
            }
          } else {
            console.warn('Catalog fetch failed', res.status, '— keeping fallback.');
          }
        } catch (e) {
          console.warn('Catalog fetch error — keeping fallback.', e);
        }

        // Restore cart/contact
        try {
          var saved = JSON.parse(localStorage.getItem('coast_cart') || '{}');
          if (saved.services) this.cartServices = saved.services;
          if (saved.addons) this.cartAddons = saved.addons;
          if (saved.plan) this.plan = saved.plan;
          if (saved.contact) this.contact = Object.assign({}, this.contact, saved.contact);
        } catch (e) {}

        // Sticky CTA
        var self = this;
        function onScroll() { self.stickyCta = window.scrollY > 640; }
        onScroll();
        window.addEventListener('scroll', onScroll);
      },

      // --- COMPUTEDS ---
      get total() {
        var self = this;
        var baseSum = this.cartServices.reduce(function (sum, key) {
          var svc = self.services.find(function (x) { return x.key === key; });
          return sum + ((svc && svc.base && svc.base[self.plan]) ? svc.base[self.plan] : 0);
        }, 0);
        var addonSum = this.cartAddons.reduce(function (sum, id) {
          var a = self.addonIndex[id];
          return sum + (a && a.price ? (a.price[self.plan] || 0) : 0);
        }, 0);
        return baseSum + addonSum;
      },

      get visibleAddons() {
        var svc = this.services.find(function (s) { return s.key === (this.activeService || 'web'); }.bind(this));
        var items = (svc && Array.isArray(svc.addOns)) ? svc.addOns.slice() : [];
        var q = (this.addonQuery || '').trim().toLowerCase();
        if (q) {
          items = items.filter(function (a) {
            return (a.label && a.label.toLowerCase().includes(q)) ||
                   (a.desc && a.desc.toLowerCase().includes(q)) ||
                   (a.short && a.short.toLowerCase().includes(q));
          });
        }
        var self = this;
        if (this.sortBy === 'price-asc') items.sort(function (a, b) { return (a.price[self.plan] || 0) - (b.price[self.plan] || 0); });
        else if (this.sortBy === 'price-desc') items.sort(function (a, b) { return (b.price[self.plan] || 0) - (a.price[self.plan] || 0); });
        else if (this.sortBy === 'alpha') items.sort(function (a, b) { return (a.label || '').localeCompare(b.label || ''); });
        else items.sort(function (a, b) { return (b.popular ? 1 : 0) - (a.popular ? 1 : 0); });
        return items;
      },

      // --- HELPERS ---
      rebuildIndex: function () {
        var acc = {};
        this.services.forEach(function (svc) {
          (svc.addOns || []).forEach(function (a) {
            acc[a.id] = Object.assign({}, a, { service: svc.key });
          });
        });
        this.addonIndex = acc;
      },

      serviceName: function (key) {
        var svc = this.services.find(function (s) { return s.key === key; });
        return (svc && svc.name) || key;
      },

      serviceBase: function (key) {
        var svc = this.services.find(function (s) { return s.key === key; });
        return (svc && svc.base && svc.base[this.plan]) ? svc.base[this.plan] : 0;
      },

      fmtUSD: function (v) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
      },

      save: function () {
        localStorage.setItem('coast_cart', JSON.stringify({
          services: this.cartServices,
          addons: this.cartAddons,
          plan: this.plan,
          contact: this.contact
        }));
      },

      emailValid: function (e) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
      },

      // --- UI Actions ---
      setPlan: function (p) { this.plan = p; this.save(); },
      toggleService: function (key) {
        var i = this.cartServices.indexOf(key);
        if (i > -1) this.cartServices.splice(i, 1); else this.cartServices.push(key);
        this.save(); this.flash('Updated base services');
      },
      toggleAddon: function (id) {
        var svcKey = this.addonIndex[id] && this.addonIndex[id].service;
        var i = this.cartAddons.indexOf(id);
        if (i > -1) { this.cartAddons.splice(i, 1); this.flash('Removed add-on'); }
        else {
          if (svcKey && this.cartServices.indexOf(svcKey) === -1) {
            this.cartServices.push(svcKey);
            this.flash('Added “' + this.serviceName(svcKey) + '” base for this add-on.');
          }
          this.cartAddons.push(id); this.flash('Added add-on');
        }
        this.save();
      },
      toggleDesc: function (id) {
        var next = {}; for (var k in this.openDescs) next[k] = this.openDescs[k];
        next[id] = !this.openDescs[id]; this.openDescs = next;
      },
      quickPick: function (kind) {
        var maps = {
          essentials: { web:['web-seo','web-auto'], video:['vid-audio','vid-sizes'], events:['ev-digital','ev-media'], ugc:['ugc-captions','ugc-enhance'] },
          premium:    { web:['web-mvp','web-api','web-copy'], video:['vid-adv','vid-drone-p'], events:['ev-ven','ev-hybrid'], ugc:['ugc-repurpose','ugc-leads','ugc-views-20k'] }
        };
        var add = (maps[kind] && maps[kind][this.activeService]) || [];
        for (var i=0; i<add.length; i++) {
          var id = add[i];
          if (this.cartAddons.indexOf(id) === -1) {
            var svcKey = this.addonIndex[id] && this.addonIndex[id].service;
            if (svcKey && this.cartServices.indexOf(svcKey) === -1) this.cartServices.push(svcKey);
            this.cartAddons.push(id);
          }
        }
        this.save(); this.flash('Quick picks added');
      },
      openAddons: function (key) { this.activeService = key || 'web'; this.addonsOpen = true; },
      openBuilder: function () { this.builderOpen = true; },
      clearAll: function () { this.cartServices = []; this.cartAddons = []; this.save(); this.flash('Cleared cart'); },
      flash: function (text) {
        this.toast = { text: text, show: true };
        var self = this; setTimeout(function () { self.toast.show = false; }, 1400);
      },

      // --- CHECKOUT ---
      beginCheckout: async function () {
        try {
          if (this.isSubmitting) return;
          if (!this.cartServices.length) { this.flash('Add at least one Base Service.'); return; }
          if (!this.emailValid(this.contact.email)) { this.flash('Enter a valid email.'); return; }

          var cart = this.cartServices.map(function (svcKey) {
            var svc = this.services.find(function (s) { return s.key === svcKey; });
            var base = (svc && svc.base && svc.base[this.plan]) ? svc.base[this.plan] : 0;
            var addons = this.cartAddons
              .filter(function (id) { return (this.addonIndex[id] && this.addonIndex[id].service === svcKey); }.bind(this))
              .map(function (id) { var a = this.addonIndex[id]; return { id: id, name: a.label, price: a.price[this.plan] }; }.bind(this));
            return { service: svcKey, base: base, addons: addons };
          }.bind(this));

          var endpoint = (document.querySelector('meta[name="checkout-endpoint"]') || {}).content || '/api/checkout';
          this.isSubmitting = true;

          var r = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: this.plan, cart: cart, contact: Object.assign({}, this.contact) })
          });
          var out = {};
          try { out = await r.json(); } catch (e) {}
          if (!r.ok) throw new Error(out && out.error ? out.error : ('Checkout failed (' + r.status + ')'));

          if (out && out.url) {
            location.assign(out.url);
          } else if (out && out.id && window.Stripe) {
            var pk = (document.querySelector('meta[name="stripe-publishable-key"]') || {}).content;
            var stripe = window.Stripe(pk);
            var res = await stripe.redirectToCheckout({ sessionId: out.id });
            if (res.error) throw res.error;
          } else {
            throw new Error('Checkout response missing url');
          }
        } catch (e) {
          console.error(e);
          this.flash(e.message || 'Checkout failed.');
          this.isSubmitting = false;
        }
      }
    };
  };
})();
