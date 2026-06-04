import { Topic, TOPICS } from "@shared/schema";

interface TopicKeywords {
  topic: Topic;
  keywords: string[];
  minMatches?: number;
}

// Source name fragments → forced topic boost
// Keys are lowercase substrings of source names. When a source name contains one of these,
// the mapped topic receives a large score bonus (+10) so it beats keyword-only matches.
const SOURCE_TOPIC_PROFILES: Array<{ fragment: string; topic: Topic; region?: string }> = [
  // Environment / Climate sources
  { fragment: "mongabay", topic: "Environment / Climate" },
  { fragment: "carbon brief", topic: "Environment / Climate" },
  { fragment: "cleantechnica", topic: "Environment / Climate" },
  { fragment: "inside climate", topic: "Environment / Climate" },
  { fragment: "climate central", topic: "Environment / Climate" },
  { fragment: "desmog", topic: "Environment / Climate" },
  { fragment: "e360", topic: "Environment / Climate" },
  { fragment: "yale environment", topic: "Environment / Climate" },
  { fragment: "conservation news", topic: "Environment / Climate" },
  { fragment: "rewilding", topic: "Environment / Climate" },
  { fragment: "resilience.org", topic: "Environment / Climate" },
  { fragment: "earth.org", topic: "Environment / Climate" },
  { fragment: "treehugger", topic: "Environment / Climate" },
  { fragment: "grist", topic: "Environment / Climate" },
  { fragment: "climate home", topic: "Environment / Climate" },
  { fragment: "guardian environment", topic: "Environment / Climate" },
  { fragment: "reuters climate", topic: "Environment / Climate" },
  { fragment: "bbc environment", topic: "Environment / Climate" },
  // Sports sources
  { fragment: "espn", topic: "Sports" },
  { fragment: "sky sports", topic: "Sports" },
  { fragment: "bbc sport", topic: "Sports" },
  { fragment: "the athletic", topic: "Sports" },
  { fragment: "bleacher report", topic: "Sports" },
  { fragment: "goal.com", topic: "Sports" },
  { fragment: "nba.com", topic: "Sports" },
  { fragment: "nfl.com", topic: "Sports" },
  { fragment: "mlb.com", topic: "Sports" },
  { fragment: "cricket buzz", topic: "Sports" },
  { fragment: "cricbuzz", topic: "Sports" },
  { fragment: "cricket info", topic: "Sports" },
  { fragment: "cricinfo", topic: "Sports" },
  { fragment: "f1.com", topic: "Sports" },
  { fragment: "formula 1", topic: "Sports" },
  { fragment: "mma fighting", topic: "Sports" },
  { fragment: "sports illustrated", topic: "Sports" },
  { fragment: "eurosport", topic: "Sports" },
  { fragment: "tennis world", topic: "Sports" },
  { fragment: "boxing news", topic: "Sports" },
  // Technology / AI sources
  { fragment: "techcrunch", topic: "AI & Technology" },
  { fragment: "the verge", topic: "AI & Technology" },
  { fragment: "ars technica", topic: "AI & Technology" },
  { fragment: "wired", topic: "AI & Technology" },
  { fragment: "mit technology", topic: "AI & Technology" },
  { fragment: "venturebeat", topic: "AI & Technology" },
  { fragment: "engadget", topic: "AI & Technology" },
  { fragment: "arstechnica", topic: "AI & Technology" },
  { fragment: "techmeme", topic: "AI & Technology" },
  { fragment: "thenextweb", topic: "AI & Technology" },
  // Cybersecurity sources
  { fragment: "krebs on security", topic: "Crime & Justice" },
  { fragment: "krebsonsecurity", topic: "Crime & Justice" },
  { fragment: "the hacker news", topic: "Crime & Justice" },
  { fragment: "bleepingcomputer", topic: "Crime & Justice" },
  { fragment: "threatpost", topic: "Crime & Justice" },
  // Finance sources
  { fragment: "marketwatch", topic: "Finance & Markets" },
  { fragment: "wall street", topic: "Finance & Markets" },
  { fragment: "financial times", topic: "Finance & Markets" },
  { fragment: "bloomberg", topic: "Finance & Markets" },
  { fragment: "the economist", topic: "Finance & Markets" },
  { fragment: "investing.com", topic: "Finance & Markets" },
  { fragment: "zero hedge", topic: "Finance & Markets" },
  { fragment: "zerohedge", topic: "Finance & Markets" },
  // Science & Health sources
  { fragment: "science daily", topic: "Science & Health" },
  { fragment: "sciencedaily", topic: "Science & Health" },
  { fragment: "new scientist", topic: "Science & Health" },
  { fragment: "scientific american", topic: "Science & Health" },
  { fragment: "quanta", topic: "Science & Health" },
  { fragment: "stat news", topic: "Science & Health" },
  { fragment: "pubmed", topic: "Science & Health" },
  { fragment: "nature.com", topic: "Science & Health" },
  { fragment: "nasa", topic: "Science & Health" },
  { fragment: "plos", topic: "Science & Health" },
  { fragment: "mayo clinic", topic: "Science & Health" },
  { fragment: "harvard health", topic: "Science & Health" },
  { fragment: "webmd", topic: "Science & Health" },
  // Celebrity / Entertainment sources
  { fragment: "tmz", topic: "Celebrity & Entertainment" },
  { fragment: "people.com", topic: "Celebrity & Entertainment" },
  { fragment: "variety", topic: "Celebrity & Entertainment" },
  { fragment: "hollywood reporter", topic: "Celebrity & Entertainment" },
  { fragment: "deadline", topic: "Celebrity & Entertainment" },
  { fragment: "page six", topic: "Celebrity & Entertainment" },
  { fragment: "entertainment weekly", topic: "Celebrity & Entertainment" },
  { fragment: "e! news", topic: "Celebrity & Entertainment" },
  { fragment: "vulture", topic: "Celebrity & Entertainment" },
  { fragment: "billboard", topic: "Celebrity & Entertainment" },
  { fragment: "rolling stone", topic: "Celebrity & Entertainment" },
  { fragment: "pitchfork", topic: "Celebrity & Entertainment" },
  { fragment: "just jared", topic: "Celebrity & Entertainment" },
  { fragment: "daily mail", topic: "Celebrity & Entertainment" },
  { fragment: "ok magazine", topic: "Celebrity & Entertainment" },
  // US Politics
  { fragment: "politico", topic: "US Politics" },
  { fragment: "the hill", topic: "US Politics" },
  { fragment: "axios", topic: "US Politics" },
  { fragment: "fivethirtyeight", topic: "US Politics" },
  { fragment: "ballotpedia", topic: "US Politics" },
  { fragment: "national review", topic: "US Politics" },
  { fragment: "daily kos", topic: "US Politics" },
  // Europe Politics
  { fragment: "euractiv", topic: "Europe Politics" },
  { fragment: "euobserver", topic: "Europe Politics" },
  { fragment: "politico europe", topic: "Europe Politics" },
  // War / Conflict
  { fragment: "breaking defense", topic: "War / Conflict" },
  { fragment: "defence one", topic: "War / Conflict" },
  { fragment: "defenseone", topic: "War / Conflict" },
  { fragment: "war on the rocks", topic: "War / Conflict" },
  { fragment: "sofrep", topic: "War / Conflict" },
  { fragment: "naval news", topic: "War / Conflict" },
  { fragment: "kyiv independent", topic: "War / Conflict" },
  { fragment: "ukraine", topic: "War / Conflict" },
];

const TOPIC_KEYWORDS: TopicKeywords[] = [
  {
    topic: "War / Conflict",
    keywords: [
      "war", "conflict", "military", "troops", "invasion", "missile", "bomb",
      "attack", "combat", "soldiers", "army", "navy", "airstrike", "drone strike",
      "cease-fire", "ceasefire", "peace talks", "offensive", "defensive", "battle",
      "frontline", "casualties", "weapons", "ammunition", "nato", "defense",
      "ukraine", "russia", "gaza", "israel", "hamas", "hezbollah", "iran",
      "syrian", "afghanistan", "iraq", "terrorist", "terrorism", "militia"
    ],
  },
  {
    topic: "US Politics",
    keywords: [
      "trump", "biden", "white house", "congress", "senate", "republican",
      "democrat", "gop", "election", "vote", "ballot", "campaign", "primary",
      "presidential", "impeachment", "capitol", "washington dc", "supreme court",
      "scotus", "governor", "mayor", "legislation", "bill passed", "veto",
      "executive order", "fbi", "cia", "doj", "attorney general", "cabinet",
      "secretary of state", "pentagon", "state department", "us politics",
      "american politics", "midterm", "swing state", "electoral"
    ],
  },
  {
    topic: "Europe Politics",
    keywords: [
      "eu", "european union", "brussels", "parliament", "macron", "france",
      "germany", "merkel", "scholz", "brexit", "uk politics", "starmer",
      "labour", "tories", "conservative party", "liberal democrat",
      "italy", "spain", "poland", "hungary", "nordic", "scandinavia",
      "european commission", "nato europe", "eurozone", "euro currency",
      "migration europe", "refugees europe"
    ],
  },
  {
    topic: "AI & Technology",
    keywords: [
      "artificial intelligence", "ai", "machine learning", "deep learning",
      "neural network", "chatgpt", "openai", "google ai", "microsoft ai",
      "anthropic", "llm", "large language model", "generative ai", "gpt",
      "robot", "automation", "algorithm", "tech company", "silicon valley",
      "startup", "innovation", "software", "hardware", "processor", "chip",
      "semiconductor", "quantum", "cloud computing", "data center",
      "cybersecurity", "hacking", "privacy", "encryption", "blockchain",
      "smartphone", "app", "platform", "social media", "meta", "twitter",
      "x corp", "tiktok", "apple", "google", "microsoft", "amazon tech",
      "tesla", "ev", "electric vehicle", "autonomous", "self-driving"
    ],
  },
  {
    topic: "Finance & Markets",
    keywords: [
      "stock", "market", "wall street", "nasdaq", "dow jones", "s&p 500",
      "investor", "investment", "trading", "shares", "equity", "bonds",
      "treasury", "federal reserve", "interest rate", "inflation", "recession",
      "gdp", "economy", "economic", "bank", "banking", "finance", "financial",
      "cryptocurrency", "bitcoin", "ethereum", "crypto", "blockchain",
      "ipo", "merger", "acquisition", "earnings", "profit", "revenue",
      "quarter results", "fiscal", "budget", "debt", "loan", "mortgage",
      "real estate market", "housing market", "commodities", "oil price",
      "gold price", "forex", "currency"
    ],
  },
  {
    topic: "Crime & Justice",
    keywords: [
      "crime", "criminal", "murder", "homicide", "shooting", "stabbing",
      "robbery", "theft", "burglary", "assault", "arrest", "police",
      "investigation", "detective", "suspect", "victim", "prison", "jail",
      "sentence", "convicted", "trial", "court", "judge", "jury", "verdict",
      "lawsuit", "legal", "attorney", "lawyer", "prosecutor", "defense",
      "fraud", "scam", "corruption", "bribery", "drug trafficking",
      "cartel", "gang", "organized crime", "justice", "parole", "probation"
    ],
  },
  {
    topic: "Science & Health",
    keywords: [
      "science", "scientific", "research", "study", "discovery", "experiment",
      "laboratory", "scientist", "physics", "chemistry", "biology", "genetics",
      "dna", "gene", "evolution", "species", "fossil", "dinosaur", "space",
      "nasa", "astronomy", "planet", "star", "galaxy", "universe", "rocket",
      "satellite", "mars", "moon", "asteroid", "health", "medical", "medicine",
      "doctor", "hospital", "patient", "disease", "illness", "treatment",
      "vaccine", "vaccination", "covid", "pandemic", "virus", "bacteria",
      "cancer", "heart disease", "mental health", "depression", "anxiety",
      "therapy", "surgery", "clinical trial", "fda", "drug approval", "pharma"
    ],
  },
  {
    topic: "Sports",
    // Requires at least 2 keyword matches before Sports is a candidate.
    // This prevents a single passing mention of a sport name from overriding
    // a clearly non-sports article. Source profile bonuses (+10) bypass this
    // for known sports sources (ESPN, BBC Sport, Sky Sports, etc.).
    minMatches: 2,
    keywords: [
      // Sport names (unambiguous)
      "football", "soccer", "basketball", "baseball",
      "tennis", "golf", "cricket", "rugby", "hockey", "formula 1", "f1",
      "nascar", "motorsport", "marathon", "sprint",
      "swimming", "diving", "gymnastics", "boxing", "mma", "ufc", "wrestling",
      // Competitions & organisations (unambiguous)
      "olympics", "olympic", "world cup", "premier league", "la liga",
      "bundesliga", "serie a", "nfl", "nba", "mlb", "nhl", "pga", "wta",
      "atp", "fifa", "uefa", "wimbledon", "super bowl", "champions league",
      "europa league", "copa america", "euro 2024", "euro 2025",
      // Venues & roles
      "stadium", "matchday", "halftime", "full-time", "kick-off",
      "doping", "hat-trick", "offside", "penalty kick", "free kick",
      "slam dunk", "touchdown", "home run", "par", "birdie", "bogey",
      // Sports-specific terms
      "sport", "sports",
      // Athlete competitions
      "triathlon", "decathlon", "velodrome", "rowing", "sailing", "surfing",
      "skateboarding", "snowboarding", "skiing", "biathlon", "judo",
      "taekwondo", "fencing", "archery", "weightlifting", "shot put",
      "discus throw", "high jump", "pole vault", "steeplechase"
    ],
  },
  {
    topic: "Celebrity & Entertainment",
    keywords: [
      // Celebrity gossip
      "celebrity", "famous", "star", "hollywood", "actor", "actress",
      "singer", "musician", "band", "concert", "tour", "album", "song",
      "gossip", "scandal", "breakup", "dating", "romance", "engaged",
      "wedding", "divorce", "relationship", "split", "couple", "cheating",
      "paparazzi", "tabloid", "exclusive", "spotted", "rumor", "affair",
      // Movies & TV
      "movie", "film", "director", "oscar", "grammy", "emmy", "award",
      "red carpet", "premiere", "box office", "streaming", "netflix",
      "disney", "hbo", "hulu", "amazon prime", "tv show", "series",
      "reality tv", "binge", "season finale", "trailer", "casting",
      "blockbuster", "sequel", "franchise", "superhero", "marvel", "dc",
      "animation", "pixar", "dreamworks", "studio", "screenplay",
      // Music
      "billboard chart", "hit single", "number one", "platinum",
      "record deal", "music video", "lyrics", "rapper", "pop star",
      "rock band", "country music", "hip hop", "r&b", "edm", "festival",
      "coachella", "glastonbury", "mtv", "vma", "bts", "taylor swift",
      "beyonce", "drake", "kanye", "rihanna", "ariana grande",
      // Pop culture & influencers
      "influencer", "social media star", "youtuber",
      "tiktoker", "viral video", "trending online",
      "fashion week", "model", "vogue", "runway", "designer", "met gala",
      // Royalty
      "royalty", "princess", "royal family", "palace", "windsor", "buckingham",
      // Entertainment sources (keep as multi-word to avoid single-word false positives)
      "tmz", "entertainment tonight", "people magazine",
      "page six", "variety magazine", "hollywood reporter", "just jared"
    ],
  },
  {
    topic: "Environment / Climate",
    keywords: [
      "climate", "climate change", "global warming", "carbon", "emissions",
      "greenhouse", "co2", "renewable", "solar", "wind energy", "clean energy",
      "fossil fuel", "oil spill", "coal", "natural gas", "pollution", "air quality",
      "water quality", "deforestation", "forest", "amazon rainforest", "wildlife",
      "endangered", "species", "conservation", "biodiversity", "ecosystem",
      "ocean", "marine", "coral reef", "plastic", "recycling", "waste",
      "sustainability", "sustainable", "eco-friendly", "esg",
      "weather", "storm", "hurricane", "tornado", "flood", "drought",
      "wildfire", "earthquake", "volcano", "disaster", "emergency",
      // Heat & temperature keywords (covers Mongabay-style articles)
      "warmer", "warming", "heat wave", "heatwave", "temperature rising",
      "temperature increase", "temperatures", "degrees celsius", "degrees fahrenheit",
      "nights warmer", "summer heat", "extreme heat", "heat stress",
      "monsoon", "rainfall", "precipitation", "water scarcity",
      "deforestation", "reforestation", "afforestation", "carbon offset",
      "net zero", "carbon neutral", "paris agreement", "ipcc",
      "habitat loss", "invasive species", "migratory", "poaching",
      "protected area", "national park", "nature reserve",
      "methane", "nitrous oxide", "ozone", "acid rain", "smog",
      "water table", "groundwater", "aquifer", "desertification",
      "permafrost", "ice cap", "glacier", "sea level", "arctic", "antarctic"
    ],
  },
  {
    topic: "Other / Offbeat",
    keywords: [
      "weird", "strange", "unusual", "bizarre", "quirky", "viral",
      "internet culture", "lifestyle", "travel",
      "food", "recipe", "restaurant", "dining", "culture", "art",
      "museum", "exhibition", "book", "novel", "author", "literature",
      "history", "historical", "archaeology", "ancient", "hobby",
      "gaming", "video game", "esports", "puzzle", "mystery"
    ],
  },
];

// Topics that are "strong signals" — used in the normalise / override check.
// IMPORTANT: only include terms that are highly specific and would almost
// never appear in a genuine sports article. Removed: "campaign", "vote",
// "ballot", "governor" (common in sports), "market", "economy", "budget"
// (too generic), "research", "study", "discovery" (appear everywhere).
const OVERRIDE_TOPIC_SIGNALS: Record<string, string[]> = {
  "Environment / Climate": [
    "climate", "climate change", "global warming", "conservation", "wildfire",
    "emissions", "co2", "carbon", "warming", "warmer", "temperature",
    "biodiversity", "ecosystem", "wildlife", "deforestation", "ocean", "flood",
    "drought", "heatwave", "heat wave", "pollution", "renewable energy",
    "sustainability", "glacier", "sea level", "arctic", "habitat loss",
    "endangered species", "ecological", "greenhouse gas", "net zero"
  ],
  "Science & Health": [
    "science confirms", "scientific study", "experiment", "laboratory",
    "scientist", "biology", "genetics", "dna", "physics", "chemistry",
    "vaccine", "virus", "bacteria", "pandemic", "clinical trial",
    "medical treatment", "hospital patient", "disease outbreak"
  ],
  "US Politics": [
    // Only highly specific political terms that never appear in sports.
    "congress", "senate", "white house", "republican party", "democratic party",
    "supreme court", "impeachment", "trump", "biden", "electoral college",
    "filibuster", "gop primary", "midterm election", "executive order"
  ],
  "Finance & Markets": [
    // Only specific financial terms that don't appear in sports reporting.
    "stock market", "wall street", "nasdaq", "interest rate", "recession",
    "federal reserve", "gdp growth", "earnings report", "fiscal policy",
    "cryptocurrency market", "trade deficit", "central bank rate"
  ],
};

/**
 * Look up source profile bonus for a given source name.
 * Returns the topic and a bonus score of +10 if a profile matches, else null.
 */
function getSourceProfileBonus(sourceName: string): { topic: Topic; bonus: number } | null {
  const lower = sourceName.toLowerCase();
  for (const profile of SOURCE_TOPIC_PROFILES) {
    if (lower.includes(profile.fragment)) {
      return { topic: profile.topic, bonus: 10 };
    }
  }
  return null;
}

/**
 * Count how many keywords from a signal list appear in text.
 */
function countSignalMatches(text: string, signals: string[]): number {
  return signals.filter(kw => text.includes(kw.toLowerCase())).length;
}

/**
 * Tag an article's topics based on keyword scoring + source profile.
 *
 * @param title       Article title
 * @param summary     Article summary / description
 * @param sourceName  Source name (used for source-profile bonuses)
 * @returns           Array of 1–2 topic strings
 */
export function tagArticleTopics(
  title: string,
  summary?: string | null,
  sourceName?: string | null
): string[] {
  const text = `${title} ${summary || ""}`.toLowerCase();

  // Count keyword matches for each topic
  const topicScores: Map<string, number> = new Map();

  for (const { topic, keywords, minMatches = 1 } of TOPIC_KEYWORDS) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          matchCount++;
        }
      } else if (text.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    // Apply per-topic minimum match threshold
    if (matchCount >= minMatches) {
      topicScores.set(topic, matchCount);
    }
  }

  // Apply source profile bonus (overrides weak keyword matches)
  if (sourceName) {
    const profileMatch = getSourceProfileBonus(sourceName);
    if (profileMatch) {
      const current = topicScores.get(profileMatch.topic) ?? 0;
      topicScores.set(profileMatch.topic, current + profileMatch.bonus);
    }
  }

  // If no topics matched, return Other / Offbeat
  if (topicScores.size === 0) {
    return ["Other / Offbeat"];
  }

  // Sort by score descending
  const sortedTopics = Array.from(topicScores.entries()).sort((a, b) => b[1] - a[1]);
  const topScore = sortedTopics[0][1];

  // Only include topics that have at least 50% of the top score's matches
  const threshold = Math.max(topScore * 0.5, 1);
  const bestTopics = sortedTopics
    .filter(([_, score]) => score >= threshold)
    .slice(0, 2)
    .map(([topic]) => topic as Topic);

  // Run the normalisation / correction pass
  const corrected = normalizeArticleCategory(bestTopics, text, sourceName, title);
  return corrected;
}

/**
 * Post-scoring correction layer.
 *
 * If the winning topic is "Sports" but the article text contains strong signals
 * for another topic (≥2 matches from the strict OVERRIDE_TOPIC_SIGNALS list),
 * override to that topic — BUT only when the article has fewer than 2 genuine
 * sports keywords. If an article legitimately earned Sports via ≥2 real sports
 * keywords (e.g. "FIFA" + "World Cup"), we trust that and never override.
 */
export function normalizeArticleCategory(
  topics: Topic[],
  text: string,
  sourceName?: string | null,
  title?: string
): Topic[] {
  const winningTopic = topics[0];
  if (!winningTopic) return ["Other / Offbeat"] as Topic[];

  // Only intervene if the apparent winner is Sports
  if (winningTopic !== "Sports") return topics;

  // Check source profile — if source is clearly sports-dedicated, keep Sports
  if (sourceName) {
    const profile = getSourceProfileBonus(sourceName);
    if (profile && profile.topic === "Sports") {
      return topics;
    }
  }

  // Count raw Sports keyword matches (ignoring source bonus).
  // If the article has ≥2 genuine sports keywords it legitimately belongs
  // in Sports — don't override, regardless of competing signals.
  const sportsEntry = TOPIC_KEYWORDS.find(t => t.topic === "Sports");
  if (sportsEntry) {
    const rawSportsCount = sportsEntry.keywords.filter(kw => {
      if (kw.length <= 3) {
        return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
      }
      return text.includes(kw.toLowerCase());
    }).length;
    if (rawSportsCount >= 2) {
      return topics;
    }
  }

  // Check for strong signals in other high-priority topics
  const candidateTopics: Array<{ topic: Topic; matches: number }> = [];
  for (const [candidateTopic, signals] of Object.entries(OVERRIDE_TOPIC_SIGNALS)) {
    const matchCount = countSignalMatches(text, signals);
    if (matchCount >= 2) {
      candidateTopics.push({ topic: candidateTopic as Topic, matches: matchCount });
    }
  }

  if (candidateTopics.length === 0) return topics;

  // Pick the override topic with the most matches
  candidateTopics.sort((a, b) => b.matches - a.matches);
  const override = candidateTopics[0];

  const debugTitle = title || text.slice(0, 80);
  console.log(
    `[Category Correction] "${debugTitle}"\n` +
    `  Original:  Sports\n` +
    `  Corrected: ${override.topic}\n` +
    `  Source:    ${sourceName || "unknown"}\n` +
    `  Reason:    ${override.matches} strong ${override.topic} signals, <2 genuine sports keywords`
  );

  // Build corrected list: insert override topic first, keep any non-Sports from original
  const kept = topics.filter(t => t !== "Sports");
  const result = [override.topic, ...kept.filter(t => t !== override.topic)].slice(0, 2) as Topic[];
  return result;
}

import { computeArticlePolarisation, PolarisationResult } from "./polarisationScorer";

export function generatePolarisationScore(
  title: string,
  summary?: string | null,
  topics?: string[]
): PolarisationResult {
  return computeArticlePolarisation(title, summary, topics || []);
}

export function mapCountryToRegion(country?: string | null): string {
  if (!country) return "Global";

  const countryLower = country.toLowerCase();

  const regionMap: Record<string, string> = {
    "us": "US",
    "usa": "US",
    "united states": "US",
    "america": "US",
    "uk": "UK",
    "united kingdom": "UK",
    "britain": "UK",
    "england": "UK",
    "france": "Europe",
    "germany": "Europe",
    "italy": "Europe",
    "spain": "Europe",
    "netherlands": "Europe",
    "belgium": "Europe",
    "poland": "Europe",
    "sweden": "Europe",
    "norway": "Europe",
    "denmark": "Europe",
    "finland": "Europe",
    "austria": "Europe",
    "switzerland": "Europe",
    "portugal": "Europe",
    "greece": "Europe",
    "ireland": "Europe",
    "russia": "Russia",
    "china": "China",
    "japan": "Japan",
    "south korea": "Asia-Pacific",
    "korea": "Asia-Pacific",
    "india": "India",
    "australia": "Australia",
    "new zealand": "Asia-Pacific",
    "singapore": "Asia-Pacific",
    "indonesia": "Asia-Pacific",
    "thailand": "Asia-Pacific",
    "vietnam": "Asia-Pacific",
    "philippines": "Asia-Pacific",
    "malaysia": "Asia-Pacific",
    "taiwan": "Asia-Pacific",
    "israel": "Middle East",
    "saudi arabia": "Middle East",
    "uae": "Middle East",
    "qatar": "Middle East",
    "iran": "Middle East",
    "iraq": "Middle East",
    "syria": "Middle East",
    "turkey": "Middle East",
    "egypt": "Middle East",
    "lebanon": "Middle East",
    "jordan": "Middle East",
    "south africa": "South Africa",
    "nigeria": "Africa",
    "kenya": "Africa",
    "ethiopia": "Africa",
    "morocco": "Africa",
    "algeria": "Africa",
    "ghana": "Africa",
    "brazil": "Brazil",
    "canada": "Canada",
  };

  for (const [key, region] of Object.entries(regionMap)) {
    if (countryLower.includes(key)) {
      return region;
    }
  }

  return "Global";
}
