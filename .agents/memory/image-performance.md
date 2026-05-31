---
name: Listing image performance
description: Why listing images must use the server resize endpoint, not full-res originals
---

User-uploaded listing photos are multi-MB phone originals. Any surface that *displays* a listing/object-storage image must request a server-resized version sized to its render box — never the bare original. Full-res is only appropriate for a true download/export.

**Why:** Loading multi-MB originals on UAE mobile data made listing-detail images load slowly and sometimes stall halfway; resizing cut each to ~100–200KB WebP.

**How to apply:** The `/objects/*` route already supports on-the-fly resize via query params; there's a client helper for composing those URLs. When adding a new listing image, pass a width matching its on-screen size rather than the raw path.
