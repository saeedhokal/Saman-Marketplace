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

// Returns a /objects/ URL that asks the server to resize the image to `width`
// (and re-encode at `quality`). Phone photos are often several MB; serving a
// small resized/WebP version makes grids and thumbnails load far faster on
// mobile data. Non-/objects/ URLs are returned unchanged.
export function objectImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 80,
): string {
  const based = bustObjectUrl(url);
  if (!based.startsWith("/objects/")) return based;
  const sep = based.includes("?") ? "&" : "?";
  return `${based}${sep}w=${width}&q=${quality}`;
}

// Self-healing onError handler for <img> tags pointing at /objects/ URLs.
// If the image fails to load (stale browser cache, expired signed URL, network
// blip), retry ONCE with a unique timestamp that bypasses every cache layer.
// Tag the element with data-retried so we don't loop forever on truly missing
// images.
export function retryObjectImg(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.retried === "1") return;
  const src = img.getAttribute("src") || "";
  if (!src.includes("/objects/")) return;
  img.dataset.retried = "1";
  console.warn("Retrying object image after load failure", { src });
  try {
    const url = new URL(src, window.location.origin);
    url.searchParams.set("_", `r${Date.now()}`);
    img.src = url.pathname + url.search;
  } catch {
    const base = src.split("?")[0];
    img.src = `${base}?_=r${Date.now()}`;
  }
}
