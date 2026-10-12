---
name: AI summary priorities
description: User's cost and reliability goals for LUM News AI summaries.
---

The user stated the goal is “reliable, low-cost AI news summaries” with a secure, user-configurable API key.

**Why:** The user explicitly requested these priorities when moving to OpenAI GPT-5 nano.

**How to apply:** Preserve caching and bounded corrective retries. If adding model fallback later, make any more expensive model an explicit administrator choice rather than an automatic upgrade.
