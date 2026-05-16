// Appends a version tag to /objects/ URLs so iOS WKWebView and other browser
// caches treat them as new URLs and bypass any stale cached redirects from
// an earlier broken deploy. Bump CACHE_BUSTER if we ever need to do this again.
const CACHE_BUSTER = "v3";

export function bustObjectUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!url.startsWith("/objects/")) return url;
  // If the server already added a cache-buster, don't double-bust.
  if (url.includes("_=")) return url;
  return url.includes("?") ? `${url}&_=${CACHE_BUSTER}` : `${url}?_=${CACHE_BUSTER}`;
}
