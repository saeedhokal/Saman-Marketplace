import { storage } from "./storage";

const SITE_URL = "https://thesamanapp.com";

function escapeJson(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[\\"\u0000-\u001f\u2028\u2029]/g, c => {
    switch (c) {
      case "\\": return "\\\\";
      case "\"": return "\\\"";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\t": return "\\t";
      case "\u2028": return "\\u2028";
      case "\u2029": return "\\u2029";
      default: return "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
    }
  });
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

export async function buildSeoHeadForUrl(url: string): Promise<{
  jsonLd: string;
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
} | null> {
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

export function injectSeoIntoHtml(html: string, seo: {
  jsonLd?: string;
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}): string {
  let out = html;
  if (seo.title) {
    const t = escapeJson(seo.title);
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`);
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
    const d = escapeJson(seo.description);
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
      `<link rel="canonical" href="${seo.canonical}" />`
    );
    out = out.replace(
      /<meta property="og:url"[^>]*\/>/i,
      `<meta property="og:url" content="${seo.canonical}" />`
    );
  }
  if (seo.ogImage) {
    out = out.replace(
      /<meta property="og:image"[^>]*\/>/i,
      `<meta property="og:image" content="${seo.ogImage}" />`
    );
    out = out.replace(
      /<meta name="twitter:image"[^>]*\/>/i,
      `<meta name="twitter:image" content="${seo.ogImage}" />`
    );
  }
  if (seo.jsonLd) {
    out = out.replace("</head>", `${seo.jsonLd}\n</head>`);
  }
  return out;
}
