import { Topic, type PolarisationReasonType } from "@shared/schema";

export interface PolarisationReason {
  type: "topic" | "controversy" | "sensationalism" | "entity" | "framing" | "sentiment" | "diversity";
  label: string;
  points: number;
}

export interface PolarisationResult {
  score: number;
  reasons: PolarisationReason[];
}

export interface TopicWithConfidence {
  name: string;
  confidence: number;
  polarisationWeight: number;
}

const TOPIC_POLARISATION_WEIGHTS: Record<string, number> = {
  "War / Conflict": 0.95,
  "US Politics": 0.90,
  "Europe Politics": 0.80,
  "Crime & Justice": 0.70,
  "Finance & Markets": 0.55,
  "AI & Technology": 0.50,
  "Environment / Climate": 0.60,
  "Science & Health": 0.40,
  "Celebrity & Entertainment": 0.35,
  "Other / Offbeat": 0.15,
};

const EXTENDED_TOPIC_WEIGHTS: Record<string, number> = {
  "elections": 0.95,
  "voting integrity": 0.95,
  "election fraud": 1.0,
  "immigration": 0.90,
  "border policy": 0.90,
  "refugees": 0.85,
  "race relations": 0.90,
  "racism": 0.95,
  "identity politics": 0.90,
  "gender policy": 0.85,
  "lgbtq": 0.85,
  "abortion": 0.95,
  "reproductive rights": 0.90,
  "religion": 0.75,
  "blasphemy": 0.85,
  "free speech": 0.85,
  "censorship": 0.85,
  "protest": 0.80,
  "police violence": 0.90,
  "police brutality": 0.95,
  "genocide": 1.0,
  "terrorism": 0.95,
  "terrorist": 0.95,
  "war crime": 1.0,
  "sanctions": 0.80,
  "espionage": 0.80,
  "climate policy": 0.75,
  "gun control": 0.90,
  "gun rights": 0.90,
  "second amendment": 0.85,
  "impeachment": 0.90,
  "coup": 0.95,
  "insurrection": 0.95,
  "civil war": 0.95,
};

const CONTROVERSY_LEXICON = {
  veryStrong: {
    weight: 3,
    terms: [
      "genocide", "terrorist", "terrorism", "war crime", "war crimes", "coup", "assassination",
      "treason", "ethnic cleansing", "propaganda", "fraud", "mass murder", "atrocity",
      "atrocities", "massacre", "slaughter", "torture", "dictatorship", "tyranny",
      "insurrection", "rebellion", "uprising", "overthrow", "purge", "persecution",
      "apartheid", "fascist", "fascism", "nazi", "extremist", "radical", "militant"
    ]
  },
  strong: {
    weight: 2,
    terms: [
      "outrage", "outraged", "backlash", "scandal", "accused", "accuses", "corruption",
      "corrupt", "racist", "racism", "hate", "hatred", "banned", "bans", "slams",
      "slammed", "resigns", "resignation", "impeachment", "impeach", "impeached",
      "boycott", "boycotts", "sanctions", "sanctioned", "crackdown", "crackdowns",
      "protests", "riot", "riots", "violence", "violent", "attack", "attacked",
      "assault", "assaulted", "threatens", "threatened", "threatens", "demands",
      "demanded", "condemns", "condemned", "denounces", "denounced", "illegally",
      "illegal", "unlawful", "violates", "violation", "cover-up", "coverup",
      "conspiracy", "collusion", "obstruction", "abuse", "abuses", "exploitation",
      "exploits", "oppression", "oppressed", "discrimination", "discriminatory",
      "bigotry", "bigot", "xenophobia", "xenophobic", "homophobia", "homophobic",
      "misogyny", "sexism", "supremacist", "supremacy", "sedition", "traitor"
    ]
  },
  moderate: {
    weight: 1,
    terms: [
      "controversial", "controversy", "critics", "criticism", "criticizes", "criticized",
      "sparks debate", "heated", "divides", "divided", "polarizing", "polarised",
      "polarized", "clash", "clashes", "dispute", "disputed", "disputes", "pushback",
      "opposition", "opposed", "opposes", "defends", "defies", "rejects", "rejected",
      "denies", "denial", "refuses", "refused", "warns", "warning", "threatens",
      "tension", "tensions", "conflict", "conflicts", "crisis", "emergency",
      "alarming", "disturbing", "shocking", "outrageous", "disgrace", "disgraceful",
      "unacceptable", "intolerable", "deplorable", "despicable", "appalling",
      "uproar", "fury", "furor", "angry", "anger", "enraged", "infuriated",
      "incensed", "livid", "seething", "resentment", "hostility", "hostile",
      "adversarial", "contentious", "divisive", "inflammatory", "provocative",
      "inciting", "agitating", "confrontation", "showdown", "standoff", "deadlock",
      "stalemate", "impasse", "gridlock", "chaos", "turmoil", "upheaval"
    ]
  }
};

const SENSATIONALISM_PATTERNS = {
  allCaps: /\b[A-Z]{4,}\b/g,
  exclamations: /!/g,
  clickbait: [
    "you won't believe", "shocking", "unbelievable", "incredible", "mind-blowing",
    "jaw-dropping", "explosive", "bombshell", "breaking", "urgent", "alert",
    "exclusive", "revealed", "exposed", "leaked", "secret", "hidden", "uncovered",
    "must see", "must read", "can't miss", "finally", "at last"
  ]
};

const POLITICAL_ENTITIES = [
  "congress", "senate", "parliament", "government", "administration",
  "white house", "kremlin", "downing street", "elysee", "bundestag",
  "supreme court", "scotus", "un", "united nations", "nato", "eu",
  "european union", "fbi", "cia", "nsa", "doj", "pentagon", "state department",
  "ministry", "ambassador", "diplomat", "president", "prime minister",
  "chancellor", "secretary", "senator", "congressman", "congresswoman",
  "representative", "governor", "mayor", "legislator", "lawmaker",
  "republican", "democrat", "gop", "labour", "conservative", "liberal",
  "socialist", "communist", "authoritarian", "populist"
];


function countTermMatches(text: string, terms: string[]): { count: number; matched: string[] } {
  const lowerText = text.toLowerCase();
  let count = 0;
  const matched: string[] = [];
  
  for (const term of terms) {
    const lowerTerm = term.toLowerCase();
    if (lowerTerm.length <= 3) {
      const regex = new RegExp(`\\b${lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
        if (!matched.includes(term)) matched.push(term);
      }
    } else if (lowerText.includes(lowerTerm)) {
      const regex = new RegExp(lowerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      count += matches ? matches.length : 1;
      if (!matched.includes(term)) matched.push(term);
    }
  }
  
  return { count, matched };
}

function computeTopicScore(topics: string[]): { score: number; reasons: PolarisationReason[] } {
  const reasons: PolarisationReason[] = [];
  let maxWeight = 0;
  let primaryTopic = "";
  
  for (const topic of topics) {
    const weight = TOPIC_POLARISATION_WEIGHTS[topic] || 0.15;
    if (weight > maxWeight) {
      maxWeight = weight;
      primaryTopic = topic;
    }
  }
  
  const topicScore = Math.round(maxWeight * 30);
  
  if (topicScore > 0 && primaryTopic) {
    reasons.push({
      type: "topic",
      label: `Topic: ${primaryTopic}`,
      points: topicScore
    });
  }
  
  return { score: topicScore, reasons };
}

function computeExtendedTopicBoost(text: string): { score: number; reasons: PolarisationReason[] } {
  const lowerText = text.toLowerCase();
  const reasons: PolarisationReason[] = [];
  let maxBoost = 0;
  let matchedTopic = "";
  
  for (const [topic, weight] of Object.entries(EXTENDED_TOPIC_WEIGHTS)) {
    if (lowerText.includes(topic.toLowerCase())) {
      const boost = Math.round(weight * 10);
      if (boost > maxBoost) {
        maxBoost = boost;
        matchedTopic = topic;
      }
    }
  }
  
  if (maxBoost > 0) {
    reasons.push({
      type: "topic",
      label: `Polarising subject: ${matchedTopic}`,
      points: maxBoost
    });
  }
  
  return { score: Math.min(maxBoost, 10), reasons };
}

function computeControversyScore(text: string): { score: number; reasons: PolarisationReason[] } {
  const reasons: PolarisationReason[] = [];
  let totalScore = 0;
  const allMatched: string[] = [];
  
  const veryStrong = countTermMatches(text, CONTROVERSY_LEXICON.veryStrong.terms);
  if (veryStrong.count > 0) {
    const points = Math.min(veryStrong.count * CONTROVERSY_LEXICON.veryStrong.weight * 3, 15);
    totalScore += points;
    allMatched.push(...veryStrong.matched);
  }
  
  const strong = countTermMatches(text, CONTROVERSY_LEXICON.strong.terms);
  if (strong.count > 0) {
    const points = Math.min(strong.count * CONTROVERSY_LEXICON.strong.weight * 2, 10);
    totalScore += points;
    allMatched.push(...strong.matched);
  }
  
  const moderate = countTermMatches(text, CONTROVERSY_LEXICON.moderate.terms);
  if (moderate.count > 0) {
    const points = Math.min(moderate.count * CONTROVERSY_LEXICON.moderate.weight, 5);
    totalScore += points;
    allMatched.push(...moderate.matched);
  }
  
  totalScore = Math.min(totalScore, 25);
  
  if (allMatched.length > 0) {
    const topKeywords = allMatched.slice(0, 5).join(", ");
    reasons.push({
      type: "controversy",
      label: `Controversy keywords: ${topKeywords}`,
      points: totalScore
    });
  }
  
  return { score: totalScore, reasons };
}

function computeSensationalismScore(text: string): { score: number; reasons: PolarisationReason[] } {
  const reasons: PolarisationReason[] = [];
  let totalScore = 0;
  
  const capsMatches = text.match(SENSATIONALISM_PATTERNS.allCaps) || [];
  if (capsMatches.length > 0) {
    const capsScore = Math.min(capsMatches.length, 2);
    totalScore += capsScore;
  }
  
  const exclamationMatches = text.match(SENSATIONALISM_PATTERNS.exclamations) || [];
  if (exclamationMatches.length > 0) {
    const exclamScore = Math.min(exclamationMatches.length, 2);
    totalScore += exclamScore;
  }
  
  const clickbait = countTermMatches(text, SENSATIONALISM_PATTERNS.clickbait);
  if (clickbait.count > 0) {
    totalScore += Math.min(clickbait.count, 2);
  }
  
  totalScore = Math.min(totalScore, 5);
  
  if (totalScore > 0) {
    reasons.push({
      type: "sensationalism",
      label: "Sensational language detected",
      points: totalScore
    });
  }
  
  return { score: totalScore, reasons };
}

function computeEntityScore(text: string): { score: number; reasons: PolarisationReason[] } {
  const reasons: PolarisationReason[] = [];
  const { count, matched } = countTermMatches(text, POLITICAL_ENTITIES);
  
  const entityScore = Math.min(Math.floor(count * 1.5), 8);
  
  if (entityScore > 0 && matched.length > 0) {
    reasons.push({
      type: "entity",
      label: `Political entities: ${matched.slice(0, 3).join(", ")}`,
      points: entityScore
    });
  }
  
  return { score: entityScore, reasons };
}

export function computeArticlePolarisation(
  title: string,
  summary: string | null | undefined,
  topics: string[]
): PolarisationResult {
  const text = `${title} ${summary || ""}`;
  const reasons: PolarisationReason[] = [];
  
  const topicResult = computeTopicScore(topics);
  reasons.push(...topicResult.reasons);
  
  const extendedResult = computeExtendedTopicBoost(text);
  reasons.push(...extendedResult.reasons);
  
  const controversyResult = computeControversyScore(text);
  reasons.push(...controversyResult.reasons);
  
  const sensationalismResult = computeSensationalismScore(text);
  reasons.push(...sensationalismResult.reasons);
  
  const entityResult = computeEntityScore(text);
  reasons.push(...entityResult.reasons);
  
  let totalScore = 
    topicResult.score + 
    extendedResult.score +
    controversyResult.score + 
    sensationalismResult.score +
    entityResult.score;
  
  totalScore = Math.min(Math.max(totalScore, 0), 100);
  
  return {
    score: totalScore,
    reasons: reasons.filter(r => r.points > 0).sort((a, b) => b.points - a.points)
  };
}

export function computeFramingDivergence(headlines: string[]): { score: number; divergence: number } {
  if (headlines.length < 2) {
    return { score: 0, divergence: 0 };
  }
  
  const tokenize = (text: string): Set<string> => {
    return new Set(
      text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };
  
  const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
    const intersection = new Set(Array.from(a).filter(x => b.has(x)));
    const union = new Set([...Array.from(a), ...Array.from(b)]);
    return union.size > 0 ? intersection.size / union.size : 0;
  };
  
  const tokenizedHeadlines = headlines.map(tokenize);
  let totalSimilarity = 0;
  let comparisons = 0;
  
  for (let i = 0; i < tokenizedHeadlines.length; i++) {
    for (let j = i + 1; j < tokenizedHeadlines.length; j++) {
      totalSimilarity += jaccardSimilarity(tokenizedHeadlines[i], tokenizedHeadlines[j]);
      comparisons++;
    }
  }
  
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
  const divergence = 1 - avgSimilarity;
  const score = Math.round(divergence * 25);
  
  return { score: Math.min(score, 25), divergence };
}

export function computeSourceDiversityScore(sourceCount: number, regionCount: number = 1): { score: number } {
  const sourceScore = Math.min(Math.round(Math.log2(1 + sourceCount) * 4), 10);
  const regionBonus = Math.min((regionCount - 1) * 2, 5);
  
  return { score: sourceScore + regionBonus };
}

export function computeSimpleSentimentSpread(texts: string[]): { score: number; variance: number } {
  if (texts.length < 2) {
    return { score: 0, variance: 0 };
  }
  
  const positiveTerms = [
    "success", "victory", "triumph", "celebrate", "praised", "applaud",
    "progress", "improve", "benefit", "gain", "positive", "optimistic",
    "hope", "promising", "breakthrough", "achievement", "won", "winning"
  ];
  
  const negativeTerms = [
    "failure", "defeat", "disaster", "catastrophe", "crisis", "condemned",
    "criticized", "blamed", "accused", "scandal", "tragedy", "tragic",
    "negative", "pessimistic", "fear", "threat", "loss", "losing", "failed"
  ];
  
  const sentiments = texts.map(text => {
    const lowerText = text.toLowerCase();
    const posCount = countTermMatches(lowerText, positiveTerms).count;
    const negCount = countTermMatches(lowerText, negativeTerms).count;
    const total = posCount + negCount;
    if (total === 0) return 0;
    return (posCount - negCount) / total;
  });
  
  const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const variance = sentiments.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / sentiments.length;
  
  const score = Math.min(Math.round(Math.sqrt(variance) * 30), 15);
  
  return { score, variance };
}

export interface StoryCluster {
  articles: Array<{
    id: string;
    title: string;
    summary?: string | null;
    sourceId: string;
    sourceRegion?: string;
    polarisationScore: number;
    polarisationReasons: PolarisationReason[];
  }>;
}

export function computeStoryPolarisation(cluster: StoryCluster): PolarisationResult {
  const articles = cluster.articles;
  if (articles.length === 0) {
    return { score: 0, reasons: [] };
  }
  
  const reasons: PolarisationReason[] = [];
  
  const avgArticleScore = Math.round(
    articles.reduce((sum, a) => sum + a.polarisationScore, 0) / articles.length
  );
  
  const normalizedAvg = Math.round(avgArticleScore * 0.6);
  reasons.push({
    type: "topic",
    label: `Average article controversy`,
    points: normalizedAvg
  });
  
  const headlines = articles.map(a => a.title);
  const framingResult = computeFramingDivergence(headlines);
  if (framingResult.score > 0) {
    reasons.push({
      type: "framing",
      label: `Framing divergence across sources`,
      points: framingResult.score
    });
  }
  
  const texts = articles.map(a => `${a.title} ${a.summary || ""}`);
  const sentimentResult = computeSimpleSentimentSpread(texts);
  if (sentimentResult.score > 0) {
    reasons.push({
      type: "sentiment",
      label: `High sentiment variance`,
      points: sentimentResult.score
    });
  }
  
  const uniqueSources = new Set(articles.map(a => a.sourceId));
  const uniqueRegions = new Set(articles.map(a => a.sourceRegion || "Global"));
  const diversityResult = computeSourceDiversityScore(uniqueSources.size, uniqueRegions.size);
  if (diversityResult.score > 0) {
    reasons.push({
      type: "diversity",
      label: `Covered by ${uniqueSources.size} sources across ${uniqueRegions.size} regions`,
      points: diversityResult.score
    });
  }
  
  const totalScore = Math.min(
    normalizedAvg + framingResult.score + sentimentResult.score + diversityResult.score,
    100
  );
  
  return {
    score: totalScore,
    reasons: reasons.filter(r => r.points > 0).sort((a, b) => b.points - a.points)
  };
}

export function formatPolarisationReasons(reasons: PolarisationReason[]): string[] {
  return reasons.map(r => `${r.label} (+${r.points})`);
}
