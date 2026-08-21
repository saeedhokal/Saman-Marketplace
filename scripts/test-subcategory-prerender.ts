/**
 * Subcategory pre-render smoke test.
 *
 * Verifies that /categories?tab=…&subCategory=… pages return a properly
 * server-side rendered response that Googlebot can index, catching
 * regressions in buildSubCategoryBodyContent / buildSubCategoryJsonLd
 * before they affect search indexing.
 *
 * Assertions per valid subcategory URL:
 *   • HTTP 200
 *   • Response contains <div id="seo-prerender">
 *   • Response contains an <h1> with the subcategory name
 *   • Canonical URL uses the public subCategory parameter
 *   • ItemList metadata and visible listing links agree
 *
 * For an invalid subcategory (FakeBrand):
 *   • No <div id="seo-prerender"> in the response body
 *
 * Usage:
 *   npx tsx scripts/test-subcategory-prerender.ts                  # tests http://localhost:5000
 *   npx tsx scripts/test-subcategory-prerender.ts https://thesamanapp.com
 */

const base = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");

interface TestCase {
  label: string;
  url: string;
  expectPrerender: boolean;
  expectSubcategoryName?: string;
  expectMainCategory?: "Spare Parts" | "Automotive";
  expectCanonical?: string;
}

const canonicalHost = "https://thesamanapp.com";

function decodeHtmlAttribute(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const CASES: TestCase[] = [
  {
    label: "Spare Parts / Toyota",
    url: `${base}/categories?tab=spare-parts&subCategory=Toyota`,
    expectPrerender: true,
    expectSubcategoryName: "Toyota",
    expectMainCategory: "Spare Parts",
    expectCanonical: `${canonicalHost}/categories?tab=spare-parts&subCategory=Toyota`,
  },
  {
    label: "Automotive / BMW",
    url: `${base}/categories?tab=automotive&subCategory=BMW`,
    expectPrerender: true,
    expectSubcategoryName: "BMW",
    expectMainCategory: "Automotive",
    expectCanonical: `${canonicalHost}/categories?tab=automotive&subCategory=BMW`,
  },
  {
    label: "Legacy brand alias / Toyota",
    url: `${base}/categories?tab=spare-parts&brand=Toyota`,
    expectPrerender: true,
    expectSubcategoryName: "Toyota",
    expectMainCategory: "Spare Parts",
    expectCanonical: `${canonicalHost}/categories?tab=spare-parts&subCategory=Toyota`,
  },
  {
    label: "Invalid subCategory / FakeBrand",
    url: `${base}/categories?tab=spare-parts&subCategory=FakeBrand`,
    expectPrerender: false,
  },
];

async function runCase(tc: TestCase): Promise<string[]> {
  const failures: string[] = [];

  let res: Response;
  try {
    res = await fetch(tc.url);
  } catch (err) {
    failures.push(`[${tc.label}] Network error: ${err}`);
    return failures;
  }

  const body = await res.text();

  if (tc.expectPrerender) {
    // 1. HTTP 200
    if (res.status !== 200) {
      failures.push(`[${tc.label}] Expected HTTP 200, got ${res.status}`);
    }

    // 2. seo-prerender div
    if (!body.includes('<div id="seo-prerender"')) {
      failures.push(`[${tc.label}] Missing <div id="seo-prerender"> in response body`);
    }

    // 3. <h1> contains the subcategory name
    if (tc.expectSubcategoryName) {
      const h1Match = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const h1Text = h1Match ? h1Match[1] : "";
      if (!h1Text.includes(tc.expectSubcategoryName)) {
        failures.push(
          `[${tc.label}] Expected <h1> to contain "${tc.expectSubcategoryName}", got: "${h1Text.slice(0, 120)}"`
        );
      }
    }

    // 4. Canonical points at this exact public filter URL. This also checks
    // that the legacy `brand` alias resolves to the canonical parameter.
    const canonicalMatch = body.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/i);
    const canonical = decodeHtmlAttribute(canonicalMatch?.[1] ?? "");
    if (tc.expectCanonical && canonical !== tc.expectCanonical) {
      failures.push(
        `[${tc.label}] Expected canonical "${tc.expectCanonical}", got: "${canonical || "(missing)"}"`
      );
    }

    // 5. JSON-LD describes the same filtered page and every structured
    // listing is also present as a visible crawlable link.
    const jsonLdBlocks = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    let itemList: any = null;
    for (const match of jsonLdBlocks) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed["@type"] === "ItemList") {
          itemList = parsed;
          break;
        }
      } catch {}
    }
    if (!itemList) {
      failures.push(
        `[${tc.label}] No <script type="application/ld+json"> block with "@type":"ItemList" found`
      );
    } else {
      const expectedName = `${tc.expectSubcategoryName} ${tc.expectMainCategory} on Saman Marketplace`;
      if (itemList.name !== expectedName) {
        failures.push(
          `[${tc.label}] Expected ItemList name "${expectedName}", got: "${itemList.name}"`
        );
      }
      if (tc.expectCanonical && itemList.url !== tc.expectCanonical) {
        failures.push(
          `[${tc.label}] Expected ItemList URL "${tc.expectCanonical}", got: "${itemList.url}"`
        );
      }
      for (const item of itemList.itemListElement ?? []) {
        const visibleHref =
          typeof item?.url === "string" && item.url.startsWith(canonicalHost)
            ? item.url.slice(canonicalHost.length)
            : "";
        if (!visibleHref || !body.includes(`href="${visibleHref}"`)) {
          failures.push(
            `[${tc.label}] Structured listing is missing its visible filtered-page link: ${item?.url ?? "(missing URL)"}`
          );
        }
      }
    }
  } else {
    // For invalid subcategories the server should return a page without seo-prerender
    if (body.includes('<div id="seo-prerender"')) {
      failures.push(
        `[${tc.label}] Expected no <div id="seo-prerender"> for invalid subCategory, but it was found`
      );
    }
  }

  return failures;
}

async function main() {
  console.log(`Running subcategory pre-render checks against ${base}\n`);

  const allFailures: string[] = [];

  for (const tc of CASES) {
    const failures = await runCase(tc);
    if (failures.length === 0) {
      console.log(`  ✓  ${tc.label}`);
    } else {
      for (const f of failures) {
        console.error(`  ✗  ${f}`);
      }
      allFailures.push(...failures);
    }
  }

  console.log();
  if (allFailures.length > 0) {
    console.error(`${allFailures.length} check(s) failed.`);
    process.exit(1);
  } else {
    console.log("All subcategory pre-render checks passed.");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
