/**
 * Sitemap smoke test.
 *
 * Fetches /sitemap.xml and asserts that the subcategory (brand) URLs are
 * present, catching regressions where the XML is malformed or the
 * subcategory spread is accidentally dropped from the sitemap builder.
 *
 * Usage:
 *   npx tsx scripts/check-sitemap.ts                    # checks http://localhost:5000
 *   npx tsx scripts/check-sitemap.ts https://thesamanapp.com
 */
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "../shared/schema";

const base = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");
const CANONICAL_HOST = "https://thesamanapp.com";

function expectedLoc(tab: "spare-parts" | "automotive", brand: string): string {
  // Sitemap always emits canonical production URLs regardless of which
  // server we fetch from.
  return `${CANONICAL_HOST}/categories?tab=${tab}&subCategory=${encodeURIComponent(brand)}`;
}

async function main() {
  const url = `${base}/sitemap.xml`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} returned ${res.status}`);
  }
  const xml = await res.text();

  const failures: string[] = [];

  // Strict XML validation — catches unescaped "&" in <loc>, unbalanced
  // tags, and any other malformed markup crawlers would reject.
  const valid = XMLValidator.validate(xml);
  if (valid !== true) {
    failures.push(`malformed XML: ${JSON.stringify(valid.err)}`);
  }

  // Parse and extract every <loc> value (entities are decoded by the parser)
  let locs: string[] = [];
  try {
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml);
    const urlset = parsed?.urlset;
    if (!urlset) failures.push("missing <urlset> root element");
    const entries = Array.isArray(urlset?.url) ? urlset.url : urlset?.url ? [urlset.url] : [];
    if (entries.length === 0) failures.push("no <url> entries found");
    locs = entries.map((u: any) => String(u.loc ?? ""));
  } catch (e: any) {
    failures.push(`XML parse error: ${e.message}`);
  }
  const locSet = new Set(locs);

  // Assert EVERY subcategory URL from both schema lists is present exactly.
  for (const brand of SPARE_PARTS_SUBCATEGORIES) {
    const loc = expectedLoc("spare-parts", brand);
    if (!locSet.has(loc)) {
      failures.push(`missing spare-parts subcategory URL: ${loc}`);
    }
  }
  for (const brand of AUTOMOTIVE_SUBCATEGORIES) {
    const loc = expectedLoc("automotive", brand);
    if (!locSet.has(loc)) {
      failures.push(`missing automotive subcategory URL: ${loc}`);
    }
  }

  // Detect duplicate <loc> entries (locSet collapses them; locs does not)
  if (locSet.size !== locs.length) {
    const seen = new Set<string>();
    for (const l of locs) {
      if (seen.has(l)) failures.push(`duplicate URL in sitemap: ${l}`);
      seen.add(l);
    }
  }

  // Sanity: total subcategory entries should match the schema lists
  const subcatCount = locs.filter((l) => l.includes("categories?tab=")).length;
  const expectedMin = SPARE_PARTS_SUBCATEGORIES.length + AUTOMOTIVE_SUBCATEGORIES.length + 2; // +2 for the bare tab pages
  if (subcatCount < expectedMin) {
    failures.push(`expected at least ${expectedMin} categories?tab= URLs, found ${subcatCount}`);
  }

  // The old `brand` parameter remains an inbound alias, but sitemap entries
  // must only advertise the canonical `subCategory` form.
  for (const loc of locs.filter((l) => l.includes("/categories?"))) {
    if (new URL(loc).searchParams.has("brand")) {
      failures.push(`non-canonical brand parameter in sitemap URL: ${loc}`);
    }
  }

  if (failures.length > 0) {
    console.error(`FAIL: sitemap check against ${url}`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`OK: sitemap at ${url} contains all ${SPARE_PARTS_SUBCATEGORIES.length + AUTOMOTIVE_SUBCATEGORIES.length} subcategory URLs (${subcatCount} tab URLs total, ${locs.length} <url> entries).`);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
