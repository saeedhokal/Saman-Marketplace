/**
 * Tests for shared/listing-slug.ts
 * Run with: npx tsx --test tests/listing-slug.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { titleToSlug, listingPath, parseListingId } from "../shared/listing-slug";

describe("titleToSlug", () => {
  it("lowercases ASCII letters", () => {
    assert.equal(titleToSlug("Toyota Camry"), "toyota-camry");
  });

  it("replaces spaces with hyphens", () => {
    assert.equal(titleToSlug("BMW M3 Competition"), "bmw-m3-competition");
  });

  it("strips punctuation and special characters", () => {
    assert.equal(titleToSlug("Part (2023) - New!"), "part-2023-new");
  });

  it("collapses multiple hyphens", () => {
    assert.equal(titleToSlug("Part  --  New"), "part-new");
  });

  it("preserves Arabic letters instead of stripping them", () => {
    const slug = titleToSlug("قطعة غيار");
    // Arabic letters must be present in slug — not stripped to empty
    assert.ok(slug.length > 0, "Arabic-only title must produce a non-empty slug");
    assert.ok(
      /[\u0600-\u06FF]/.test(slug),
      `Expected Arabic characters in slug, got: "${slug}"`
    );
  });

  it("handles mixed Arabic + English title", () => {
    const slug = titleToSlug("Toyota قطعة");
    assert.ok(slug.includes("toyota"), "must contain the ASCII part");
    assert.ok(/[\u0600-\u06FF]/.test(slug), "must preserve Arabic characters");
  });

  it("returns empty string for empty input", () => {
    assert.equal(titleToSlug(""), "");
  });

  it("trims leading and trailing hyphens", () => {
    const slug = titleToSlug("!hello!");
    assert.ok(!slug.startsWith("-"), `slug must not start with hyphen: "${slug}"`);
    assert.ok(!slug.endsWith("-"), `slug must not end with hyphen: "${slug}"`);
  });
});

describe("listingPath", () => {
  it("produces /product/<slug>-<id>", () => {
    assert.equal(listingPath("Toyota Camry Headlight", 42), "/product/toyota-camry-headlight-42");
  });

  it("falls back to 'listing' slug for empty titles", () => {
    assert.equal(listingPath("", 7), "/product/listing-7");
  });

  it("uses Arabic letters in slug for Arabic-only titles", () => {
    const path = listingPath("قطعة غيار", 7);
    assert.ok(path.startsWith("/product/"), "must start with /product/");
    assert.ok(path.endsWith("-7"), "must end with the numeric id");
    assert.ok(/[\u0600-\u06FF]/.test(path), "must contain Arabic letters");
  });

  it("always ends with the numeric id", () => {
    const path = listingPath("BMW M3", 123);
    assert.ok(path.endsWith("-123"), `path must end with -123, got: "${path}"`);
  });
});

describe("parseListingId", () => {
  it("parses id from slug with title prefix", () => {
    assert.equal(parseListingId("toyota-camry-headlight-42"), 42);
  });

  it("parses plain numeric slug (backward-compat)", () => {
    assert.equal(parseListingId("123"), 123);
  });

  it("parses id from Arabic slug", () => {
    assert.equal(parseListingId("قطعة-غيار-7"), 7);
  });

  it("returns NaN for non-numeric slug with no trailing number", () => {
    assert.ok(isNaN(parseListingId("no-numbers-here")));
  });
});

describe("redirect round-trip", () => {
  it("parseListingId extracts the same id used to build the path", () => {
    const id = 99;
    const path = listingPath("Garrett Turbocharger GTX3582R", id);
    const segment = path.replace("/product/", "");
    assert.equal(parseListingId(segment), id);
  });

  it("Arabic title round-trip", () => {
    const id = 55;
    const path = listingPath("إنفينيتي QX80", id);
    const segment = path.replace("/product/", "");
    assert.equal(parseListingId(segment), id);
  });
});
