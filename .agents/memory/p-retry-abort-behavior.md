---
name: p-retry abort behavior
description: Version-specific abort handling for batch jobs that should not retry permanent failures
---

The installed p-retry package exposes `AbortError` as a named export; accessing it as a property of the default `pRetry` function is invalid.

**Why:** Older examples use `pRetry.AbortError`, but this package version's types and runtime export it separately. Relying on the old form can throw a different error instead of stopping a retry.

**How to apply:** When adjusting retry logic, use the named export to abort non-retriable failures and check the installed package's type declarations before following older examples.