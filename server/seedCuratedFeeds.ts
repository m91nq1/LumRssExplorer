import { createHash } from "node:crypto";
import type { IStorage } from "./storage";
import { CURATED_FEEDS, normalizeFeedUrl } from "./curatedFeeds";

type FeedStorage = Pick<IStorage, "getFeedSources" | "createFeedSource" | "updateFeedSource">;

export async function seedCuratedFeeds(store: FeedStorage) {
  const sources = await store.getFeedSources();
  const byUrl = new Map(sources.map(source => [normalizeFeedUrl(source.url), source]));
  const ids = new Set(sources.map(source => source.id));
  let added = 0;
  let existing = 0;
  for (const feed of CURATED_FEEDS) {
    const url = normalizeFeedUrl(feed.url);
    const match = byUrl.get(url);
    if (match) {
      // Keep the existing source ID, label, region and administrator's enabled setting.
      if (match.category !== feed.category) {
        await store.updateFeedSource(match.id, { category: feed.category });
      }
      existing++;
      continue;
    }
    const id = ids.has(feed.id)
      ? `${feed.id.slice(0, 40)}-${createHash("sha256").update(url).digest("hex").slice(0, 8)}`
      : feed.id;
    const created = await store.createFeedSource({ ...feed, id });
    ids.add(created.id);
    byUrl.set(url, created);
    added++;
  }
  return { added, existing };
}
