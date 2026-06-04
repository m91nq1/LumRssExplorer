import type { StorySummary } from './emailService';

const topicKeywords: Record<string, string[]> = {
  'War / Conflict': ['war', 'military', 'conflict', 'battle', 'troops', 'invasion', 'combat', 'defense'],
  'US Politics': ['congress', 'senate', 'republican', 'democrat', 'white house', 'biden', 'trump', 'election'],
  'Europe Politics': ['EU', 'european union', 'brussels', 'parliament', 'brexit', 'macron', 'scholz'],
  'AI & Technology': ['AI', 'artificial intelligence', 'machine learning', 'tech', 'startup', 'software', 'innovation'],
  'Finance & Markets': ['stock', 'market', 'economy', 'finance', 'trading', 'investment', 'banking', 'inflation'],
  'Crime & Justice': ['crime', 'court', 'police', 'trial', 'arrest', 'verdict', 'prison', 'lawsuit'],
  'Science & Health': ['science', 'health', 'medical', 'research', 'study', 'vaccine', 'disease', 'discovery'],
  'Sports': ['sports', 'football', 'soccer', 'basketball', 'tennis', 'match', 'team', 'player', 'goal', 'championship', 'tournament', 'olympics'],
  'Celebrity & Entertainment': ['celebrity', 'movie', 'music', 'entertainment', 'actor', 'singer', 'hollywood'],
  'Environment / Climate': ['climate', 'environment', 'carbon', 'emissions', 'renewable', 'pollution', 'sustainability'],
  'Other / Offbeat': ['unusual', 'weird', 'quirky', 'odd', 'strange', 'bizarre'],
};

const regionToCountryCodes: Record<string, string[]> = {
  'US': ['us'],
  'UK': ['gb'],
  'Europe': ['de', 'fr', 'it', 'es', 'nl', 'be', 'at', 'ch', 'pl', 'se'],
  'Russia': ['ru'],
  'China': ['cn'],
  'Africa': ['za', 'ng', 'eg', 'ke'],
  'Middle East': ['ae', 'sa', 'il', 'tr'],
  'Asia-Pacific': ['au', 'jp', 'kr', 'in', 'sg'],
  'Global': [],
};

function buildQueryFromTopics(topics: string[]): string {
  const keywords: string[] = [];
  for (const topic of topics) {
    const topicKw = topicKeywords[topic];
    if (topicKw) {
      keywords.push(...topicKw.slice(0, 3));
    }
  }
  return keywords.slice(0, 10).join(' OR ');
}

function getCountryCodesFromRegions(regions?: string[]): string[] {
  if (!regions || regions.length === 0) return [];
  const codes: string[] = [];
  for (const region of regions) {
    const regionCodes = regionToCountryCodes[region];
    if (regionCodes) {
      codes.push(...regionCodes);
    }
  }
  return Array.from(new Set(codes));
}

export async function fetchTopicStoriesFromNewsAPI(
  topics: string[],
  regions?: string[]
): Promise<StorySummary[]> {
  const apiKey = process.env.NEWSAPI_ORG_KEY;
  if (!apiKey) {
    console.warn('[NewsProvider] NEWSAPI_ORG_KEY not configured - skipping NewsAPI.org');
    return [];
  }

  try {
    const query = buildQueryFromTopics(topics);
    if (!query) return [];

    const countries = getCountryCodesFromRegions(regions);
    const countryParam = countries.length > 0 ? `&country=${countries[0]}` : '';

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=15&sortBy=publishedAt&apiKey=${apiKey}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LUM News/1.0' },
    });

    if (!response.ok) {
      console.error(`[NewsProvider] NewsAPI.org error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      articles?: Array<{
        title?: string;
        source?: { name?: string };
        url?: string;
        description?: string;
        publishedAt?: string;
      }>;
    };

    if (!data.articles) return [];

    return data.articles.map(article => ({
      title: article.title || 'Untitled',
      source: article.source?.name || 'NewsAPI',
      url: article.url || '',
      summary: article.description || undefined,
      publishedAt: article.publishedAt || undefined,
    })).filter(a => a.url);
  } catch (error) {
    console.error('[NewsProvider] NewsAPI.org fetch error:', error);
    return [];
  }
}

export async function fetchTopicStoriesFromNewsdata(
  topics: string[],
  regions?: string[]
): Promise<StorySummary[]> {
  const apiKey = process.env.NEWSDATA_IO_KEY;
  if (!apiKey) {
    console.warn('[NewsProvider] NEWSDATA_IO_KEY not configured - skipping Newsdata.io');
    return [];
  }

  try {
    const query = buildQueryFromTopics(topics);
    if (!query) return [];

    const countries = getCountryCodesFromRegions(regions);
    const countryParam = countries.length > 0 ? `&country=${countries.slice(0, 5).join(',')}` : '';

    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}${countryParam}&language=en`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[NewsProvider] Newsdata.io error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      results?: Array<{
        title?: string;
        source_id?: string;
        link?: string;
        description?: string;
        pubDate?: string;
        country?: string[];
      }>;
    };

    if (!data.results) return [];

    return data.results.map(article => ({
      title: article.title || 'Untitled',
      source: article.source_id || 'Newsdata',
      region: article.country?.[0]?.toUpperCase(),
      url: article.link || '',
      summary: article.description || undefined,
      publishedAt: article.pubDate || undefined,
    })).filter(a => a.url);
  } catch (error) {
    console.error('[NewsProvider] Newsdata.io fetch error:', error);
    return [];
  }
}

export async function fetchTopicStoriesFromMediastack(
  topics: string[],
  regions?: string[]
): Promise<StorySummary[]> {
  const apiKey = process.env.MEDIASTACK_KEY;
  if (!apiKey) {
    console.warn('[NewsProvider] MEDIASTACK_KEY not configured - skipping Mediastack');
    return [];
  }

  try {
    const query = buildQueryFromTopics(topics);
    if (!query) return [];

    const countries = getCountryCodesFromRegions(regions);
    const countryParam = countries.length > 0 ? `&countries=${countries.slice(0, 5).join(',')}` : '';

    const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&keywords=${encodeURIComponent(query)}${countryParam}&languages=en&limit=15`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[NewsProvider] Mediastack error: ${response.status}`);
      return [];
    }

    const data = await response.json() as {
      data?: Array<{
        title?: string;
        source?: string;
        url?: string;
        description?: string;
        published_at?: string;
        country?: string;
      }>;
    };

    if (!data.data) return [];

    return data.data.map(article => ({
      title: article.title || 'Untitled',
      source: article.source || 'Mediastack',
      region: article.country?.toUpperCase(),
      url: article.url || '',
      summary: article.description || undefined,
      publishedAt: article.published_at || undefined,
    })).filter(a => a.url);
  } catch (error) {
    console.error('[NewsProvider] Mediastack fetch error:', error);
    return [];
  }
}

export async function fetchPersonalisedStories(
  topics: string[],
  regions?: string[]
): Promise<StorySummary[]> {
  if (!topics || topics.length === 0) return [];

  const [newsApiStories, newsdataStories, mediastackStories] = await Promise.all([
    fetchTopicStoriesFromNewsAPI(topics, regions),
    fetchTopicStoriesFromNewsdata(topics, regions),
    fetchTopicStoriesFromMediastack(topics, regions),
  ]);

  const allStories = [...newsApiStories, ...newsdataStories, ...mediastackStories];

  const seen = new Set<string>();
  const deduped = allStories.filter(story => {
    const key = story.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const sorted = deduped.sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return sorted.slice(0, 20);
}
