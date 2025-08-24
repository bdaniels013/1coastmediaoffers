// Service Categories and Data
window.serviceData = {
  serviceCategories: {
    signature: {
      description: "Our flagship services designed for maximum impact and fastest ROI.",
      services: [
        {
          key: 'launch-funnel',
          name: '48-Hour Launch Funnel',
          outcome: 'Live funnel capturing leads in 48 hours',
          deliverables: [
            'Landing page with lead magnet',
            'Email sequence (5 emails)',
            'Thank you page with upsell',
            'Analytics tracking setup'
          ],
          price: { oneTime: 800, monthly: 0 },
          sla: '48 hours',
          acceptance: 'Funnel live and capturing leads',
          guarantee: '100% money back if not live in 48 hours',
          badge: 'Fastest ROI',
          dependencies: ['web'],
          dependencyReason: 'A landing page requires web hosting and domain setup'
        },
        {
          key: 'local-authority',
          name: 'Local Authority Sprint',
          outcome: 'Dominate local search in 30 days',
          deliverables: [
            'Google Business Profile optimization',
            'Local citation building (15 sites)',
            'Review generation system',
            'Local content strategy'
          ],
          price: { oneTime: 1200, monthly: 400 },
          sla: '30 days',
          acceptance: 'Top 3 for primary keyword',
          guarantee: 'Top 5 ranking or full refund',
          badge: 'Local Favorite',
          dependencies: ['web'],
          dependencyReason: 'Local SEO optimization requires an existing website to optimize'
        }
      ]
    },
    core: {
      description: "Essential services every business needs to establish their digital presence.",
      services: [
        {
          key: 'web',
          name: 'Web & App',
          outcome: 'Professional website that converts visitors to customers',
          deliverables: [
            'Mobile-first responsive design',
            'Contact forms with lead routing',
            'Basic SEO optimization',
            'SSL certificate and hosting setup'
          ],
          price: { oneTime: 800, monthly: 200 },
          sla: '5-7 days',
          acceptance: 'Site live and mobile-optimized',
          badge: 'Best Seller'
        },
        {
          key: 'video',
          name: 'Video Production',
          outcome: 'Professional video content that engages your audience',
          deliverables: [
            '1-2 minute edited video',
            'Professional color grading',
            'Captions and titles',
            'Multiple format exports'
          ],
          price: { oneTime: 1200, monthly: 800 },
          sla: '7-10 days',
          acceptance: 'Final video delivered in all formats',
          dependencies: ['web'],
          dependencyReason: 'Professional videos need a website or platform for optimal hosting and delivery'
        }
      ]
    },
    oneTime: {
      description: "Quick wins and specific projects to boost your business immediately.",
      services: [
        {
          key: 'seo-audit',
          name: 'SEO Audit & Fix',
          outcome: 'Improved search rankings and site performance',
          deliverables: [
            'Complete technical SEO audit',
            'Priority fixes implemented',
            'Performance optimization',
            'Ranking improvement report'
          ],
          price: { oneTime: 400, monthly: 0 },
          sla: '3-5 days',
          acceptance: 'All critical issues resolved',
          dependencies: ['web'],
          dependencyReason: 'SEO audit requires an existing website to analyze and optimize'
        }
      ]
    },
    monthly: {
      description: "Ongoing services to maintain and grow your digital presence.",
      services: [
        {
          key: 'content-management',
          name: 'Content Management',
          outcome: 'Consistent, engaging content that builds your brand',
          deliverables: [
            '8 social media posts per month',
            '2 blog articles',
            'Email newsletter',
            'Performance analytics report'
          ],
          price: { oneTime: 0, monthly: 600 },
          minTerm: '3 months',
          sla: 'Weekly deliveries',
          acceptance: 'All content published on schedule',
          dependencies: ['web'],
          dependencyReason: 'Content management requires a website for blog posts and analytics tracking'
        }
      ]
    }
  },

  // Bundles
  bundles: [
    {
      key: 'startup-package',
      name: 'Startup Package',
      description: 'Everything you need to launch your business online',
      includes: ['Web & App', 'SEO Audit', 'Content Management (3 months)'],
      price: { oneTime: 1000, monthly: 600 }
    }
  ],

  // Add-ons data (if needed for the dependency modal)
  addons: [
    {
      key: 'rush-delivery',
      name: 'Rush Delivery',
      description: 'Cut delivery time in half',
      price: { oneTime: 200, monthly: 0 },
      applicableServices: ['web', 'video', 'seo-audit']
    },
    {
      key: 'extra-revisions',
      name: 'Extra Revisions',
      description: '3 additional revision rounds',
      price: { oneTime: 150, monthly: 0 },
      applicableServices: ['web', 'video']
    },
    {
      key: 'priority-support',
      name: 'Priority Support',
      description: '24/7 priority support channel',
      price: { oneTime: 0, monthly: 100 },
      applicableServices: ['all']
    }
  ]
};