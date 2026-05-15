// Appends a version tag to /objects/ URLs so iOS WKWebView and other browser
// caches treat them as new URLs and bypass any stale cached redirects from
// an earlier broken deploy. Bump CACHE_BUSTER if we ever need to do this again.
const CACHE_BUSTER = "v2";

export function bustObjectUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (!url.startsWith("/objects/")) return url;
  return url.includes("?") ? `${url}&_=${CACHE_BUSTER}` : `${url}?_=${CACHE_BUSTER}`;
}
