---
name: Codemagic npm registry
description: Prevent external Codemagic builds from inheriting Replit-only package download URLs.
---

External CI cannot resolve Replit's internal package firewall hostname. A package-lock entry with an internal `resolved` URL can make Codemagic fail during dependency installation even when the package is public on npm.

**Why:** The AppsFlyer Capacitor package was publicly available, but Codemagic attempted to download its lockfile tarball from a Replit-internal hostname and failed before compilation.

**How to apply:** For packages installed in Replit and built externally, ensure lockfile tarballs use `https://registry.npmjs.org/...` and configure Codemagic to run `npm ci --registry=https://registry.npmjs.org`.