---
name: Sports topic classifier fix
description: Root cause of persistent Sports misclassification and the three-part fix.
---

## Root cause chain
1. Old classifier tagged Mongabay India articles as Sports (single word match + no minMatches guard).
2. Code fix was applied to `topicTagger.ts` but **`upsertArticles` used `onConflictDoNothing()`** — existing DB rows were never updated, so the fix only applied to brand-new articles.
3. `normalizeArticleCategory` tried to correct Sports→other but over-triggered: generic terms like "campaign", "vote", "governor" in `OVERRIDE_TOPIC_SIGNALS` flipped legitimate sports articles (e.g. FIFA/World Cup) to US Politics.

## Three-part fix
1. **`storage.ts`** — `onConflictDoNothing()` → `onConflictDoUpdate({ topics, polarisationScore, polarisationReasons, title, summary, imageUrl })` so every refresh re-classifies existing articles.
2. **`topicTagger.ts` OVERRIDE_TOPIC_SIGNALS** — removed generic terms ("campaign", "vote", "ballot", "governor", "market", "economy") that appear in sports contexts; kept only highly-specific terms.
3. **`topicTagger.ts` normalizeArticleCategory** — added raw Sports keyword count check: if article has ≥2 genuine sports keywords (ignoring source bonus), return Sports immediately without any override.

**Why:** These three issues interact — the upsert silently masked the classifier bugs, and the correction layer introduced new bugs for legitimate sports articles.
