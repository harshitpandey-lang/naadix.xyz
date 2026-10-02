const services = [
  [
    "Business websites",
    "A clear home for your business.",
    "For companies and service providers that need to explain their offer and turn interest into enquiries. Scope can include service pages, enquiry forms and a content management system.",
  ],
  [
    "Ecommerce stores",
    "From first product to checkout.",
    "For brands selling online. Product catalogues, categories, cart, checkout, payment integration, stock management and owner administration can be scoped around your store.",
  ],
  [
    "3D & animated websites",
    "Make your first impression move.",
    "For brands with a story worth exploring. Bespoke 3D shapes, interactive scenes and animated interfaces add depth, with mobile fallbacks and reduced-motion support.",
  ],
  [
    "Landing pages & portfolios",
    "One purpose. A sharper experience.",
    "For campaigns, creators and professionals. Focused messaging, selected work and a clear call to action help visitors understand what to do next.",
  ],
  [
    "Custom websites",
    "Built around how you work.",
    "For businesses needing more than standard pages. Booking, enquiries, content management and admin dashboards can be included after technical discovery.",
  ],
  [
    "Website redesigns",
    "Give your next chapter a better home.",
    "For businesses with an existing site. We review navigation, content, mobile usability and technical foundations, then scope a redesign and URL migration where needed.",
  ],
];
const faqs = [
  [
    "Can Naadix build a website for a business in my city?",
    "Yes. We offer remote website design and development across India. You can discuss your business website, ecommerce store, landing page or redesign by phone, WhatsApp or email without needing a local office visit.",
  ],
  [
    "How does remote website development work?",
    "Start with your business goals, audience and required features. We agree the scope and quotation, share design and development previews online, collect your feedback and coordinate testing, launch and handover.",
  ],
  [
    "What types of websites does Naadix build?",
    "Business and company websites, ecommerce stores, landing pages, portfolios, custom websites and redesigns. We also create 3D animated website experiences.",
  ],
  [
    "Do you build ecommerce stores?",
    "Yes. Catalogue, cart, checkout, payments, stock and administration requirements are agreed in the project scope. The platform is selected after reviewing your needs.",
  ],
  [
    "How much does a business website cost?",
    "Pricing depends on page count, design, content, integrations, ecommerce complexity and support requirements. Share your brief for a scoped quotation.",
  ],
  [
    "How long does development take?",
    "The schedule depends on the agreed scope and readiness of your content, assets and feedback. We discuss a realistic delivery plan before development starts.",
  ],
  [
    "Can I manage products or content myself?",
    "An owner dashboard or content management system can be included. Tell us which content or products you want to update so we can scope the right editing tools.",
  ],
  [
    "Do you work with businesses across India and worldwide?",
    "Yes. Naadix accepts remote website projects across India and worldwide. Collaboration can use online discussions, shared previews and digital handover.",
  ],
  [
    "Can you redesign my existing website?",
    "Yes. Share the current URL, what is working and what needs to change. We can assess design, content, usability and migration requirements.",
  ],
  [
    "Are websites mobile-friendly?",
    "Responsive layouts are part of our website design approach. Navigation, forms and content are checked at mobile, tablet and desktop sizes.",
  ],
  [
    "What SEO setup is included?",
    "Technical SEO can cover page titles, descriptions, crawlable content, canonical URLs, sitemap, structured data and performance checks. The exact checklist is agreed in your quotation. Ongoing SEO is a separate scope; rankings and traffic are not guaranteed.",
  ],
  [
    "Are hosting and maintenance included?",
    "Domain, hosting, payment-provider fees and maintenance arrangements must be confirmed in your quotation. Ask us to identify included services, recurring costs and responsibility for updates.",
  ],
];
export function websiteSchema(c) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": c.domain + "/web#page",
      url: c.domain + "/web",
      name: "Website Design & Development in India",
      about: { "@id": c.domain + "/web#service" },
      publisher: { "@id": c.domain + "/#organization" },
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": c.domain + "/web#service",
      name: "Website design and development",
      serviceType:
        "Business websites, ecommerce stores, custom websites, 3D animated websites and technical SEO",
      provider: { "@id": c.domain + "/#organization" },
      areaServed: [{ "@type": "Country", name: "India" }, "Worldwide"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Website services",
        itemListElement: services.map(([name, , description]) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name,
            description,
            provider: { "@id": c.domain + "/#organization" },
          },
        })),
      },
      description:
        "Website design and development for businesses across India and worldwide.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": c.domain + "/web#faqs",
      mainEntity: faqs.map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    },
  ];
}
const cta = (text = "Get a Website Quote") =>
  `<a class="w-button" href="#quote">${text} <span aria-hidden="true">↗</span></a>`;
const directContact = (c, cls = "") =>
  `<div class="w-direct-contact ${cls}" aria-label="Contact Naadix directly"><a class="w-whatsapp" href="${c.whatsapp}">WhatsApp us <span aria-hidden="true">&#8599;</span></a><a href="tel:${c.phone}">Call us <span aria-hidden="true">&#8599;</span></a><a href="mailto:${c.email}">Email us <span aria-hidden="true">&#8599;</span></a></div>`;
export function websitePage(c) {
  return `<div class="web-shell">
 <nav class="w-subnav" aria-label="Website services"><a href="#services">Services</a><a href="#preview">Design previews</a><a href="#process">Process</a><a href="#faqs">FAQs</a><a href="#quote">Contact ↗</a></nav>
 <section class="w-hero"><div class="w-hero-copy"><p class="w-kicker"><span class="w-dot"></span> INDIA · AVAILABLE WORLDWIDE</p><h1>Website Design &amp; Development <em>for your business.</em></h1><p class="w-hero-lede">Business websites. Ecommerce stores.<br>Extraordinary digital experiences.</p><p class="w-intro">Naadix is an India-based website design and development agency. We build business websites, ecommerce stores, and custom websites for clients across India and worldwide.</p><div class="w-actions">${cta()}<a href="#services" class="w-text-link">Explore our services <span aria-hidden="true">↓</span></a></div>${directContact(c)}<p class="w-contact-hint">Have a website in mind? Call or message us directly.</p><div class="w-area"><p id="web-area" aria-live="polite">Serving businesses across India and worldwide.</p><details id="web-area-controls" hidden><summary>Change your area</summary><form id="web-area-form"><label for="web-city">Your city</label><div class="w-area-fields"><input id="web-city" name="city" autocomplete="address-level2" maxlength="80" required placeholder="Enter your city"><button type="submit">Apply</button><button id="web-area-reset" type="button">Reset</button></div><p id="web-area-error" role="alert"></p></form><p class="w-note">Area is approximate. We deliver remotely across India and worldwide. <a href="/privacy/">Privacy information</a>.</p></details></div></div>
 <div class="w-stage" aria-label="Illustrative 3D website interfaces and floating geometric shapes"><div class="w-grid" aria-hidden="true"></div><div class="w-orbit" aria-hidden="true"></div><div class="w-scene" aria-hidden="true"><div class="w-sphere"></div><div class="w-ring"></div><div class="w-diamond"></div><div class="w-browser"><div class="w-browser-bar"><i></i><i></i><i></i><span>YOUR NEXT DIGITAL EXPERIENCE</span></div><div class="w-browser-body"><div class="w-mock-nav">STUDIO / 01 <span>MENU +</span></div><div class="w-mock-title">A different<br>dimension.</div><div class="w-mock-orb"></div><div class="w-mock-bottom"><span>DESIGNED TO CONNECT</span><span>EXPLORE ↗</span></div></div></div><div class="w-store"><span>ONLINE STORE / CONCEPT</span><div class="w-product"></div><strong>Something exceptional.</strong><div class="w-store-bottom">Made for your brand <b>+</b></div></div><div class="w-code">&lt; ideas become experiences /&gt;</div></div><div class="w-stage-caption"><span>WEB / COMMERCE / MOTION</span><button id="web-motion" type="button" hidden aria-pressed="false">Pause motion</button></div></div></section>
 <div class="w-strip"><span>DESIGN WITH PURPOSE</span><span>DEVELOPMENT WITH DEPTH</span><span>SEO FROM THE FOUNDATION</span></div>
 <section id="services" class="w-section"><div class="w-section-head"><p class="w-kicker">01 / WHAT WE BUILD</p><h2>Your business.<br><em>A better digital presence.</em></h2><p>From a focused first website to an online store or an immersive 3D experience, we build around what your business needs.</p></div><div class="w-services">${services.map(([title, tag, desc], i) => `<article><div class="w-card-top"><span>0${i + 1}</span><span aria-hidden="true">${["↗", "◈", "◎", "▣", "⌘", "↻"][i]}</span></div><h3>${title}</h3><p class="w-card-tag">${tag}</p><p>${desc}</p><a href="#quote" data-service="${title}">Discuss ${title.toLowerCase()} <span aria-hidden="true">↗</span></a></article>`).join("")}</div></section>
 <section id="preview" class="w-section w-preview"><div class="w-section-head"><p class="w-kicker">02 / EXPLORE THE POSSIBILITIES</p><h2>More than a page.<br><em>An experience.</em></h2><p>Illustrative design directions, created to show what your next website could feel like. These are concepts, not client projects.</p></div><div class="w-preview-grid"><article class="w-preview-card"><div class="w-example w-example-brand"><span>IDENTITY / DIGITAL</span><strong>Make<br>your mark<span>.</span></strong><div class="w-example-ring"></div><small>CONCEPT 01 / BUSINESS WEBSITE</small></div><h3>Confident brand presence</h3><p>Clear service navigation, memorable typography and a focused enquiry journey.</p></article><article class="w-preview-card"><div class="w-example w-example-store"><span>OBJECTS / EVERYDAY</span><div class="w-vase"></div><strong>Considered.<br>Collected.</strong><small>CONCEPT 02 / ECOMMERCE</small></div><h3>A store worth exploring</h3><p>Product-led layouts, considered collections and a direct path to checkout.</p></article></div></section>
 <section class="w-section w-seo"><div><p class="w-kicker">03 / SEO EXPERTISE</p><h2>Built to be found.<br><em>Designed to be understood.</em></h2><p>Our SEO work starts with the foundations: clear content, crawlable pages, mobile usability and sound technical implementation.</p>${cta("Discuss your SEO needs")}</div><div class="w-seo-list"><article><span>01</span><div><h3>Technical SEO</h3><p>Metadata, canonical URLs, sitemap, indexability and accurate structured data, scoped to your site.</p></div></article><article><span>02</span><div><h3>Content & structure</h3><p>Useful service descriptions, logical headings and internal links that help people and search engines understand your business.</p></div></article><article><span>03</span><div><h3>Performance & usability</h3><p>Responsive layouts, accessible interactions and lightweight motion. Performance is measured, not assumed.</p></div></article><p class="w-note">Ongoing SEO is quoted separately. Search rankings, traffic and sales depend on many factors and cannot be guaranteed.</p></div></section>
 <section id="process" class="w-section"><div class="w-section-head"><p class="w-kicker">04 / FROM IDEA TO LIVE</p><h2>A clear process.<br><em>At every step.</em></h2></div><ol class="w-process">${[
   [
     "Discovery",
     "Tell us about your business, audience, goals and existing site.",
   ],
   [
     "Scope & quotation",
     "Agree pages, features, responsibilities, costs and delivery milestones.",
   ],
   ["Design", "Review the visual direction, page layouts and visitor journey."],
   [
     "Development",
     "Build responsive pages and the integrations agreed in the scope.",
   ],
   [
     "Testing",
     "Check layouts, forms, accessibility and technical SEO before launch.",
   ],
   [
     "Launch & handover",
     "Publish the approved site and hand over agreed assets and editing guidance.",
   ],
 ]
   .map(
     ([t, d], i) => `<li><span>0${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`,
   )
   .join(
     "",
   )}</ol><p class="w-note">You supply your business details, brand assets, content and feedback. Content creation, revisions, support, ownership and ongoing maintenance are confirmed in the quotation.</p></section>
 <section class="w-section w-scope"><div><p class="w-kicker">05 / YOUR PROJECT, YOUR SCOPE</p><h2>What does<br><em>a website cost?</em></h2></div><div><p>There is no useful one-size-fits-all price. Page count, design, content, integrations, ecommerce complexity and ongoing support determine the scope.</p><p>Share your goals and we can discuss a quotation with clear deliverables. Domain, hosting, payment-provider fees and maintenance arrangements are confirmed before you proceed.</p><div class="w-location"><span class="w-dot"></span><h3>Website development for businesses across India</h3><p>Naadix offers website design and development across India, with remote collaboration from the first discussion to launch. Your business can request a website without needing an agency office in your city.</p><p>For a service business, we can scope service descriptions, enquiry forms and booking features. For a retailer or product brand, we can scope an ecommerce catalogue, product management, payments and checkout. For an independent professional, a portfolio or focused landing page can make your work and contact options easier to find.</p><p>Share your audience, preferred language, content and project requirements by phone, WhatsApp or email. Online discussions and shared previews let you review the work before launch. Regional-language content, integrations and maintenance are confirmed in your quotation. We also accept remote projects worldwide.</p></div></div></section>
 <section id="faqs" class="w-section"><div class="w-section-head"><p class="w-kicker">06 / GOOD QUESTIONS</p><h2>Before we<br><em>build together.</em></h2></div><div class="w-faq">${faqs.map(([q, a]) => `<details><summary>${q}<span aria-hidden="true">+</span></summary><p>${a}</p></details>`).join("")}</div></section>
 <section id="quote" class="w-section w-contact"><div><p class="w-kicker">07 / LET’S MAKE IT HAPPEN</p><h2>Your next website<br><em>starts here.</em></h2><p>Tell us what you have in mind. A new business website, an online store, a redesign or something entirely your own.</p>${directContact(c)}<p class="w-contact-details"><a href="tel:${c.phone}">${c.phoneDisplay}</a><a class="w-email" href="mailto:${c.email}">${c.email}</a></p><p class="w-note">This form prepares a draft for your email app. Review and send it yourself. Your details are used to respond to your enquiry. <a href="/privacy/">Privacy information</a>.</p></div><div class="w-form-wrap"><form id="web-quote-form"><div class="w-form-grid"><label>Your name<input name="name" autocomplete="name" required maxlength="100"></label><label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Business name<input name="company" autocomplete="organization" required maxlength="120"></label><label>Website type<select name="interest" required><option value="">Select a service</option>${services.map(([t]) => `<option>${t}</option>`).join("")}<option>SEO services</option></select></label></div><label>Tell us about your project<textarea name="workflow" rows="4" required minlength="20" maxlength="2000" placeholder="Your goals, pages, features and anything we should know…"></textarea></label><div class="w-form-grid"><label>Budget range (optional)<input name="budget" maxlength="100" placeholder="Amount and currency"></label><label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label></div><label class="w-consent"><input name="consent" type="checkbox" required> I agree to be contacted about this enquiry.</label><button class="w-button" type="submit" disabled>Prepare email brief ↗</button><p id="web-form-status" role="status" aria-live="polite"></p><noscript><p>Please use the email link to request your quote.</p></noscript></form><div id="web-brief" hidden tabindex="-1"><h3>Your brief is ready to review.</h3><p>Nothing has been sent. Open the draft and send it from your email app.</p><pre id="web-brief-text"></pre><a id="web-send" class="w-button">Open email draft ↗</a><button id="web-edit" class="w-text-link" type="button">Edit your brief</button></div></div></section>${directContact(c, "w-mobile-contact")}</div>`;
}
