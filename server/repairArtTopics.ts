import { and, eq, sql } from "drizzle-orm";
import { articles, systemSettings } from "@shared/schema";
import { db } from "./db";
import { correctArticleArtTopics } from "./topicTagger";

/** Versioned, repeat-safe correction: articles and their other data are retained. */
export async function repairArtTopics(): Promise<void> {
  const key = "art-topic-visual-arts-v3";
  const [done] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
  if (done) return;
  const rows = await db.select({
    id: articles.id, title: articles.title, summary: articles.summary,
    sourceName: articles.sourceName, topics: articles.topics,
  }).from(articles).where(sql`'Art' = ANY(${articles.topics})`);
  const changes = rows.flatMap(row => {
    const topics = correctArticleArtTopics(row.title, row.summary, row.sourceName, row.topics || []);
    return topics.includes("Art") ? [] : [{ ...row, nextTopics: topics }];
  });
  // Small atomic batches; do not overwrite tags changed by a concurrent refresh.
  for (let offset = 0; offset < changes.length; offset += 100) {
    const batch = changes.slice(offset, offset + 100);
    const cases = batch.map(row => sql`WHEN ${and(
      eq(articles.id, row.id),
      sql`${articles.topics} = ARRAY[${sql.join((row.topics || []).map(topic => sql`${topic}`), sql`, `)}]::text[]`,
    )} THEN ARRAY[${sql.join(row.nextTopics.map(topic => sql`${topic}`), sql`, `)}]::text[]`);
    await db.update(articles).set({
      topics: sql`CASE ${sql.join(cases, sql` `)} ELSE ${articles.topics} END`,
    }).where(sql`${articles.id} IN (${sql.join(batch.map(row => sql`${row.id}`), sql`, `)})`);
  }
  await db.insert(systemSettings).values({ key, value: "complete" }).onConflictDoNothing();
  console.log(`[Art topics] Corrected ${changes.length} unrelated Art tags; no articles deleted.`);
}
