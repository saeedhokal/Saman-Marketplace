---
name: AppsFlyer on Capacitor 7
description: Version compatibility and package-install behavior for AppsFlyer in this Capacitor 7 project.
---

Use `appsflyer-capacitor-plugin` version 6.17.9 while the app remains on Capacitor 7. Do not install the unversioned latest release, which targets Capacitor 8.

**Why:** AppsFlyer's current installation guide names an npm `latest-7` tag, but the registry did not expose that tag. Version 6.17.9 is the last compatible release before 6.17.91 switches to Capacitor 8.

**How to apply:** Keep the dependency pinned within the 6.17.9 line and re-check the official compatibility table before upgrading Capacitor or AppsFlyer.