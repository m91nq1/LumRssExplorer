import { Topic, TOPICS } from "@shared/schema";

interface TopicKeywords {
  topic: Topic;
  keywords: string[];
}

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
      "billboard", "chart", "hit single", "number one", "platinum",
      "record deal", "music video", "lyrics", "rapper", "pop star",
      "rock band", "country music", "hip hop", "r&b", "edm", "festival",
      "coachella", "glastonbury", "mtv", "vma", "bts", "taylor swift",
      "beyonce", "drake", "kanye", "rihanna", "ariana grande",
      // Pop culture & influencers
      "influencer", "social media star", "youtube", "youtuber", 
      "tiktok star", "tiktoker", "instagram", "viral", "trending",
      "fashion", "model", "vogue", "runway", "designer", "met gala",
      // Sports celebrities
      "sports star", "athlete", "football", "basketball", "soccer",
      "tennis", "golf", "olympics", "world cup", "championship",
      "nba", "nfl", "mlb", "fifa", "wimbledon", "super bowl",
      // Royalty
      "royalty", "prince", "princess", "queen", "king", "meghan",
      "harry", "royal family", "palace", "windsor", "buckingham",
      // Entertainment sources
      "tmz", "e! news", "entertainment tonight", "people magazine",
      "page six", "variety", "hollywood reporter", "just jared"
    ],
  },
  {
    topic: "Environment / Climate",
    keywords: [
      "climate", "climate change", "global warming", "carbon", "emissions",
      "greenhouse", "co2", "renewable", "solar", "wind energy", "clean energy",
      "fossil fuel", "oil", "coal", "natural gas", "pollution", "air quality",
      "water quality", "deforestation", "forest", "amazon", "wildlife",
      "endangered", "species", "conservation", "biodiversity", "ecosystem",
      "ocean", "marine", "coral reef", "plastic", "recycling", "waste",
      "sustainability", "sustainable", "green", "eco-friendly", "esg",
      "weather", "storm", "hurricane", "tornado", "flood", "drought",
      "wildfire", "earthquake", "volcano", "disaster", "emergency"
    ],
  },
  {
    topic: "Other / Offbeat",
    keywords: [
      "weird", "strange", "unusual", "bizarre", "quirky", "fun", "viral",
      "trending", "meme", "internet culture", "lifestyle", "travel",
      "food", "recipe", "restaurant", "dining", "culture", "art",
      "museum", "exhibition", "book", "novel", "author", "literature",
      "history", "historical", "archaeology", "ancient", "hobby",
      "gaming", "video game", "esports", "puzzle", "mystery"
    ],
  },
];

export function tagArticleTopics(title: string, summary?: string | null): string[] {
  const text = `${title} ${summary || ""}`.toLowerCase();
  
  // Count keyword matches for each topic
  const topicScores: Map<string, number> = new Map();
  
  for (const { topic, keywords } of TOPIC_KEYWORDS) {
    let matchCount = 0;
    for (const keyword of keywords) {
      // Use word boundary matching for short keywords to avoid false positives
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          matchCount++;
        }
      } else if (text.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      topicScores.set(topic, matchCount);
    }
  }

  // If no topics matched, return Other / Offbeat
  if (topicScores.size === 0) {
    return ["Other / Offbeat"];
  }

  // Sort by score and take only the top topic(s)
  const sortedTopics = Array.from(topicScores.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const topScore = sortedTopics[0][1];
  
  // Only include topics that have at least 50% of the top score's matches
  // This ensures we only get the most relevant topics
  const threshold = Math.max(topScore * 0.5, 1);
  
  const bestTopics = sortedTopics
    .filter(([_, score]) => score >= threshold)
    .slice(0, 2) // Maximum 2 topics per article
    .map(([topic]) => topic);

  return bestTopics;
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
    "japan": "Asia-Pacific",
    "south korea": "Asia-Pacific",
    "korea": "Asia-Pacific",
    "india": "Asia-Pacific",
    "australia": "Asia-Pacific",
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
    "south africa": "Africa",
    "nigeria": "Africa",
    "kenya": "Africa",
    "ethiopia": "Africa",
    "morocco": "Africa",
    "algeria": "Africa",
    "ghana": "Africa",
  };

  for (const [key, region] of Object.entries(regionMap)) {
    if (countryLower.includes(key)) {
      return region;
    }
  }

  return "Global";
}
