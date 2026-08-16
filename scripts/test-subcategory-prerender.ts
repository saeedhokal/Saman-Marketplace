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
 *   • Response contains <script type="application/ld+json"> with "@type":"ItemList"
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
}

const CASES: TestCase[] = [
  {
    label: "Spare Parts / Toyota",
    url: `${base}/categories?tab=spare-parts&subCategory=Toyota`,
    expectPrerender: true,
    expectSubcategoryName: "Toyota",
  },
  {
    label: "Automotive / BMW",
    url: `${base}/categories?tab=automotive&subCategory=BMW`,
    expectPrerender: true,
    expectSubcategoryName: "BMW",
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

    // 4. JSON-LD with "@type":"ItemList"
    const jsonLdBlocks = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    const hasItemList = jsonLdBlocks.some((m) => {
      try {
        const parsed = JSON.parse(m[1]);
        return parsed["@type"] === "ItemList";
      } catch {
        return false;
      }
    });
    if (!hasItemList) {
      failures.push(
        `[${tc.label}] No <script type="application/ld+json"> block with "@type":"ItemList" found`
      );
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
