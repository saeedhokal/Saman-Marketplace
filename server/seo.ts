import { storage } from "./storage";
import { SEO_PAGES, findSeoPageByPath, seoPageAbsoluteUrl, seoPageAltUrl, type SeoPage } from "../shared/seo-pages";

const SITE_URL = "https://thesamanapp.com";

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
      `<script type="application/ld+json">${JSON.stringify(ld)}</script>` +
      `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`
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
    `<script type="application/ld+json">${JSON.stringify(webpage)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(faq)}</script>`,
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

export async function buildSeoHeadForUrl(url: string): Promise<SeoHead | null> {
  // 1) SEO landing pages (EN + AR)
  const landing = findSeoPageByPath(url.split("?")[0].split("#")[0]);
  if (landing) {
    return {
      jsonLd: buildLandingJsonLd(landing),
      title: landing.title,
      description: landing.metaDescription,
      canonical: seoPageAbsoluteUrl(landing),
      bodyContent: buildLandingBodyContent(landing),
      altLangUrl: seoPageAltUrl(landing),
      altLangCode: landing.lang === "ar" ? "en-AE" : "ar-AE",
      htmlLang: landing.lang === "ar" ? "ar" : "en",
      htmlDir: landing.lang === "ar" ? "rtl" : "ltr",
    };
  }

  // 2) Product detail pages
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
    return {
      jsonLd,
      title,
      description,
      canonical: `${SITE_URL}/product/${product.id}`,
      ogImage: product.imageUrl || undefined,
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
  if (seo.altLangUrl && seo.altLangCode && seo.canonical) {
    // For SEO landing pages, strip the template's generic hreflang tags
    // (which point at /?lang=…) and emit a clean self + alt + x-default set
    // for THIS page. Avoids "Duplicate hreflang for ar-AE" in Search Console.
    out = out.replace(/\s*<link rel="alternate" hreflang="[^"]*"[^>]*\/>/gi, "");
    const selfCode = seo.altLangCode === "ar-AE" ? "en-AE" : "ar-AE";
    const alternates =
      `<link rel="alternate" hreflang="${selfCode}" href="${escapeAttr(seo.canonical)}" />\n    ` +
      `<link rel="alternate" hreflang="${seo.altLangCode}" href="${escapeAttr(seo.altLangUrl)}" />\n    ` +
      `<link rel="alternate" hreflang="x-default" href="${escapeAttr(seo.canonical)}" />`;
    out = out.replace(
      /(<link rel="canonical"[^>]*\/>)/i,
      `$1\n    ${alternates}`
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
