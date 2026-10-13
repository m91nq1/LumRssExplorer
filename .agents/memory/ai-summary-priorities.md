---
name: AI summary priorities
description: User's cost and reliability goals for LUM News AI summaries.
---

The user stated the goal is “reliable, low-cost AI news summaries” with a secure, user-configurable API key.

**Why:** The user explicitly requested these priorities when moving to OpenAI GPT-5 nano.

**How to apply:** Preserve caching and bounded corrective retries. If adding model fallback later, make any more expensive model an explicit administrator choice rather than an automatic upgrade.

A successful one-off OpenAI connection test does not establish that the running web application is using the same current credential.

**Why:** After a secret replacement, a fresh shell process successfully authenticated while the already-running workflow still returned provider authentication errors. This was runtime credential freshness, not evidence that the newly saved key was invalid.

**How to apply:** Check the application's actual HTTP summary endpoint after key changes, refreshing the workflow's environment when necessary. Verify real summary generation and a cache hit before declaring the end-user flow working; do not rely solely on an “OK” connection probe.
