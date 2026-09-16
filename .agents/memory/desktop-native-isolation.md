---
name: Desktop-only visual isolation
description: Why viewport breakpoints alone cannot protect the native app during desktop redesigns.
---
Desktop redesign styling requires both a web-platform gate and a width breakpoint.

**Why:** Native tablets can exceed desktop breakpoints; shared fallback route classes allowed desktop margins and hidden navigation to leak into the native layout during visual review.

**How to apply:** Keep desktop-only classes out of native/mobile fallback branches, scope shared theme tokens under a web-only ancestor, and preserve existing browser navigation below the new desktop breakpoint.