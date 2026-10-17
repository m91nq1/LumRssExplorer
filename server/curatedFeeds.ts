import type { InsertFeedSource, Topic } from "@shared/schema";

type FeedEntry = readonly [id: string, name: string, url: string];
const art: FeedEntry[] = [
  ["art-observed", "Art Observed", "https://artobserved.com/feed/"],
  ["contemporary-art-daily", "Contemporary Art Daily", "https://contemporaryartdaily.com/feed/"],
  ["we-make-money-not-art", "We Make Money Not Art", "https://we-make-money-not-art.com/feed/"],
  ["artreview", "ArtReview", "https://artreview.com/feed/"],
  ["artasiapacific", "ArtAsiaPacific", "https://artasiapacific.com/feed/"],
  ["e-flux-announcements", "e-flux Announcements", "https://www.e-flux.com/announcements/feed/"],
  ["widewalls", "Widewalls", "https://www.widewalls.ch/rss"],
  ["artdependence", "ArtDependence", "https://www.artdependence.com/rss/"],
  ["ocula-magazine", "Ocula Magazine", "https://ocula.com/magazine/rss/"],
  ["apollo-magazine", "Apollo Magazine", "https://www.apollo-magazine.com/feed/"],
  ["frieze", "Frieze", "https://www.frieze.com/rss.xml"],
  ["art-and-object", "Art & Object", "https://www.artandobject.com/rss.xml"],
  ["the-art-story", "The Art Story", "https://www.theartstory.org/feed/"],
  ["art-history-news", "Art History News", "https://arthistorynews.com/feed/"],
  ["dailyart-magazine", "DailyArt Magazine", "https://www.dailyartmagazine.com/feed/"],
  ["the-jealous-curator", "The Jealous Curator", "https://www.thejealouscurator.com/blog/feed/"],
  ["art21", "Art21", "https://art21.org/feed/"],
  ["sculpture-magazine", "Sculpture Magazine", "https://sculpture.org/feed/"],
  ["fine-art-connoisseur", "Fine Art Connoisseur", "https://fineartconnoisseur.com/feed/"],
  ["art-rabbit", "Art Rabbit", "https://www.artrabbit.com/"],
  ["art-institute-chicago", "Art Institute of Chicago", "https://www.artic.edu/feed"],
  ["guggenheim", "The Guggenheim", "https://www.guggenheim.org/feed"],
  ["cooper-hewitt", "Cooper Hewitt Design Museum", "https://www.cooperhewitt.org/feed/"],
  ["rubin-museum", "Rubin Museum of Himalayan Art", "https://rubinmuseum.org/feed/"],
  ["vero-beach-museum", "Vero Beach Museum of Art", "https://www.vbmuseum.org/feed/"],
  ["getty-iris", "Getty — The Iris", "https://blogs.getty.edu/iris/feed/"],
  ["national-gallery-art", "National Gallery of Art", "https://www.nga.gov/blog/feed.html"],
  ["phillips-collection", "The Phillips Collection", "https://www.phillipscollection.org/feed"],
  ["metropolitan-museum", "The Metropolitan Museum of Art", "https://www.metmuseum.org/blogs/rss"],
  ["museum-modern-art", "Museum of Modern Art", "https://www.moma.org/magazine/rss"],
  ["tate", "Tate", "https://www.tate.org.uk/rss.xml"],
  ["art-gallery-ontario", "Art Gallery of Ontario", "https://ago.ca/rss.xml"],
  ["national-gallery-singapore", "National Gallery Singapore", "https://www.nationalgallery.sg/rss.xml"],
  ["brooklyn-museum", "Brooklyn Museum", "https://www.brooklynmuseum.org/rss"],
  ["frick-collection", "The Frick Collection", "https://www.frick.org/rss.xml"],
  ["design-you-trust", "Design You Trust", "https://designyoutrust.com/feed/"],
  ["communication-arts", "Communication Arts", "https://www.commarts.com/rss"],
  ["kaltblut-magazine", "KALTBLUT Magazine", "https://kaltblut-magazine.com/feed/"],
  ["my-modern-met", "My Modern Met", "https://mymodernmet.com/feed/"],
  ["yatzer", "Yatzer", "https://www.yatzer.com/rss"],
  ["dezeen", "Dezeen", "https://www.dezeen.com/feed/"],
  ["archdaily", "ArchDaily", "https://www.archdaily.com/rss"],
  ["lenscratch", "Lenscratch", "https://lenscratch.com/feed/"],
  ["aperture", "Aperture", "https://aperture.org/feed/"],
  ["british-journal-photography", "British Journal of Photography", "https://1854.photography/feed/"],
  ["eye-of-photography", "The Eye of Photography", "https://loeildelaphotographie.com/en/feed/"],
  ["photoworks", "Photoworks", "https://photoworks.org.uk/feed/"],
  ["public-domain-review", "The Public Domain Review", "https://publicdomainreview.org/rss.xml"],
  ["petapixel", "PetaPixel", "https://petapixel.com/feed/"],
  ["wallpaper", "Wallpaper*", "https://www.wallpaper.com/rss"],
];

const sports: FeedEntry[] = [
  ["bbc-football", "BBC Football", "https://feeds.bbci.co.uk/sport/football/rss.xml"],
  ["bbc-premier-league", "BBC Premier League", "https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml"],
  ["bbc-champions-league", "BBC Champions League", "https://feeds.bbci.co.uk/sport/football/champions-league/rss.xml"],
  ["bbc-european-football", "BBC European Football", "https://feeds.bbci.co.uk/sport/football/european/rss.xml"],
  ["bbc-fa-cup", "BBC FA Cup", "https://feeds.bbci.co.uk/sport/football/fa-cup/rss.xml"],
  ["bbc-scottish-football", "BBC Scottish Football", "https://feeds.bbci.co.uk/sport/football/scottish/rss.xml"],
  ["bbc-womens-football", "BBC Women's Football", "https://feeds.bbci.co.uk/sport/football/womens/rss.xml"],
  ["guardian-football", "The Guardian Football", "https://www.theguardian.com/football/rss"],
  ["guardian-premier-league", "The Guardian Premier League", "https://www.theguardian.com/football/premierleague/rss"],
  ["guardian-championship", "The Guardian Championship", "https://www.theguardian.com/football/championship/rss"],
  ["guardian-womens-football", "The Guardian Women's Football", "https://www.theguardian.com/football/womensfootball/rss"],
  ["guardian-transfer-window", "The Guardian Transfer Window", "https://www.theguardian.com/football/transfer-window/rss"],
  ["athletic-football", "The Athletic Football", "https://www.nytimes.com/athletic/rss/football/"],
  ["athletic-premier-league", "The Athletic Premier League", "https://www.nytimes.com/athletic/rss/premier-league/"],
  ["athletic-arsenal", "The Athletic Arsenal", "https://www.nytimes.com/athletic/rss/football/arsenal/"],
  ["sky-sports-football", "Sky Sports Football", "https://www.skysports.com/rss/11095"],
  ["espn-soccer", "ESPN Soccer", "https://www.espn.com/espn/rss/soccer/news"],
  ["soccernews", "SoccerNews.com", "https://www.soccernews.com/feed/"],
  ["90min", "90min", "https://www.90min.com/rss"],
  ["football-co-uk", "Football.co.uk", "https://www.football.co.uk/rss/"],
];

function makeFeeds(category: "art" | "sports", entries: FeedEntry[]): InsertFeedSource[] {
  return entries.map(([id, name, url]) => ({
    id: `curated-${id}`, name, url, category, sourceType: "rss", region: "Global",
  }));
}

export const CURATED_FEEDS = [...makeFeeds("art", art), ...makeFeeds("sports", sports)];

// RSS URLs often differ only in HTTP/HTTPS, www, or a trailing slash.
export function normalizeFeedUrl(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.sort();
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.port ? `:${url.port}` : ""}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  } catch {
    // A malformed legacy source must not stop registration of valid new feeds.
    return value.trim();
  }
}

const topicByUrl = new Map(CURATED_FEEDS.map(feed => [
  normalizeFeedUrl(feed.url), feed.category === "art" ? "Art" as Topic : "Sports" as Topic,
]));
export const CURATED_SOURCE_TOPICS = new Map(CURATED_FEEDS.map(feed => [
  feed.name.toLowerCase(), feed.category === "art" ? "Art" as Topic : "Sports" as Topic,
]));

export function curatedFeedTopic(url: string): Topic | undefined {
  return topicByUrl.get(normalizeFeedUrl(url));
}
