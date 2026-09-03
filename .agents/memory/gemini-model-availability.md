---
name: Gemini model availability
description: Google AI Studio model availability observed with newly created API keys.
---

New Google AI Studio API users cannot call Gemini 2.5 Flash; the API returns a 404 and directs them to Gemini 3.6 Flash.

**Why:** A valid newly added Gemini key reached Google successfully, but the older model was rejected as unavailable to new users.

**How to apply:** When configuring or debugging Google AI Studio summaries, use the provider's current recommended model and treat a model-specific 404 separately from key authentication failures.