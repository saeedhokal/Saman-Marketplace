---
name: Listing image performance
description: Why listing images must use the server resize endpoint, not full-res originals
---

The `/objects/*` route supports on-the-fly resize via `?w=<px>&q=<quality>` query params (sharp → WebP, server-cached). User-uploaded phone photos are multi-MB originals.

**Rule:** Every surface that *displays* a listing image (grids, thumbnails, inline gallery, related-products) must request a resized URL sized to its render box, not the raw original. Use the `objectImageUrl(url, width, quality)` helper in `client/src/lib/bustObjectUrl.ts` (it composes with `bustObjectUrl`). Full-res originals are only appropriate for a true download/export.

**Why:** Loading multi-MB originals on UAE mobile data caused listing-detail images to load slowly and sometimes stall halfway. Resizing dropped each image to ~100–200KB WebP.

**How to apply:** When adding any new `<img>` for a listing/object-storage image, pick a width matching its display size (e.g. grid card ~600, small thumb ~200–400, fullscreen 1400) rather than passing the bare `/objects/...` path. The `onError={retryObjectImg}` handler and the resize params coexist (retry only rewrites the `_` cache-buster).
