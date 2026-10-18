import { test } from "node:test";
import assert from "node:assert/strict";
import { CURATED_FEEDS, curatedFeedTopic, normalizeFeedUrl } from "./curatedFeeds";
import { seedCuratedFeeds } from "./seedCuratedFeeds";
import { tagArticleTopics } from "./topicTagger";
import type { FeedSource, InsertFeedSource } from "@shared/schema";
import Parser from "rss-parser";
import { ingestFeed } from "./rssIngestor";

test("all requested art and football feeds have unique IDs, URLs and correct topic profiles", () => {
  assert.equal(CURATED_FEEDS.filter(feed => feed.category === "art").length, 50);
  assert.equal(CURATED_FEEDS.filter(feed => feed.category === "sports").length, 20);
  assert.equal(new Set(CURATED_FEEDS.map(feed => feed.id)).size, 70);
  assert.equal(new Set(CURATED_FEEDS.map(feed => normalizeFeedUrl(feed.url))).size, 70);
  for (const feed of CURATED_FEEDS) {
    assert.ok(feed.id.length <= 50);
    assert.equal(new URL(feed.url).protocol, "https:");
    const topic = feed.category === "art" ? "Art" : "Sports";
    assert.equal(curatedFeedTopic(feed.url), topic);
    const title = topic === "Art" ? "Museum opens a painting exhibition" : "Latest update";
    assert.ok(tagArticleTopics(title, "", feed.name).includes(topic), feed.name);
  }
});

test("URL deduplication preserves existing IDs and disabled feeds across repeated startup", async () => {
  assert.equal(normalizeFeedUrl("legacy-invalid-url"), "legacy-invalid-url");
  const asSource = (feed: InsertFeedSource): FeedSource => ({
    country: null, region: "Global", isEnabled: true, sourceType: "rss", createdAt: new Date(),
    ...feed,
  });
  const first = CURATED_FEEDS[0];
  const sources = [asSource({ ...first, id: "existing-custom-id", name: "My existing source",
    url: first.url.replace("https:", "http:").replace(/\/$/, ""), category: "world", isEnabled: false })];
  const store = {
    getFeedSources: async () => sources,
    createFeedSource: async (feed: InsertFeedSource) => {
      const source = asSource(feed); sources.push(source); return source;
    },
    updateFeedSource: async (id: string, updates: Partial<InsertFeedSource>) => {
      const source = sources.find(source => source.id === id)!;
      Object.assign(source, updates); return source;
    },
  };
  assert.deepEqual(await seedCuratedFeeds(store), { added: 69, existing: 1 });
  assert.equal(sources[0].id, "existing-custom-id");
  assert.equal(sources[0].name, "My existing source");
  assert.equal(sources[0].isEnabled, false);
  assert.equal(sources[0].category, "art");
  assert.deepEqual(await seedCuratedFeeds(store), { added: 0, existing: 70 });
  assert.equal(sources.length, 70);
});

test("ingestion assigns curated topics even when an existing feed has a custom label", async () => {
  const original = Parser.prototype.parseURL;
  try {
    Parser.prototype.parseURL = (async () => ({
      items: [{ title: "Latest update", link: "https://example.test/article",
        pubDate: "Fri, 16 Oct 2026 12:00:00 GMT", contentSnippet: "An update from this source." }],
    })) as typeof original;
    for (const category of ["art", "sports"]) {
      const feed = CURATED_FEEDS.find(feed => feed.category === category)!;
      const [article] = await ingestFeed({
        ...feed, name: "Custom source label", country: null, region: "Global",
        sourceType: "rss", isEnabled: true, createdAt: new Date(),
      });
      assert.deepEqual(article.topics, [category === "art" ? "Art" : "Sports"]);
      assert.equal(article.sourceId, feed.id);
    }
  } finally {
    Parser.prototype.parseURL = original;
  }
});
