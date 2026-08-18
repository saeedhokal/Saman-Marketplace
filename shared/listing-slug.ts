/**
 * Utilities for converting listing titles to URL-friendly slugs.
 * Shared between client and server so both produce identical paths.
 */

/**
 * Convert a listing title to a URL-safe slug.
 * - ASCII alphanumeric characters are lowercased and kept.
 * - Arabic Unicode letters are preserved as-is (they are valid in URLs
 *   and display correctly in modern browsers; Google indexes them fine).
 * - All other characters (punctuation, emoji, etc.) become hyphens.
 * - Falls back to empty string only when the title is empty.
 */
export function titleToSlug(title: string): string {
  return title
    // Replace anything that is NOT ASCII alphanumeric and NOT Arabic script with a space
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, " ")
    .trim()
    .toLowerCase()          // only affects ASCII letters; Arabic is unchanged
    .replace(/\s+/g, "-")   // collapse runs of spaces/control chars to one hyphen
    .replace(/-+/g, "-")    // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/**
 * Build the full client-side path for a listing, e.g.
 *   listingPath("Toyota Camry Headlight", 42) → "/product/toyota-camry-headlight-42"
 *   listingPath("قطعة غيار", 7)               → "/product/listing-7"   (all Arabic → fallback)
 */
export function listingPath(title: string, id: number): string {
  const slug = titleToSlug(title) || "listing";
  return `/product/${slug}-${id}`;
}

/**
 * Extract the numeric listing id from a slug segment.
 *   "toyota-camry-headlight-42" → 42
 *   "42"                        → 42  (backward-compat: numeric-only)
 *   "listing-7"                 → 7
 */
export function parseListingId(slug: string): number {
  const match = slug.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : NaN;
}
