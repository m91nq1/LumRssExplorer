---
name: upsertArticles deduplication
description: PostgreSQL onConflictDoUpdate rejects duplicate IDs in same batch — must dedup before insert.
---

## Rule
When using `onConflictDoUpdate`, deduplicate the batch by the conflict target column (articles.id) before calling `.values(batch)`. PostgreSQL raises error code 21000 ("cannot affect row a second time") if two rows in the same INSERT share the same conflict key.

**Why:** RSS feeds can return the same article URL twice in one fetch (e.g. feed pagination overlap). Previously `onConflictDoNothing` silently dropped duplicates; `onConflictDoUpdate` does not.

**How to apply:** In `server/storage.ts` `upsertArticles()`, filter each batch with a `Set<string>` keyed on `a.id` before inserting.
