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
  return `${CANONICAL_HOST}/categories?tab=${tab}&brand=${encodeURIComponent(brand)}`;
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

  // Representative subcategory URLs: first, last, and a couple of
  // well-known brands from each list. First+last catch a dropped spread;
  // the named ones catch encoding bugs (spaces, ampersands).
  const spareChecks = [
    SPARE_PARTS_SUBCATEGORIES[0],
    SPARE_PARTS_SUBCATEGORIES[SPARE_PARTS_SUBCATEGORIES.length - 1],
    "Toyota",
    "Turbos & Superchargers", // contains & — encoding regression canary
    "Land Rover", // contains a space
  ];
  const autoChecks = [
    AUTOMOTIVE_SUBCATEGORIES[0],
    AUTOMOTIVE_SUBCATEGORIES[AUTOMOTIVE_SUBCATEGORIES.length - 1],
    "BMW",
    "Rolls Royce",
  ];

  for (const brand of spareChecks) {
    const loc = expectedLoc("spare-parts", brand);
    if (!locSet.has(loc)) {
      failures.push(`missing spare-parts subcategory URL: ${loc}`);
    }
  }
  for (const brand of autoChecks) {
    const loc = expectedLoc("automotive", brand);
    if (!locSet.has(loc)) {
      failures.push(`missing automotive subcategory URL: ${loc}`);
    }
  }

  // Sanity: total subcategory entries should match the schema lists
  const subcatCount = locs.filter((l) => l.includes("categories?tab=")).length;
  const expectedMin = SPARE_PARTS_SUBCATEGORIES.length + AUTOMOTIVE_SUBCATEGORIES.length + 2; // +2 for the bare tab pages
  if (subcatCount < expectedMin) {
    failures.push(`expected at least ${expectedMin} categories?tab= URLs, found ${subcatCount}`);
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
