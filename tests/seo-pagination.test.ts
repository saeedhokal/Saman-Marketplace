import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPaginationNavigation,
  categoryPagePath,
  getRequestedCategoryPage,
  paginateCategoryProducts,
} from "../server/seo-pagination";
import { buildSeoHeadForUrl } from "../server/seo";
import { storage } from "../server/storage";

test("category page paths preserve filters and omit page=1", () => {
  assert.equal(
    categoryPagePath("spare-parts", null, 1),
    "/categories?tab=spare-parts",
  );
  assert.equal(
    categoryPagePath("automotive", "Land Rover", 2),
    "/categories?tab=automotive&subCategory=Land%20Rover&page=2",
  );
});

test("requested page accepts positive integers and rejects invalid values", () => {
  const site = "https://thesamanapp.com";
  assert.equal(getRequestedCategoryPage("/categories?tab=automotive&page=2", site), 2);
  assert.equal(getRequestedCategoryPage("/categories?page=0", site), 1);
  assert.equal(getRequestedCategoryPage("/categories?page=2.5", site), 1);
  assert.equal(getRequestedCategoryPage("/categories?page=not-a-number", site), 1);
});

test("every listing appears on exactly one 30-item page", () => {
  const listings = Array.from({ length: 65 }, (_, index) => index + 1);
  const first = paginateCategoryProducts(listings, 1);
  const second = paginateCategoryProducts(listings, 2);
  const third = paginateCategoryProducts(listings, 3);

  assert.deepEqual(first.products, listings.slice(0, 30));
  assert.deepEqual(second.products, listings.slice(30, 60));
  assert.deepEqual(third.products, listings.slice(60, 65));
  assert.equal(first.totalPages, 3);
  assert.equal(new Set([...first.products, ...second.products, ...third.products]).size, 65);
});

test("out-of-range pages canonicalize to the last available page", () => {
  const page = paginateCategoryProducts(Array.from({ length: 35 }), 99);
  assert.equal(page.page, 2);
  assert.equal(page.products.length, 5);
});

test("pagination renders crawlable previous and next anchors", () => {
  const html = buildPaginationNavigation(2, 4, (page) =>
    categoryPagePath("spare-parts", null, page),
  );

  assert.match(
    html,
    /rel="prev" href="\/categories\?tab=spare-parts"/,
  );
  assert.match(
    html,
    /rel="next" href="\/categories\?tab=spare-parts&amp;page=3"/,
  );
});

test("category page 2 renders its own listings, canonical, and crawl links", async () => {
  const originalGetProducts = storage.getProducts;
  const listings = Array.from({ length: 65 }, (_, index) => ({
    id: index + 1,
    title: `Listing ${index + 1}`,
    price: 100 + index,
    status: "approved",
  }));

  storage.getProducts = async () => listings as any;
  try {
    const seo = await buildSeoHeadForUrl(
      "/categories?tab=spare-parts&page=2",
    );

    assert.ok(seo);
    assert.equal(
      seo.canonical,
      "https://thesamanapp.com/categories?tab=spare-parts&page=2",
    );
    assert.match(seo.bodyContent || "", /\/product\/listing-31-31/);
    assert.match(seo.bodyContent || "", /\/product\/listing-60-60/);
    assert.doesNotMatch(seo.bodyContent || "", /\/product\/listing-1-1"/);
    assert.match(
      seo.bodyContent || "",
      /rel="prev" href="\/categories\?tab=spare-parts"/,
    );
    assert.match(
      seo.bodyContent || "",
      /rel="next" href="\/categories\?tab=spare-parts&amp;page=3"/,
    );
    const itemListJson = (seo.jsonLd || "").match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    assert.ok(itemListJson);
    assert.equal(
      JSON.parse(itemListJson).url,
      "https://thesamanapp.com/categories?tab=spare-parts&page=2",
    );
  } finally {
    storage.getProducts = originalGetProducts;
  }
});