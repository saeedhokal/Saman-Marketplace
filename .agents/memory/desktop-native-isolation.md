---
name: Desktop-only visual isolation
description: Why viewport breakpoints alone cannot protect the native app during desktop redesigns.
---
Desktop redesign styling requires both a web-platform gate and a width breakpoint.

**Why:** Native tablets can exceed desktop breakpoints; shared fallback route classes allowed desktop margins and hidden navigation to leak into the native layout during visual review.

**How to apply:** Keep desktop-only classes out of native/mobile fallback branches, scope shared theme tokens under a web-only ancestor, and preserve existing browser navigation below the new desktop breakpoint.

Desktop website theme selection must remain independent of the mobile/native dark-mode preference. Portal theme rules also require an active desktop marketplace root, not just a document theme attribute.

**Why:** A document attribute can persist after navigation; using it alone can recolor menus on unrelated routes. Shared light desktop panels can also retain hardcoded backgrounds after inherited text tokens switch to dark mode.

**How to apply:** Gate portal overrides on the active desktop surface, and review explicit backgrounds and inline styles alongside inherited tokens when adding themes.