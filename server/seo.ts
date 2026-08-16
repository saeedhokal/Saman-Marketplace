import { storage } from "./storage";
import { SEO_PAGES, findSeoPageByPath, seoPageAbsoluteUrl, seoPageAltUrl, type SeoPage } from "../shared/seo-pages";
import { MAIN_CATEGORIES, SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const SITE_URL = "https://thesamanapp.com";

/**
 * Serialize an object to JSON that is safe to embed inside a
 * <script type="application/ld+json"> block in an HTML page.
 * JSON.stringify alone is not safe: a title like "</script><script>evil()"
 * would terminate the block. We escape the four characters that can break
 * the HTML parser or be misread as markup inside a script element.
 */
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeAttr(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mapCondition(condition: string | null | undefined): string {
  switch ((condition || "").toLowerCase()) {
    case "new": return "https://schema.org/NewCondition";
    case "refurbished": return "https://schema.org/RefurbishedCondition";
    case "used":
    default: return "https://schema.org/UsedCondition";
  }
}

export async function getProductJsonLd(productId: number): Promise<string | null> {
  try {
    const product = await storage.getProduct(productId);
    if (!product || product.status !== "approved") return null;

    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (Array.isArray(product.imageUrls)) {
      for (const u of product.imageUrls) {
        if (u && !images.includes(u)) images.push(u);
      }
    }

    const ld: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.title,
      "description": product.description,
      "image": images,
      "url": `${SITE_URL}/product/${product.id}`,
      "category": [product.mainCategory, product.subCategory].filter(Boolean).join(" > "),
      "itemCondition": mapCondition(product.condition),
      "brand": {
        "@type": "Brand",
        "name": product.subCategory || "Saman Marketplace"
      }
    };

    if (product.price && product.price > 0) {
      ld.offers = {
        "@type": "Offer",
        "url": `${SITE_URL}/product/${product.id}`,
        "priceCurrency": "AED",
        "price": product.price,
        "availability": "https://schema.org/InStock",
        "itemCondition": mapCondition(product.condition),
        "areaServed": "AE"
      };
    }

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": product.mainCategory, "item": `${SITE_URL}/categories` },
        { "@type": "ListItem", "position": 3, "name": product.title, "item": `${SITE_URL}/product/${product.id}` }
      ]
    };

    return (
      `<script type="application/ld+json">${safeJsonLd(ld)}</script>` +
      `<script type="application/ld+json">${safeJsonLd(breadcrumb)}</script>`
    );
  } catch {
    return null;
  }
}

function buildLandingJsonLd(page: SeoPage): string {
  const url = seoPageAbsoluteUrl(page);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": page.lang === "ar" ? "الرئيسية" : "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": page.h1, "item": url },
    ],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.title,
    "description": page.metaDescription,
    "url": url,
    "inLanguage": page.lang === "ar" ? "ar-AE" : "en-AE",
    "isPartOf": { "@type": "WebSite", "name": "Saman Marketplace", "url": `${SITE_URL}/` },
    "about": { "@type": "Thing", "name": page.h1 },
    "keywords": page.keywords.join(", "),
  };

  return [
    `<script type="application/ld+json">${safeJsonLd(webpage)}</script>`,
    `<script type="application/ld+json">${safeJsonLd(breadcrumb)}</script>`,
    `<script type="application/ld+json">${safeJsonLd(faq)}</script>`,
  ].join("");
}

function buildLandingBodyContent(page: SeoPage): string {
  const dir = page.lang === "ar" ? "rtl" : "ltr";
  const sectionsHtml = page.sections
    .map(
      (s) =>
        `<section><h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.body)}</p></section>`
    )
    .join("");
  const faqsHtml = page.faqs
    .map(
      (f) =>
        `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`
    )
    .join("");
  const relatedHtml = page.related
    .map((r) => `<li><a href="${escapeAttr(r.href)}">${escapeHtml(r.text)}</a></li>`)
    .join("");

  // Rendered inside <div id="root"> so crawlers see real text; React replaces
  // this content on mount with the styled SeoLanding component.
  return (
    `<div id="seo-prerender" lang="${page.lang}" dir="${dir}" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
    `<h1>${escapeHtml(page.h1)}</h1>` +
    `<p>${escapeHtml(page.intro)}</p>` +
    sectionsHtml +
    `<h2>${page.lang === "ar" ? "أسئلة شائعة" : "Frequently asked questions"}</h2>` +
    faqsHtml +
    `<h2>${page.lang === "ar" ? "روابط مرتبطة" : "Related pages"}</h2>` +
    `<ul>${relatedHtml}</ul>` +
    `<p><a href="${escapeAttr(page.primaryCta.href)}">${escapeHtml(page.primaryCta.text)}</a> &middot; ` +
    `<a href="${escapeAttr(page.secondaryCta.href)}">${escapeHtml(page.secondaryCta.text)}</a> &middot; ` +
    `<a href="/downloads">${page.lang === "ar" ? "حمّل التطبيق" : "Download the app"}</a></p>` +
    `</div>`
  );
}

export type SeoHead = {
  jsonLd?: string;
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  bodyContent?: string;
  altLangUrl?: string;
  altLangCode?: string;
  htmlLang?: string;
  htmlDir?: "rtl" | "ltr";
};

// ─── Category browse pages ────────────────────────────────────────────────────

type CategoryProduct = { id: number; title: string; price?: number | null };

function buildCategoryJsonLd(
  mainCategory: string | null,
  products: CategoryProduct[],
): string {
  const url = mainCategory
    ? `${SITE_URL}/categories?tab=${mainCategory === "Spare Parts" ? "spare-parts" : "automotive"}`
    : `${SITE_URL}/categories`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": mainCategory ? `${mainCategory} on Saman Marketplace` : "Browse Categories — Saman Marketplace",
    "url": url,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.title,
      "url": `${SITE_URL}/product/${p.id}`,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": mainCategory || "Browse", "item": url },
    ],
  };

  return (
    `<script type="application/ld+json">${safeJsonLd(itemList)}</script>` +
    `<script type="application/ld+json">${safeJsonLd(breadcrumb)}</script>`
  );
}

function buildCategoryBodyContent(
  mainCategory: string | null,
  subcategories: readonly string[],
  products: CategoryProduct[],
): string {
  const tabSlug = mainCategory === "Spare Parts" ? "spare-parts" : "automotive";

  // When no mainCategory: render both category cards as hub links
  if (!mainCategory) {
    const categoryLinksHtml = MAIN_CATEGORIES.map((cat) => {
      const slug = cat === "Spare Parts" ? "spare-parts" : "automotive";
      return `<li><a href="/categories?tab=${slug}">${escapeHtml(cat)}</a></li>`;
    }).join("");

    return (
      `<div id="seo-prerender" lang="en" dir="ltr" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
      `<h1>Browse Categories</h1>` +
      `<p>Shop UAE's largest auto parts and vehicles marketplace. Choose a category to get started.</p>` +
      `<ul>${categoryLinksHtml}</ul>` +
      `<p><a href="/downloads">Download the Saman app</a> &middot; <a href="/">Back to home</a></p>` +
      `</div>`
    );
  }

  // Subcategory links
  const subcatHtml = subcategories
    .map((sub) => `<li><a href="/categories?tab=${tabSlug}&subCategory=${encodeURIComponent(sub)}">${escapeHtml(sub)}</a></li>`)
    .join("");

  // Product listing links (approved only, capped at 30)
  const listingsHtml = products
    .slice(0, 30)
    .map(
      (p) =>
        `<li><a href="/product/${p.id}">${escapeHtml(p.title)}</a>` +
        (p.price && p.price > 0 ? ` — AED ${escapeHtml(String(p.price))}` : "") +
        `</li>`,
    )
    .join("");

  return (
    `<div id="seo-prerender" lang="en" dir="ltr" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
    `<h1>${escapeHtml(mainCategory)}</h1>` +
    `<p>Browse ${escapeHtml(mainCategory)} listings on Saman Marketplace — the UAE's auto parts and vehicles marketplace.</p>` +
    `<h2>Browse by subcategory</h2>` +
    `<ul>${subcatHtml}</ul>` +
    (listingsHtml
      ? `<h2>Latest listings</h2><ul>${listingsHtml}</ul>`
      : "") +
    `<p><a href="/categories">All categories</a> &middot; <a href="/downloads">Download the app</a></p>` +
    `</div>`
  );
}

// ─── Subcategory description map ─────────────────────────────────────────────

/**
 * 2–3 sentence intro paragraphs for each subcategory page, keyed by
 * [mainCategory][subCategory].  Used inside <div id="seo-prerender"> so
 * Google sees keyword-rich body copy specific to the brand or part type.
 */
const SUBCATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "Spare Parts": {
    // ── Part types ──────────────────────────────────────────────────────────
    "Universal": "Universal car parts are compatible with most makes and models, making them the go-to choice for mechanics and DIY enthusiasts across the UAE. Browse air filters, oil filters, belts, gaskets, and general maintenance components suited to any vehicle on UAE roads. Shop UAE's widest selection of universal spare parts at competitive prices on Saman Marketplace.",
    "Rims": "Upgrade your vehicle's look and performance with quality rims and alloy wheels in the UAE. Browse a wide selection of OEM and aftermarket rims for all car makes and wheel sizes — from 15-inch steel wheels to 22-inch forged alloys. Find the perfect set of wheels to match your style and budget on Saman Marketplace.",
    "Tires": "Find new and used tires for all vehicle types and sizes in the UAE, from compact sedans to heavy-duty 4x4s. Browse all-season, performance, run-flat, and off-road tyres from top brands at competitive prices. Saman Marketplace connects tyre buyers and sellers across Dubai, Abu Dhabi, Sharjah, and all Emirates.",
    "Turbos & Superchargers": "Boost your engine's power with turbos, superchargers, and forced-induction components sourced from sellers across the UAE. Browse OEM replacement turbochargers, aftermarket turbo kits, intercoolers, and boost controllers for all popular car brands. Whether you're upgrading for performance or replacing a worn unit, find the best forced-induction parts on Saman Marketplace.",
    "Lights": "Illuminate the road and enhance your car's look with quality headlights, tail lights, fog lights, and LED upgrades available in the UAE. Shop OEM replacement lights and aftermarket lighting upgrades — projector headlights, DRL strips, xenon kits, and full lighting assemblies — for all makes. Find the lighting solution you need at the best price on Saman Marketplace.",
    "ECU": "Find Engine Control Units and engine management components for all major car brands in the UAE. Browse OEM ECUs, performance chips, and aftermarket tuning modules to restore, replace, or upgrade your vehicle's electronic brain. Saman Marketplace is the UAE's go-to source for ECU and engine management parts from trusted sellers.",
    "Other": "Browse miscellaneous and hard-to-find spare parts for all vehicle makes and models in the UAE. From interior trim pieces and body panels to mechanical components and accessories, find specialty auto parts at competitive prices. Saman Marketplace connects buyers with spare-parts sellers across the UAE.",
    "Motorcycles": "Find motorcycle parts, fairings, exhausts, tyres, and accessories for all popular bike brands in the UAE. Whether you ride a sportbike, cruiser, adventure tourer, or scooter, browse OEM and aftermarket components to keep your bike running at its best. Saman Marketplace is UAE's marketplace for buying and selling motorcycle spare parts.",
    "Offroad": "Source off-road vehicle parts including lift kits, skid plates, recovery gear, and drivetrain components for 4x4s and dune buggies in the UAE. Browse parts suited to the UAE's desert terrain — from heavy-duty suspension upgrades to sand-ready tyres. Find quality off-road parts from trusted UAE sellers on Saman Marketplace.",
    "ATV": "Shop ATV (All-Terrain Vehicle) parts, engines, tyres, and accessories for quad bikes used across the UAE's desert and mountain trails. Browse OEM and aftermarket ATV parts for brands like Yamaha, Honda, Polaris, and Can-Am. Saman Marketplace is the UAE's destination for buying and selling ATV spare parts.",
    "UTV": "Find UTV (Utility Task Vehicle) parts, cages, axles, and accessories for side-by-sides in the UAE. Browse replacement and performance components for popular UTV brands suited to desert driving and adventure use. Shop and sell UTV spare parts on Saman Marketplace, the UAE's auto parts marketplace.",
    "Jet Ski": "Browse Jet Ski and personal watercraft parts, engines, pumps, and accessories in the UAE. Find OEM and aftermarket components for popular brands like Sea-Doo, Yamaha WaveRunner, and Kawasaki Jet Ski. Saman Marketplace connects Jet Ski parts buyers and sellers across the UAE's coastal and inland waterways.",

    // ── Car brands ───────────────────────────────────────────────────────────
    "Acura": "Find genuine and aftermarket Acura spare parts in the UAE, including components for popular models like the MDX, RDX, and TLX. Acura's precision-engineered parts maintain the performance and reliability that the brand is known for on UAE roads. Browse Acura spare parts listings from trusted UAE sellers on Saman Marketplace.",
    "Alfa Romeo": "Source Alfa Romeo spare parts in the UAE for models including the Giulia, Stelvio, and Tonale. Keep your Alfa Romeo performing at its Italian best with quality OEM and aftermarket components available from UAE sellers. Find Alfa Romeo parts at competitive prices on Saman Marketplace.",
    "Audi": "Browse Audi spare parts in the UAE for the full model range — A3, A4, A6, Q5, Q7, Q8, and more. Genuine Audi OEM parts and quality aftermarket components keep your Audi running with Vorsprung durch Technik reliability. Find Audi spare parts from UAE sellers at the best prices on Saman Marketplace.",
    "Bentley": "Source Bentley spare parts in the UAE for the Continental GT, Flying Spur, and Bentayga. Genuine Bentley OEM components and specialist aftermarket parts ensure your handcrafted luxury car maintains its exceptional standard. Browse Bentley spare parts listings in the UAE on Saman Marketplace.",
    "BMW": "Find BMW spare parts in the UAE for all series — 3 Series, 5 Series, 7 Series, X5, X7, and the full M lineup. Genuine BMW and quality aftermarket components keep your Bimmer performing at its engineered best on UAE roads. Browse BMW spare parts from trusted UAE sellers on Saman Marketplace.",
    "Cadillac": "Browse Cadillac spare parts in the UAE for the Escalade, CT5, XT5, and other models. OEM and quality aftermarket Cadillac parts maintain the American luxury performance your vehicle was built for. Find Cadillac spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Chevrolet": "Find Chevrolet spare parts in the UAE for popular models including the Camaro, Tahoe, Suburban, Silverado, and Captiva. OEM and aftermarket GM parts keep your Chevy running strong in UAE conditions. Browse Chevrolet spare parts from trusted sellers across the Emirates on Saman Marketplace.",
    "Citroen": "Source Citroen spare parts in the UAE for the C3, C4, C5 Aircross, and Berlingo range. Genuine and aftermarket Citroen components ensure your French car stays reliable on UAE roads. Find Citroen spare parts at competitive prices on Saman Marketplace.",
    "Dodge": "Browse Dodge spare parts in the UAE for the Challenger, Charger, Durango, and Ram. OEM and aftermarket Dodge Mopar parts keep your muscle car or SUV performing at full power. Find Dodge spare parts from UAE sellers at the best prices on Saman Marketplace.",
    "Ferrari": "Source Ferrari spare parts in the UAE for models including the 488, F8 Tributo, Roma, SF90, and Purosangue. Genuine Ferrari OEM and specialist aftermarket components maintain the prancing horse's legendary performance and exclusivity. Browse Ferrari spare parts listings in the UAE on Saman Marketplace.",
    "Fiat": "Find Fiat spare parts in the UAE for the 500, Tipo, Doblo, and Ducato range. OEM and aftermarket Fiat components keep your Italian compact car or commercial vehicle running smoothly on UAE roads. Browse Fiat spare parts from UAE sellers on Saman Marketplace.",
    "Ford": "Browse Ford spare parts in the UAE for the Mustang, F-150, Explorer, Expedition, Bronco, and Ranger. Quality OEM and aftermarket Ford parts ensure your truck, SUV, or sports car stays on the road. Find Ford spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Genesis": "Source Genesis spare parts in the UAE for the G70, G80, G90, GV70, and GV80. As Hyundai's luxury marque gains popularity in the UAE, quality OEM and aftermarket components are increasingly available. Browse Genesis spare parts listings from UAE sellers on Saman Marketplace.",
    "GMC": "Find GMC spare parts in the UAE for the Sierra, Yukon, Terrain, and Acadia. OEM and quality aftermarket GM parts keep your GMC truck or SUV performing reliably in UAE conditions. Browse GMC spare parts from trusted UAE sellers on Saman Marketplace.",
    "Honda": "Browse Honda spare parts in the UAE for the Civic, Accord, CR-V, HR-V, Pilot, and City. With Honda's massive popularity on UAE roads, quality OEM and aftermarket components are widely available. Find Honda spare parts at competitive prices from trusted UAE sellers on Saman Marketplace.",
    "Hyundai": "Find Hyundai spare parts in the UAE for the Elantra, Sonata, Tucson, Santa Fe, Palisade, and Staria. Hyundai's wide UAE market share means OEM and aftermarket parts are readily available at competitive prices. Browse Hyundai spare parts from trusted UAE sellers on Saman Marketplace.",
    "Infiniti": "Source Infiniti spare parts in the UAE for the Q50, Q60, QX60, QX80, and older G37 and FX models. Genuine Infiniti OEM and quality aftermarket parts maintain the Japanese luxury experience your car was designed for. Find Infiniti spare parts from UAE sellers on Saman Marketplace.",
    "Jaguar": "Browse Jaguar spare parts in the UAE for the F-Type, XF, XE, F-Pace, and I-Pace. Genuine Jaguar OEM and specialist aftermarket components keep your British luxury car performing with refinement and power. Find Jaguar spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Jeep": "Find Jeep spare parts in the UAE for the Wrangler, Grand Cherokee, Cherokee, Compass, and Gladiator. OEM and Mopar aftermarket parts keep your Jeep ready for both UAE highways and desert trails. Browse Jeep spare parts from trusted UAE sellers on Saman Marketplace.",
    "Kia": "Browse Kia spare parts in the UAE for the Sportage, Sorento, Telluride, Stinger, K5, and EV6. Kia's growing UAE presence means OEM and aftermarket components are widely available at great prices. Find Kia spare parts from trusted UAE sellers on Saman Marketplace.",
    "Lamborghini": "Source Lamborghini spare parts in the UAE for the Huracan, Aventador, Urus, and Revuelto. Genuine Lamborghini OEM and specialist aftermarket components maintain the performance and exclusivity of your supercar. Browse Lamborghini spare parts listings in the UAE on Saman Marketplace.",
    "Land Rover": "Find Land Rover spare parts in the UAE for the Range Rover, Range Rover Sport, Defender, Discovery, and Velar. OEM and quality aftermarket parts keep your Land Rover ready for UAE highways and desert expeditions alike. Browse Land Rover spare parts from trusted UAE sellers on Saman Marketplace.",
    "Lexus": "Browse Lexus spare parts in the UAE for the LX 600, GX, RX, ES, LS, IS, and NX series. Genuine Lexus OEM and quality aftermarket components maintain Toyota's luxury marque at its renowned reliability standards. Find Lexus spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Lincoln": "Source Lincoln spare parts in the UAE for the Navigator, Aviator, Nautilus, Corsair, and Continental. OEM and aftermarket Lincoln components keep your American luxury SUV or sedan performing at its refined best. Browse Lincoln spare parts listings from UAE sellers on Saman Marketplace.",
    "Maserati": "Find Maserati spare parts in the UAE for the Ghibli, Quattroporte, Levante, GranTurismo, MC20, and Grecale. Genuine Maserati OEM and specialist aftermarket parts maintain the Italian performance character your car demands. Browse Maserati spare parts from UAE sellers on Saman Marketplace.",
    "Mazda": "Browse Mazda spare parts in the UAE for the Mazda3, Mazda6, CX-5, CX-9, CX-30, and MX-5 Miata. Genuine Mazda and quality aftermarket components uphold the Jinba-ittai driving experience on UAE roads. Find Mazda spare parts at competitive prices from trusted UAE sellers on Saman Marketplace.",
    "Mercedes": "Find Mercedes spare parts in the UAE for the C-Class, E-Class, S-Class, G-Class, GLE, GLS, and the full AMG lineup. Genuine Mercedes-Benz and quality aftermarket parts keep your three-pointed star performing to its legendary standard. Browse Mercedes spare parts from trusted UAE sellers on Saman Marketplace.",
    "MG": "Source MG spare parts in the UAE for the ZS, HS, MG5, MG6, and MG4 EV. As MG's popularity grows rapidly in the UAE market, OEM and aftermarket components are increasingly available at competitive prices. Find MG spare parts from UAE sellers on Saman Marketplace.",
    "Mini": "Browse Mini spare parts in the UAE for the Cooper, Countryman, Clubman, and Convertible. Genuine Mini OEM and quality aftermarket parts keep your British icon performing with character on UAE streets. Find Mini spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Mitsubishi": "Find Mitsubishi spare parts in the UAE for the Pajero, Pajero Sport, Outlander, Lancer, L200, and Eclipse Cross. Mitsubishi's long-established UAE presence means quality OEM and aftermarket parts are widely available. Browse Mitsubishi spare parts from trusted UAE sellers on Saman Marketplace.",
    "Nissan": "Browse Nissan spare parts in the UAE for the Patrol, Altima, Maxima, X-Trail, Sentra, GT-R, and Navara. As one of the UAE's most popular brands, Nissan OEM and aftermarket parts are plentiful and competitively priced. Find Nissan spare parts from trusted UAE sellers on Saman Marketplace.",
    "Peugeot": "Source Peugeot spare parts in the UAE for the 208, 308, 3008, 508, 5008, and the e-series EVs. Genuine and aftermarket Peugeot components keep your French vehicle performing reliably on UAE roads. Find Peugeot spare parts at competitive prices from UAE sellers on Saman Marketplace.",
    "Porsche": "Find Porsche spare parts in the UAE for the 911, Cayenne, Macan, Panamera, Taycan, and 718 Boxster/Cayman. Genuine Porsche OEM and specialist aftermarket parts maintain the engineering excellence your sports car or SUV demands. Browse Porsche spare parts from UAE sellers on Saman Marketplace.",
    "Renault": "Browse Renault spare parts in the UAE for the Clio, Megane, Captur, Koleos, Duster, and Zoe. Genuine and aftermarket Renault components keep your French vehicle performing reliably on UAE roads. Find Renault spare parts at competitive prices from trusted UAE sellers on Saman Marketplace.",
    "Rolls Royce": "Source Rolls Royce spare parts in the UAE for the Phantom, Ghost, Cullinan, Wraith, Dawn, and Spectre. Genuine Rolls-Royce and specialist aftermarket components maintain the pinnacle of automotive luxury craftsmanship. Browse Rolls Royce spare parts listings in the UAE on Saman Marketplace.",
    "Subaru": "Find Subaru spare parts in the UAE for the Outback, Forester, WRX, WRX STI, BRZ, and Crosstrek. Quality Subaru OEM and aftermarket parts — including performance upgrades for the AWD platform — are available from UAE sellers. Browse Subaru spare parts at competitive prices on Saman Marketplace.",
    "Suzuki": "Browse Suzuki spare parts in the UAE for the Jimny, Vitara, Grand Vitara, Swift, Ciaz, and Ertiga. Suzuki's affordability extends to its spare parts market, with OEM and aftermarket components widely available in the UAE. Find Suzuki spare parts from trusted UAE sellers on Saman Marketplace.",
    "Tesla": "Source Tesla spare parts and components in the UAE for the Model 3, Model Y, Model S, Model X, and Cybertruck. As UAE's EV market grows, Tesla OEM and approved aftermarket parts are increasingly available from specialist sellers. Browse Tesla spare parts listings on Saman Marketplace.",
    "Toyota": "Find Toyota spare parts in the UAE for the Land Cruiser, Prado, Hilux, Camry, Corolla, RAV4, Fortuner, and more. Toyota's dominant position in the UAE market means OEM and aftermarket parts are plentiful and competitively priced. Browse Toyota spare parts from trusted UAE sellers on Saman Marketplace.",
    "Volkswagen": "Browse Volkswagen spare parts in the UAE for the Golf, Passat, Tiguan, Touareg, Atlas, and Jetta. Quality Volkswagen OEM and aftermarket parts keep your German-engineered vehicle reliable on UAE roads. Find VW spare parts at competitive prices from trusted UAE sellers on Saman Marketplace.",
    "Volvo": "Find Volvo spare parts in the UAE for the XC90, XC60, XC40, S90, S60, and V90 Cross Country. Genuine Volvo OEM and quality aftermarket components maintain the Swedish safety and reliability standards your car was built to. Browse Volvo spare parts from UAE sellers on Saman Marketplace.",
  },
  "Automotive": {
    // ── Car brands ───────────────────────────────────────────────────────────
    "Acura": "Browse Acura cars for sale in the UAE, including the MDX, RDX, TLX, Integra, and NSX. Acura combines Japanese reliability with luxury performance, making its models a sought-after choice in the UAE used-car market. List or find your Acura on Saman Marketplace, the UAE's auto marketplace.",
    "Alfa Romeo": "Find Alfa Romeo cars for sale in the UAE, including the Giulia, Stelvio, and Tonale. Italian design and spirited driving dynamics make Alfa Romeo a distinctive choice on UAE roads. Browse and list Alfa Romeo vehicles on Saman Marketplace.",
    "Audi": "Browse Audi cars for sale in the UAE, including the A4, A6, A8, Q5, Q7, Q8, and the full RS lineup. Audi's premium build quality and technology make it one of the UAE's most popular luxury car brands. Find your next Audi or list yours for sale on Saman Marketplace.",
    "Bentley": "Find Bentley cars for sale in the UAE, including the Continental GT, Flying Spur, and Bentayga SUV. Bentley's handcrafted British luxury and V8/W12 performance make it a prized vehicle in UAE's premium car market. Browse Bentley listings or sell yours on Saman Marketplace.",
    "BMW": "Browse BMW cars for sale in the UAE, including the 3 Series, 5 Series, 7 Series, X5, X7, and M-badged performance models. BMW's combination of dynamic driving, luxury, and iconic styling keeps it among the UAE's top-selling premium car brands. Find your next BMW or list yours on Saman Marketplace.",
    "BYD": "Find BYD electric vehicles for sale in the UAE, including the Atto 3, Seal, Han, Tang, and Dolphin. BYD's rapidly growing range of EVs and hybrids represents one of the fastest-growing segments in the UAE automotive market. Browse BYD listings or sell yours on Saman Marketplace.",
    "Cadillac": "Browse Cadillac cars for sale in the UAE, including the Escalade, CT5, XT5, and XT6. Cadillac's bold American luxury SUVs and sedans have a dedicated following among UAE buyers who want a distinctive alternative to European luxury brands. Find your next Cadillac on Saman Marketplace.",
    "CAN-AM": "Find Can-Am off-road and sport vehicles for sale in the UAE, including the Maverick X3, Defender, Commander, and Spyder. Can-Am's high-performance side-by-sides and three-wheelers are popular for UAE desert adventures. Browse Can-Am listings or list yours on Saman Marketplace.",
    "Chery": "Browse Chery cars for sale in the UAE, including the Tiggo 2, Tiggo 4, Tiggo 7, Tiggo 8, and Omoda 5. Chery's affordable and feature-rich SUVs are gaining traction among UAE buyers seeking value without compromise. Find your next Chery vehicle on Saman Marketplace.",
    "Chevrolet": "Find Chevrolet cars for sale in the UAE, including the Camaro, Tahoe, Suburban, Silverado, and Captiva. Chevy's powerful American trucks, muscle cars, and family SUVs are a popular choice across the UAE. Browse Chevrolet listings or sell yours on Saman Marketplace.",
    "Citroen": "Browse Citroen cars for sale in the UAE, including the C3, C4, C5 Aircross, and Berlingo. Citroen's distinctive French styling and comfort-focused suspension make these vehicles a unique choice in the UAE market. Find your next Citroen on Saman Marketplace.",
    "Dodge": "Find Dodge cars for sale in the UAE, including the Challenger, Charger, Durango, and Hornet. Dodge's iconic American muscle cars are prized by UAE enthusiasts for their powerful Hemi and Hellcat engines. Browse Dodge listings or sell yours on Saman Marketplace.",
    "Ferrari": "Browse Ferrari sports cars for sale in the UAE, including the 488, F8 Tributo, Roma, SF90 Stradale, Purosangue, and 296 GTB. Ferrari's Italian supercar heritage and V8/V12 performance make these rare and highly coveted in the UAE's prestigious car market. Find your Ferrari on Saman Marketplace.",
    "Fiat": "Find Fiat cars for sale in the UAE, including the 500, 500X, Tipo, and Doblo. Fiat's compact Italian styling and urban practicality make these vehicles a distinctive choice in the UAE. Browse Fiat listings or list yours on Saman Marketplace.",
    "Ford": "Browse Ford cars and trucks for sale in the UAE, including the Mustang, F-150, Explorer, Expedition, Bronco, and Ranger. Ford's diverse lineup of muscle cars, trucks, and SUVs enjoys strong demand in the UAE's used-vehicle market. Find your next Ford or sell yours on Saman Marketplace.",
    "Geely": "Find Geely cars for sale in the UAE, including the Coolray, Azkarra, Okavango, Tugella, and Monjaro. Geely's growing range of stylish and well-equipped SUVs is attracting UAE buyers looking for quality and value. Browse Geely listings on Saman Marketplace.",
    "Genesis": "Browse Genesis luxury cars for sale in the UAE, including the G80, G90, GV70, GV80, and GV80 Coupe. Genesis offers Korean luxury at competitive prices, making it an increasingly popular alternative to European premium brands in the UAE. Find your Genesis on Saman Marketplace.",
    "GMC": "Find GMC trucks and SUVs for sale in the UAE, including the Yukon, Yukon XL, Sierra, Terrain, and Acadia. GMC's premium American trucks and large SUVs are in high demand across the UAE, especially the Denali-trimmed models. Browse GMC listings or sell yours on Saman Marketplace.",
    "Great Wall": "Browse Great Wall vehicles for sale in the UAE, including the Haval H6, H9, Tank 300, Tank 500, and ORA EV models. Great Wall's expanding UAE lineup covers rugged SUVs and electric vehicles across accessible price points. Find your Great Wall vehicle on Saman Marketplace.",
    "Haval": "Find Haval SUVs for sale in the UAE, including the H6, H9, Jolion, Dargo, and the H6 Hybrid. Haval's feature-rich and affordably priced SUVs are growing in popularity among UAE families and fleet buyers. Browse Haval listings on Saman Marketplace.",
    "Honda": "Browse Honda cars for sale in the UAE, including the Civic, Accord, CR-V, Pilot, HR-V, and City. Honda's reputation for reliability and fuel efficiency makes it a perennial favourite in the UAE's new and used-car markets. Find your next Honda or sell yours on Saman Marketplace.",
    "Hyundai": "Find Hyundai cars for sale in the UAE, including the Elantra, Sonata, Tucson, Santa Fe, Palisade, and Staria. Hyundai's blend of modern design, technology, and competitive pricing makes it one of the UAE's best-selling car brands. Browse Hyundai listings or sell yours on Saman Marketplace.",
    "Infiniti": "Browse Infiniti cars for sale in the UAE, including the Q50, Q60, QX60, QX80, G37, and FX35. Infiniti's Japanese luxury and powerful V6/V8 engines offer a premium driving experience favoured by UAE enthusiasts. Find your next Infiniti on Saman Marketplace.",
    "Jaguar": "Find Jaguar cars for sale in the UAE, including the F-Type, XF, XE, F-Pace, and I-Pace EV. Jaguar's British luxury, dynamic design, and powerful engines make it a prestigious choice in the UAE automotive market. Browse Jaguar listings or sell yours on Saman Marketplace.",
    "Jeep": "Browse Jeep vehicles for sale in the UAE, including the Wrangler, Grand Cherokee, Cherokee, Compass, and Gladiator. Jeep's legendary off-road capability and rugged styling make it one of the UAE's most popular 4x4 brands for both city driving and desert adventures. Find your Jeep on Saman Marketplace.",
    "Jetour": "Find Jetour SUVs for sale in the UAE, including the X70, X90, T2, and Dashing. Jetour's modern Chinese SUVs offer premium features at competitive UAE market prices. Browse Jetour listings on Saman Marketplace.",
    "Kia": "Browse Kia cars for sale in the UAE, including the Sportage, Sorento, Telluride, Stinger, K5, EV6, and EV9. Kia's bold design, extensive warranties, and competitive pricing have made it one of the UAE's fastest-growing automotive brands. Find your next Kia or sell yours on Saman Marketplace.",
    "Lamborghini": "Find Lamborghini supercars for sale in the UAE, including the Huracan, Aventador, Urus SUV, and Revuelto. Lamborghini's raging-bull performance and dramatic styling attract passionate enthusiasts and collectors in the UAE's prestige car market. Browse Lamborghini listings on Saman Marketplace.",
    "Land Rover": "Browse Land Rover vehicles for sale in the UAE, including the Range Rover, Range Rover Sport, Defender, Discovery, and Velar. Land Rover's combination of luxury refinement and legendary off-road capability makes it one of the UAE's most sought-after premium 4x4 brands. Find your Land Rover on Saman Marketplace.",
    "Lexus": "Find Lexus cars for sale in the UAE, including the LX 600, GX, RX, ES, LS, IS, NX, and the Lexus electric lineup. Lexus's Japanese luxury, exceptional build quality, and strong resale values make it a smart choice in the UAE market. Browse Lexus listings or sell yours on Saman Marketplace.",
    "Li Auto": "Browse Li Auto extended-range electric vehicles for sale in the UAE, including the L6, L7, L8, L9, and Mega. Li Auto's large family SUVs with EREV technology are attracting UAE buyers seeking EV convenience with zero range anxiety. Find Li Auto listings on Saman Marketplace.",
    "Lincoln": "Find Lincoln cars and SUVs for sale in the UAE, including the Navigator, Aviator, Nautilus, and Corsair. Lincoln's flagship American luxury SUVs — especially the Navigator — enjoy strong demand in the UAE's premium large-SUV segment. Browse Lincoln listings on Saman Marketplace.",
    "Maserati": "Browse Maserati cars for sale in the UAE, including the Ghibli, Quattroporte, Levante, GranTurismo, MC20, and Grecale. Maserati's Italian performance heritage and exclusivity make it a prestigious choice for UAE luxury car buyers. Find your Maserati on Saman Marketplace.",
    "Mazda": "Find Mazda cars for sale in the UAE, including the Mazda3, CX-5, CX-9, CX-30, MX-5 Miata, and CX-90. Mazda's Jinba-ittai philosophy — driver and car as one — delivers engaging dynamics and premium build quality at accessible prices in the UAE. Browse Mazda listings or sell yours on Saman Marketplace.",
    "Mercedes": "Browse Mercedes cars for sale in the UAE, including the C-Class, E-Class, S-Class, GLE, GLS, G-Class, and the full AMG performance range. Mercedes-Benz is consistently among the UAE's top-selling luxury brands, known for its engineering excellence, prestige, and strong resale values. Find your Mercedes on Saman Marketplace.",
    "MG": "Find MG cars for sale in the UAE, including the ZS, HS, MG5, MG6, and MG4 EV. MG's value-for-money pricing and well-equipped specification make it one of the fastest-growing brands in the UAE's new and used-car market. Browse MG listings or sell yours on Saman Marketplace.",
    "Mini": "Browse Mini cars for sale in the UAE, including the Cooper, Countryman, Clubman, Convertible, and Electric models. Mini's iconic British character, premium feel, and go-kart handling make it a beloved choice for UAE urban drivers. Find your Mini on Saman Marketplace.",
    "Mitsubishi": "Find Mitsubishi cars and SUVs for sale in the UAE, including the Pajero, Pajero Sport, Outlander, Lancer, Eclipse Cross, and L200. Mitsubishi's reliable 4x4 SUVs have long been trusted by UAE drivers for both city commutes and desert off-roading. Browse Mitsubishi listings or sell yours on Saman Marketplace.",
    "NIO": "Browse NIO electric vehicles for sale in the UAE, including the ES6, ES8, ET5, ET7, and EC7. NIO's advanced battery-swap technology, premium interior quality, and long-range EVs are making the brand a compelling choice in the UAE's growing EV market. Find NIO listings on Saman Marketplace.",
    "Nissan": "Find Nissan cars for sale in the UAE, including the Patrol, Altima, Maxima, X-Trail, Sentra, 370Z, GT-R, and Navara. Nissan is one of the UAE's best-selling brands, with the Patrol in particular holding legendary status among local and GCC buyers. Browse Nissan listings or sell yours on Saman Marketplace.",
    "Peugeot": "Browse Peugeot cars for sale in the UAE, including the 208, 308, 3008, 508, 5008, and electric e-series models. Peugeot's French design flair, i-Cockpit interiors, and expanding EV lineup are drawing attention from UAE car buyers seeking a distinctive choice. Find your Peugeot on Saman Marketplace.",
    "Polaris": "Find Polaris off-road vehicles for sale in the UAE, including the RZR, Ranger, General, and Slingshot. Polaris's performance UTVs and sport side-by-sides are popular among UAE desert enthusiasts and adventure riders. Browse Polaris listings or sell yours on Saman Marketplace.",
    "Porsche": "Browse Porsche cars for sale in the UAE, including the 911, Cayenne, Macan, Panamera, Taycan, and 718 series. Porsche's iconic sports cars and SUVs command strong resale values and prestige in the UAE's premium automotive market. Find your Porsche or list yours on Saman Marketplace.",
    "Renault": "Find Renault cars for sale in the UAE, including the Clio, Megane, Captur, Koleos, Duster, and Zoe EV. Renault's practical and attractively priced vehicles offer a compelling option for UAE buyers seeking value in a European brand. Browse Renault listings on Saman Marketplace.",
    "Rolls Royce": "Browse Rolls-Royce cars for sale in the UAE, including the Phantom, Ghost, Cullinan, Wraith, Dawn, and Spectre. As one of the world's most prestigious automotive marques, Rolls-Royce vehicles are highly sought after in the UAE's luxury car market. Find rare Rolls-Royce listings on Saman Marketplace.",
    "Rox": "Find Rox vehicles for sale in the UAE. Browse available Rox listings from UAE sellers on Saman Marketplace.",
    "Subaru": "Browse Subaru cars for sale in the UAE, including the Outback, Forester, WRX, WRX STI, BRZ, and Crosstrek. Subaru's symmetrical AWD system, flat-boxer engines, and rally heritage attract a passionate following among UAE enthusiasts. Find your next Subaru on Saman Marketplace.",
    "Suzuki": "Find Suzuki cars for sale in the UAE, including the Jimny, Vitara, Grand Vitara, Swift, Ciaz, and Ertiga. Suzuki's compact SUVs and city cars offer practical, fuel-efficient motoring at accessible price points across the UAE. Browse Suzuki listings or sell yours on Saman Marketplace.",
    "Tesla": "Browse Tesla electric vehicles for sale in the UAE, including the Model 3, Model Y, Model S, Model X, and Cybertruck. Tesla's advanced Autopilot, over-the-air updates, and rapid charging network make these EVs increasingly popular in the UAE. Find your Tesla on Saman Marketplace.",
    "Toyota": "Find Toyota cars and trucks for sale in the UAE, including the Land Cruiser, Prado, Hilux, Camry, Corolla, RAV4, Fortuner, and Sequoia. Toyota is the UAE's most popular automotive brand, renowned for reliability, strong resale values, and legendary off-road capability. Browse Toyota listings or sell yours on Saman Marketplace.",
    "Volkswagen": "Browse Volkswagen cars for sale in the UAE, including the Golf, Passat, Tiguan, Touareg, Atlas, and the ID. electric range. VW's German engineering, wide model range, and competitive pricing make it one of the UAE's top-selling European brands. Find your Volkswagen on Saman Marketplace.",
    "Volvo": "Find Volvo cars for sale in the UAE, including the XC90, XC60, XC40, S90, S60, and the electric EX90 and EX40. Volvo's Scandinavian safety leadership, premium interiors, and electrified lineup are attracting a growing number of UAE buyers. Browse Volvo listings or sell yours on Saman Marketplace.",
    "XPeng": "Browse XPeng electric vehicles for sale in the UAE, including the P7, G6, G9, and X9. XPeng's advanced ADAS features, long-range batteries, and intelligent cockpit technology position it as a leading smart EV brand in the UAE market. Find XPeng listings on Saman Marketplace.",

    // ── Vehicle types ────────────────────────────────────────────────────────
    "Motorcycles": "Find motorcycles for sale in the UAE, including sportbikes, cruisers, adventure tourers, naked bikes, and scooters from brands like Harley-Davidson, Ducati, Honda, Kawasaki, Yamaha, and BMW Motorrad. The UAE's warm climate and wide roads make motorcycling a popular choice year-round. Browse motorcycle listings or sell yours on Saman Marketplace.",
    "Offroad": "Browse off-road vehicles for sale in the UAE, including 4x4s, sand buggies, desert racers, and purpose-built off-roaders. With the UAE's spectacular dune terrain and wadi trails, off-road vehicles are a popular choice among adventure seekers. Find your next off-road machine or list yours on Saman Marketplace.",
    "ATV": "Find ATVs (quad bikes) for sale in the UAE, including sport quads, utility ATVs, and youth models from Yamaha, Honda, Polaris, and Can-Am. ATVs are widely used for desert fun, farm utility, and adventure tourism across the Emirates. Browse ATV listings or sell yours on Saman Marketplace.",
    "UTV": "Browse UTVs (side-by-sides) for sale in the UAE, including sport and utility models from Can-Am, Polaris, Yamaha, and Kawasaki. UTVs are ideal for UAE desert driving, offering performance, cargo capacity, and passenger seating in a single package. Find your UTV or list it on Saman Marketplace.",
    "Jet Ski": "Find Jet Skis and personal watercraft for sale in the UAE, including models from Sea-Doo, Yamaha WaveRunner, and Kawasaki Jet Ski. With the UAE's extensive coastline and year-round sunshine, personal watercraft are a favourite leisure choice. Browse Jet Ski listings or sell yours on Saman Marketplace.",
    "Other": "Browse other vehicles and specialty transport for sale in the UAE. From classic cars and kit cars to commercial vehicles and specialty machines, find unique listings from UAE sellers. Post your own vehicle on Saman Marketplace and reach buyers across the Emirates.",
  },
};

/**
 * Returns a brand/type-specific intro paragraph for a subcategory page,
 * or falls back to a generic sentence when no entry exists.
 */
function getSubCategoryDescription(mainCategory: string, subCategory: string): string {
  return (
    SUBCATEGORY_DESCRIPTIONS[mainCategory]?.[subCategory] ??
    `Browse ${subCategory} ${mainCategory} listings on Saman Marketplace — the UAE's leading auto parts and vehicles marketplace. Find quality listings from trusted sellers across Dubai, Abu Dhabi, Sharjah, and all Emirates.`
  );
}

// ─── Subcategory filter pages ─────────────────────────────────────────────────

function buildSubCategoryJsonLd(
  mainCategory: string,
  subCategory: string,
  products: CategoryProduct[],
): string {
  const tabSlug = mainCategory === "Spare Parts" ? "spare-parts" : "automotive";
  const url = `${SITE_URL}/categories?tab=${tabSlug}&subCategory=${encodeURIComponent(subCategory)}`;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${subCategory} ${mainCategory} on Saman Marketplace`,
    "url": url,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": p.title,
      "url": `${SITE_URL}/product/${p.id}`,
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": mainCategory, "item": `${SITE_URL}/categories?tab=${tabSlug}` },
      { "@type": "ListItem", "position": 3, "name": subCategory, "item": url },
    ],
  };

  return (
    `<script type="application/ld+json">${safeJsonLd(itemList)}</script>` +
    `<script type="application/ld+json">${safeJsonLd(breadcrumb)}</script>`
  );
}

function buildSubCategoryBodyContent(
  mainCategory: string,
  subCategory: string,
  products: CategoryProduct[],
): string {
  const tabSlug = mainCategory === "Spare Parts" ? "spare-parts" : "automotive";

  const listingsHtml = products
    .slice(0, 30)
    .map(
      (p) =>
        `<li><a href="/product/${p.id}">${escapeHtml(p.title)}</a>` +
        (p.price && p.price > 0 ? ` — AED ${escapeHtml(String(p.price))}` : "") +
        `</li>`,
    )
    .join("");

  const description = getSubCategoryDescription(mainCategory, subCategory);

  return (
    `<div id="seo-prerender" lang="en" dir="ltr" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
    `<h1>${escapeHtml(subCategory)} ${escapeHtml(mainCategory)}</h1>` +
    `<p>${escapeHtml(description)}</p>` +
    (listingsHtml
      ? `<h2>Listings</h2><ul>${listingsHtml}</ul>`
      : `<p>No listings available right now. Check back soon.</p>`) +
    `<p><a href="/categories?tab=${tabSlug}">All ${escapeHtml(mainCategory)}</a> &middot; ` +
    `<a href="/categories">All categories</a> &middot; ` +
    `<a href="/downloads">Download the app</a></p>` +
    `</div>`
  );
}

export async function buildSeoHeadForUrl(url: string): Promise<SeoHead | null> {
  const cleanPath = url.split("?")[0].split("#")[0];

  // 1) SEO landing pages (EN + AR)
  const landing = findSeoPageByPath(cleanPath);
  if (landing) {
    // Only emit an alt-lang hreflang if there's a real sibling in the other
    // language. Pages where altLangPath === path are single-language pages.
    const hasAltLang = landing.altLangPath !== landing.path;
    return {
      jsonLd: buildLandingJsonLd(landing),
      title: landing.title,
      description: landing.metaDescription,
      canonical: seoPageAbsoluteUrl(landing),
      bodyContent: buildLandingBodyContent(landing),
      altLangUrl: hasAltLang ? seoPageAltUrl(landing) : undefined,
      altLangCode: hasAltLang ? (landing.lang === "ar" ? "en-AE" : "ar-AE") : undefined,
      htmlLang: landing.lang === "ar" ? "ar" : "en",
      htmlDir: landing.lang === "ar" ? "rtl" : "ltr",
    };
  }

  // 2) Category browse pages (/categories, /categories?tab=…, /categories?tab=…&subCategory=…)
  if (cleanPath === "/categories") {
    const tabParam = url.match(/[?&]tab=([^&]+)/)?.[1] ?? "";
    const mainCategory: string | null =
      tabParam === "spare-parts"
        ? "Spare Parts"
        : tabParam === "automotive"
        ? "Automotive"
        : null;

    // 2a) Subcategory filter pages: /categories?tab=spare-parts&subCategory=Toyota
    const subCategoryRaw = url.match(/[?&]subCategory=([^&]+)/)?.[1];
    const subCategory = subCategoryRaw ? decodeURIComponent(subCategoryRaw) : null;

    if (subCategory && mainCategory) {
      const validSubs: readonly string[] =
        mainCategory === "Spare Parts" ? SPARE_PARTS_SUBCATEGORIES : AUTOMOTIVE_SUBCATEGORIES;
      // Reject unknown subcategory values so we don't pre-render junk pages
      if (!(validSubs as readonly string[]).includes(subCategory)) return null;

      const tabSlug = mainCategory === "Spare Parts" ? "spare-parts" : "automotive";
      try {
        const allProducts = await storage.getProducts({ mainCategory, subCategory });
        const approved = allProducts.filter((p) => p.status === "approved").slice(0, 30);

        const title = `${subCategory} ${mainCategory} — Buy & Sell in UAE | Saman Marketplace`;
        const description = `Browse ${approved.length > 0 ? `${approved.length}+ ` : ""}${subCategory} ${mainCategory} listings on Saman Marketplace — the UAE's leading auto parts and vehicles marketplace.`;
        const canonical = `${SITE_URL}/categories?tab=${tabSlug}&subCategory=${encodeURIComponent(subCategory)}`;

        return {
          title,
          description,
          canonical,
          jsonLd: buildSubCategoryJsonLd(mainCategory, subCategory, approved),
          bodyContent: buildSubCategoryBodyContent(mainCategory, subCategory, approved),
        };
      } catch {
        return null;
      }
    }

    // 2b) Main category tab pages: /categories?tab=spare-parts or /categories
    const subcategories: readonly string[] =
      mainCategory === "Spare Parts"
        ? SPARE_PARTS_SUBCATEGORIES
        : mainCategory === "Automotive"
        ? AUTOMOTIVE_SUBCATEGORIES
        : [];

    try {
      const allProducts = mainCategory
        ? await storage.getProducts({ mainCategory })
        : [];
      const approved = allProducts
        .filter((p) => p.status === "approved")
        .slice(0, 30);

      const title = mainCategory
        ? `${mainCategory} — Buy & Sell in UAE | Saman Marketplace`
        : "Browse Car Parts & Vehicles in UAE | Saman Marketplace";
      const description = mainCategory
        ? `Browse ${approved.length > 0 ? `${approved.length}+ ` : ""}${mainCategory} listings on Saman Marketplace — the UAE's leading auto parts and vehicles marketplace.`
        : "Shop Spare Parts and Automotive listings on Saman Marketplace — the UAE's leading auto parts and vehicles marketplace.";
      const canonical = mainCategory
        ? `${SITE_URL}/categories?tab=${mainCategory === "Spare Parts" ? "spare-parts" : "automotive"}`
        : `${SITE_URL}/categories`;

      return {
        title,
        description,
        canonical,
        jsonLd: buildCategoryJsonLd(mainCategory, approved),
        bodyContent: buildCategoryBodyContent(mainCategory, subcategories, approved),
      };
    } catch {
      return null;
    }
  }

  // 3) Seller profile pages (public store pages)
  const sellerMatch = url.match(/^\/seller\/([^/?#]+)(?:[/?#]|$)/);
  if (sellerMatch) {
    const sellerId = decodeURIComponent(sellerMatch[1]);
    if (!sellerId || sellerId.length > 100) return null;
    try {
      const [seller] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, sellerId));
      if (!seller) return null;

      const sellerListings = await storage.getProductsBySeller(sellerId);
      const listingCount = sellerListings.length;
      const name =
        seller.displayName ||
        [seller.firstName, seller.lastName].filter(Boolean).join(" ").trim() ||
        "Seller";

      const canonical = `${SITE_URL}/seller/${encodeURIComponent(seller.id)}`;
      const title = `${name} — Seller Store | Saman Marketplace`;
      const description = listingCount > 0
        ? `Browse ${listingCount} listing${listingCount === 1 ? "" : "s"} from ${name} on Saman Marketplace — the UAE's auto parts and vehicles marketplace.`
        : `View ${name}'s store on Saman Marketplace — the UAE's auto parts and vehicles marketplace.`;

      const approved = sellerListings.filter((p) => p.status === "approved");
      const listingsHtml = approved
        .map(
          (p) =>
            `<li><a href="/product/${p.id}">${escapeHtml(p.title)}</a>${
              p.price && p.price > 0 ? ` — AED ${escapeHtml(String(p.price))}` : ""
            }</li>`
        )
        .join("");
      // Rendered inside <div id="root"> so crawlers see real content; React
      // replaces this on mount with the styled seller store page.
      const bodyContent =
        `<div id="seo-prerender" lang="en" dir="ltr" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
        `<h1>${escapeHtml(name)} — Seller Store</h1>` +
        `<p>${escapeHtml(description)}</p>` +
        (approved.length > 0
          ? `<h2>Listings</h2><ul>${listingsHtml}</ul>`
          : `<p>This seller has no active listings right now.</p>`) +
        `<p><a href="/">Browse Saman Marketplace</a> &middot; <a href="/downloads">Download the app</a></p>` +
        `</div>`;

      const jsonLd = `<script type="application/ld+json">${safeJsonLd({
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "name": title,
        "url": canonical,
        "mainEntity": {
          "@type": "Person",
          "name": name,
          ...(seller.profileImageUrl ? { image: seller.profileImageUrl } : {}),
        },
      })}</script>`;

      return {
        jsonLd,
        title,
        description,
        canonical,
        ogImage:
          seller.profileImageUrl ||
          `${SITE_URL}/og/seller/${encodeURIComponent(seller.id)}.png`,
        bodyContent,
      };
    } catch {
      return null;
    }
  }

  // 3) Product detail pages
  const match = url.match(/^\/product\/(\d+)(?:[/?#]|$)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  if (!Number.isFinite(id)) return null;

  try {
    const product = await storage.getProduct(id);
    if (!product || product.status !== "approved") return null;

    const jsonLd = (await getProductJsonLd(id)) || "";
    const title = `${product.title} - ${product.subCategory || product.mainCategory} | Saman Marketplace`;
    const desc = (product.description || "").slice(0, 200).replace(/\s+/g, " ").trim();
    const description = desc
      ? `${desc} — Buy on Saman Marketplace, the UAE's auto parts marketplace.`
      : `${product.title} on Saman Marketplace — the UAE's auto parts and vehicles marketplace.`;
    // Seller name for the store link (best-effort; skip on failure)
    let sellerName = "Seller";
    try {
      const [seller] = await db
        .select({
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, product.sellerId));
      if (seller) {
        sellerName =
          seller.displayName ||
          [seller.firstName, seller.lastName].filter(Boolean).join(" ").trim() ||
          "Seller";
      }
    } catch {}

    const priceHtml =
      product.price && product.price > 0
        ? `<p><strong>AED ${escapeHtml(String(product.price))}</strong></p>`
        : "";
    const categoryText = [product.mainCategory, product.subCategory]
      .filter(Boolean)
      .join(" > ");
    // Rendered inside <div id="root"> so crawlers see real content; React
    // replaces this on mount with the styled product detail page.
    const bodyContent =
      `<div id="seo-prerender" lang="en" dir="ltr" style="max-width:880px;margin:0 auto;padding:24px;font-family:DM Sans,Arial,sans-serif;color:#111;">` +
      `<h1>${escapeHtml(product.title)}</h1>` +
      priceHtml +
      (categoryText ? `<p>${escapeHtml(categoryText)}</p>` : "") +
      (product.description ? `<p>${escapeHtml(product.description)}</p>` : "") +
      `<p><a href="/seller/${encodeURIComponent(product.sellerId)}">More from ${escapeHtml(sellerName)}'s store</a></p>` +
      `<p><a href="/">Browse Saman Marketplace</a> &middot; <a href="/downloads">Download the app</a></p>` +
      `</div>`;

    return {
      jsonLd,
      title,
      description,
      canonical: `${SITE_URL}/product/${product.id}`,
      ogImage: product.imageUrl || undefined,
      bodyContent,
    };
  } catch {
    return null;
  }
}

export function injectSeoIntoHtml(html: string, seo: SeoHead): string {
  let out = html;
  if (seo.title) {
    const t = escapeAttr(seo.title);
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
    out = out.replace(
      /<meta property="og:title"[^>]*\/>/i,
      `<meta property="og:title" content="${t}" />`
    );
    out = out.replace(
      /<meta name="twitter:title"[^>]*\/>/i,
      `<meta name="twitter:title" content="${t}" />`
    );
  }
  if (seo.description) {
    const d = escapeAttr(seo.description);
    out = out.replace(
      /<meta name="description"[^>]*\/>/i,
      `<meta name="description" content="${d}" />`
    );
    out = out.replace(
      /<meta property="og:description"[^>]*\/>/i,
      `<meta property="og:description" content="${d}" />`
    );
    out = out.replace(
      /<meta name="twitter:description"[^>]*\/>/i,
      `<meta name="twitter:description" content="${d}" />`
    );
  }
  if (seo.canonical) {
    out = out.replace(
      /<link rel="canonical"[^>]*\/>/i,
      `<link rel="canonical" href="${escapeAttr(seo.canonical)}" />`
    );
    out = out.replace(
      /<meta property="og:url"[^>]*\/>/i,
      `<meta property="og:url" content="${escapeAttr(seo.canonical)}" />`
    );
  }
  if (seo.ogImage) {
    out = out.replace(
      /<meta property="og:image"[^>]*\/>/i,
      `<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />`
    );
    out = out.replace(
      /<meta name="twitter:image"[^>]*\/>/i,
      `<meta name="twitter:image" content="${escapeAttr(seo.ogImage)}" />`
    );
  }
  // For any SEO landing page, replace the template's generic hreflang block
  // (which points at /?lang=…) with one that's correct for THIS URL.
  if (seo.canonical && (seo.altLangUrl || seo.htmlLang)) {
    out = out.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*\/>/gi, "");
    const selfCode = seo.altLangCode
      ? (seo.altLangCode === "ar-AE" ? "en-AE" : "ar-AE")
      : (seo.htmlLang === "ar" ? "ar-AE" : "en-AE");
    const lines = [
      `<link rel="alternate" hreflang="${selfCode}" href="${escapeAttr(seo.canonical)}" />`,
    ];
    if (seo.altLangUrl && seo.altLangCode) {
      lines.push(`<link rel="alternate" hreflang="${seo.altLangCode}" href="${escapeAttr(seo.altLangUrl)}" />`);
    }
    lines.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttr(seo.canonical)}" />`);
    out = out.replace(
      /(<link rel="canonical"[^>]*\/>)/i,
      `$1\n    ${lines.join("\n    ")}`
    );
  }
  if (seo.htmlLang) {
    out = out.replace(/<html\s+lang="[^"]*"/i, `<html lang="${seo.htmlLang}"`);
  }
  if (seo.htmlDir) {
    // Add or replace dir attribute on <html>
    if (/<html[^>]*\sdir=/.test(out)) {
      out = out.replace(/<html([^>]*)\sdir="[^"]*"/i, `<html$1 dir="${seo.htmlDir}"`);
    } else {
      out = out.replace(/<html(\s+lang="[^"]*")?/i, (m) => `${m} dir="${seo.htmlDir}"`);
    }
  }
  if (seo.jsonLd) {
    out = out.replace("</head>", `${seo.jsonLd}\n</head>`);
  }
  if (seo.bodyContent) {
    out = out.replace(
      /<div id="root">\s*<\/div>/,
      `<div id="root">${seo.bodyContent}</div>`
    );
  }
  return out;
}

export { SEO_PAGES };
