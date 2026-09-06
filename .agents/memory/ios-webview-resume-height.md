---
name: iOS WebView resume height
description: Preventing the Capacitor interface from collapsing when iOS resumes the app from a notification.
---

Treat viewport heights reported while an iOS WebView is resuming as untrusted. Ignore zero or implausibly small measurements, retain the last usable height, and re-measure after visibility and page-resume events. Keep a CSS full-viewport minimum-height fallback.

**Why:** iOS can emit a transient resize with a zero-height viewport when opening the Capacitor app from a push notification. Persisting that measurement collapses the full React layout while leaving the dark HTML background visible, which looks like a blank app.

**How to apply:** Any future viewport-sizing or keyboard-layout changes must preserve the invalid-height guard, delayed resume re-measurements, and CSS minimum-height fallback.