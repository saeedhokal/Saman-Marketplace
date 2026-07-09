---
name: GPT-5 reasoning token budget
description: gpt-5 family hidden reasoning tokens count against max_completion_tokens — low caps cause silent empty outputs
---

Rule: when calling gpt-5 / gpt-5-mini via chat completions, hidden reasoning tokens are billed against `max_completion_tokens`. A low cap (1–2k) can be fully consumed by reasoning on longer inputs, returning **empty content with a 200 response** — no error thrown.

**Why:** The listing translate feature silently failed for longer descriptions (July 2026): the model spent the whole 2k budget reasoning, content came back empty, and fallback code quietly returned the original text, so users saw "no translation needed."

**How to apply:** For simple transform tasks (translation, formatting), set `reasoning_effort: "minimal"` (also ~10x faster) and give a generous `max_completion_tokens`. Never silently fall back on empty content — log `finish_reason` at minimum.
