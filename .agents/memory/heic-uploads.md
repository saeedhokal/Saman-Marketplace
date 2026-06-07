---
name: HEIC photo uploads
description: Why iPhone HEIC photos appear as broken images, and how uploads must handle them.
---

# HEIC photo uploads break unless converted client-side

iPhones save photos as HEIC/HEIF by default. A raw HEIC upload renders as a
broken image **everywhere** in this app:

- Browsers (incl. the Capacitor WKWebView) cannot decode HEIC, so plain
  `/objects/` image tags show the broken-image icon.
- The server's `sharp`/libvips build has **no HEIC decoder compiled in**
  (`heif` format input lists only `.avif`; decoding HEIC throws "Support for
  this compression format has not been built in"). So the resize endpoint
  (`/objects/...?w=&q=`) returns 500 for HEIC, breaking thumbnails too.

**Why client-side conversion:** product/profile images upload directly from the
phone to object storage via a presigned URL (`POST /api/uploads/request-url`
then `PUT` to GCS). The server never sees the bytes, so it cannot convert or
reject HEIC. Conversion must happen in the browser before upload.

**How it's handled:** all image uploads funnel through `uploadFile` in
`client/src/hooks/use-upload.ts`, which calls `convertHeicToJpeg`
(`client/src/lib/convertHeic.ts`). Detection sniffs the ISO-BMFF `ftyp` brand
(file.type/extension are unreliable); conversion lazy-imports `heic2any`
(heavy libheif wasm) only when a HEIC is actually detected.

**Existing broken listings** (uploaded before this fix) keep their HEIC objects
— the bytes are still HEIC in storage. The object 302-redirects fine but the
image won't render. Only re-uploading/replacing that photo fixes it; the
production DB is read-only from the agent tools so it can't be patched directly.
