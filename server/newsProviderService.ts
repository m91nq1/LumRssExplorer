import { db } from "./db";
import { newsProviders, articles, feedSources } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { tagArticleTopics, generatePolarisationScore } from "./topicTagger";

export interface ExternalArticle {
  title: string;
  description?: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  region?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string;
    source: { name: string };
    urlToImage?: string;
  }>;
}

interface NewsdataResponse {
  status: string;
  totalResults: number;
  results: Array<{
    title: string;
    description?: string;
    link: string;
    pubDate: string;
    source_id: string;
    image_url?: string;
    country?: string[];
  }>;
}

interface MediastackResponse {
  pagination: { total: number };
  data: Array<{
    title: string;
    description?: string;
    url: string;
    published_at: string;
    source: string;
    image?: string;
    country?: string;
  }>;
}

// Region to country code mappings for API calls
const regionCountryCodes: Record<string, { newsapi: string[]; newsdata: string[]; mediastack: string[] }> = {
  'US': {
    newsapi: ['us'],
    newsdata: ['us'],
    mediastack: ['us'],
  },
  'UK': {
    newsapi: ['gb'],
    newsdata: ['gb'],
    mediastack: ['gb'],
  },
  'Europe': {
    newsapi: ['de', 'fr'],
    newsdata: ['de', 'fr'],
    mediastack: ['de,fr'],
  },
  'Russia': {
    newsapi: ['ru'],
    newsdata: ['ru'],
    mediastack: ['ru'],
  },
  'China': {
    newsapi: ['cn'],
    newsdata: ['cn'],
    mediastack: ['cn'],
  },
  'Asia-Pacific': {
    newsapi: ['jp', 'au', 'in'],
    newsdata: ['jp', 'au', 'in'],
    mediastack: ['jp,au,in'],
  },
  'Middle East': {
    newsapi: ['ae', 'il', 'eg'],
    newsdata: ['ae', 'il', 'eg'],
    mediastack: ['ae,il,eg'],
  },
  'Africa': {
    newsapi: ['za', 'ng', 'eg'],
    newsdata: ['za', 'ng', 'eg'],
    mediastack: ['za,ng,eg'],
  },
};

class NewsProviderService {
  private initialized = false;
  private featureAvailable = false;

  async initialize() {
    if (this.initialized) return;
    try {
      await this.seedDefaultProviders();
      this.initialized = true;
      this.featureAvailable = true;
      console.log('News providers seeded successfully');
    } catch (error: any) {
      if (error?.message?.includes('relation "news_providers" does not exist')) {
        console.warn('WARNING: news_providers table not found. Run "npm run db:push" to create it. External providers feature disabled.');
      } else {
        console.error('Error initializing news providers:', error);
      }
      this.initialized = true;
      this.featureAvailable = false;
    }
  }

  isAvailable(): boolean {
    return this.featureAvailable;
  }

  private async seedDefaultProviders() {
    const defaultProviders = [
      {
        id: 'newsapi',
        name: 'NewsAPI.org',
        baseUrl: 'https://newsapi.org/v2',
        apiKeyEnvVar: 'NEWSAPI_ORG_KEY',
        isEnabled: false,
        rateLimitPerDay: 100,
        supportedCategories: ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'],
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'ru', 'cn', 'ae', 'za'],
      },
      {
        id: 'newsdata',
        name: 'Newsdata.io',
        baseUrl: 'https://newsdata.io/api/1',
        apiKeyEnvVar: 'NEWSDATA_IO_KEY',
        isEnabled: false,
        rateLimitPerDay: 200,
        supportedCategories: ['business', 'entertainment', 'environment', 'food', 'health', 'politics', 'science', 'sports', 'technology', 'top', 'world'],
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'ru', 'cn', 'ae', 'za'],
      },
      {
        id: 'mediastack',
        name: 'Mediastack',
        baseUrl: 'http://api.mediastack.com/v1',
        apiKeyEnvVar: 'MEDIASTACK_KEY',
        isEnabled: false,
        rateLimitPerDay: 500,
        supportedCategories: ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'],
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'ru', 'cn', 'ae', 'za'],
      },
    ];

    const errors: string[] = [];
    
    for (const provider of defaultProviders) {
      try {
        const existing = await db.select().from(newsProviders).where(eq(newsProviders.id, provider.id));
        if (existing.length === 0) {
          await db.insert(newsProviders).values(provider);
          console.log(`Seeded provider: ${provider.name}`);
        } else {
          // Update supportedCountries for existing providers
          await db.update(newsProviders)
            .set({ supportedCountries: provider.supportedCountries })
            .where(eq(newsProviders.id, provider.id));
        }
      } catch (error: any) {
        const errorMsg = `Failed to seed provider ${provider.id}: ${error?.message || error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Failed to seed providers: ${errors.join(', ')}`);
    }
  }

  private async getProviders() {
    return db.select().from(newsProviders).where(eq(newsProviders.isEnabled, true));
  }

  async getAllProviders() {
    return db.select().from(newsProviders);
  }

  async getProvider(id: string) {
    const [provider] = await db.select().from(newsProviders).where(eq(newsProviders.id, id));
    return provider;
  }

  async updateProvider(id: string, updates: { isEnabled?: boolean }) {
    const [updated] = await db
      .update(newsProviders)
      .set(updates)
      .where(eq(newsProviders.id, id))
      .returning();
    return updated;
  }

  private getApiKey(envVarName: string): string | undefined {
    return process.env[envVarName];
  }

  private generateArticleId(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex').substring(0, 64);
  }

  private async fetchFromNewsAPI(apiKey: string, countries: string[], category: string = 'general'): Promise<ExternalArticle[]> {
    const allArticles: ExternalArticle[] = [];
    
    for (const country of countries) {
      try {
        const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`NewsAPI error for ${country}: ${response.status}`);
          continue;
        }

        const data: NewsAPIResponse = await response.json();
        const region = this.countryCodeToRegion(country);
        
        const articles = data.articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
          imageUrl: article.urlToImage,
          region,
        }));
        
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching from NewsAPI for ${country}:`, error);
      }
    }
    
    return allArticles;
  }

  private async fetchFromNewsdata(apiKey: string, countries: string[], category: string = 'top'): Promise<ExternalArticle[]> {
    const allArticles: ExternalArticle[] = [];
    
    // Newsdata supports comma-separated countries in a single request
    const countryParam = countries.slice(0, 5).join(','); // Limit to 5 countries per request
    
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=${countryParam}&category=${category}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Newsdata.io error: ${response.status}`);
        return [];
      }

      const data: NewsdataResponse = await response.json();
      
      const articles = (data.results || []).map(article => {
        const articleCountry = article.country?.[0] || countries[0];
        return {
          title: article.title,
          description: article.description,
          url: article.link,
          publishedAt: article.pubDate,
          source: article.source_id,
          imageUrl: article.image_url,
          region: this.countryCodeToRegion(articleCountry),
        };
      });
      
      allArticles.push(...articles);
    } catch (error) {
      console.error('Error fetching from Newsdata.io:', error);
    }
    
    return allArticles;
  }

  private async fetchFromMediastack(apiKey: string, countries: string, category: string = 'general'): Promise<ExternalArticle[]> {
    try {
      const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=${countries}&categories=${category}&limit=50`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Mediastack error: ${response.status}`);
        return [];
      }

      const data: MediastackResponse = await response.json();
      
      return (data.data || []).map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.published_at,
        source: article.source,
        imageUrl: article.image,
        region: article.country ? this.countryCodeToRegion(article.country) : 'Global',
      }));
    } catch (error) {
      console.error('Error fetching from Mediastack:', error);
      return [];
    }
  }

  private countryCodeToRegion(countryCode: string): string {
    const code = countryCode.toLowerCase();
    const mapping: Record<string, string> = {
      'us': 'US',
      'gb': 'UK',
      'uk': 'UK',
      'de': 'Europe',
      'fr': 'Europe',
      'it': 'Europe',
      'es': 'Europe',
      'nl': 'Europe',
      'be': 'Europe',
      'pl': 'Europe',
      'ru': 'Russia',
      'cn': 'China',
      'jp': 'Asia-Pacific',
      'kr': 'Asia-Pacific',
      'in': 'Asia-Pacific',
      'au': 'Asia-Pacific',
      'nz': 'Asia-Pacific',
      'sg': 'Asia-Pacific',
      'tw': 'Asia-Pacific',
      'ae': 'Middle East',
      'il': 'Middle East',
      'sa': 'Middle East',
      'eg': 'Middle East',
      'tr': 'Middle East',
      'za': 'Africa',
      'ng': 'Africa',
      'ke': 'Africa',
    };
    return mapping[code] || 'Global';
  }

  async fetchFromProvider(providerId: string, category: string = 'general'): Promise<ExternalArticle[]> {
    const provider = await this.getProvider(providerId);
    
    if (!provider) {
      console.error(`Provider ${providerId} not found`);
      return [];
    }

    const apiKey = this.getApiKey(provider.apiKeyEnvVar);
    
    if (!apiKey) {
      console.error(`API key not found for ${provider.name} (env var: ${provider.apiKeyEnvVar})`);
      return [];
    }

    // Fetch from multiple regions
    const regionsToFetch = ['US', 'UK', 'Europe', 'Russia', 'China', 'Asia-Pacific', 'Middle East', 'Africa'];
    const allArticles: ExternalArticle[] = [];

    for (const region of regionsToFetch) {
      const regionConfig = regionCountryCodes[region];
      if (!regionConfig) continue;

      try {
        let regionArticles: ExternalArticle[] = [];
        
        switch (providerId) {
          case 'newsapi':
            regionArticles = await this.fetchFromNewsAPI(apiKey, regionConfig.newsapi, category);
            break;
          case 'newsdata':
            regionArticles = await this.fetchFromNewsdata(apiKey, regionConfig.newsdata, category);
            break;
          case 'mediastack':
            regionArticles = await this.fetchFromMediastack(apiKey, regionConfig.mediastack[0], category);
            break;
        }

        // Assign region to articles if not already set
        regionArticles = regionArticles.map(article => ({
          ...article,
          region: article.region || region,
        }));

        allArticles.push(...regionArticles);
        
        // Small delay between region requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching ${providerId} for region ${region}:`, error);
      }
    }

    return allArticles;
  }

  async fetchFromAllEnabledProviders(category: string = 'general'): Promise<ExternalArticle[]> {
    const enabledProviders = await this.getProviders();
    const allArticles: ExternalArticle[] = [];

    for (const provider of enabledProviders) {
      const articles = await this.fetchFromProvider(provider.id, category);
      allArticles.push(...articles);
    }

    return allArticles;
  }

  private parsePublishDate(dateString: string | undefined): Date {
    if (!dateString) {
      return new Date();
    }
    
    const parsed = new Date(dateString);
    
    if (isNaN(parsed.getTime())) {
      return new Date();
    }
    
    return parsed;
  }

  private async getOrCreateRegionSource(providerId: string, providerName: string, region: string, baseUrl: string): Promise<string> {
    const sourceId = `external-${providerId}-${region.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    let [existingSource] = await db
      .select()
      .from(feedSources)
      .where(eq(feedSources.id, sourceId));
    
    if (!existingSource) {
      [existingSource] = await db.insert(feedSources).values({
        id: sourceId,
        name: `${providerName} (${region})`,
        url: baseUrl,
        sourceType: 'api',
        category: 'world',
        region: region,
        isEnabled: true,
      }).returning();
    } else if (existingSource.region !== region) {
      // Update region if it was previously set incorrectly
      await db.update(feedSources)
        .set({ region })
        .where(eq(feedSources.id, sourceId));
    }
    
    return sourceId;
  }

  async ingestExternalArticles(externalArticles: ExternalArticle[], providerId: string, providerName: string, baseUrl: string): Promise<number> {
    let ingestedCount = 0;

    // Group articles by region
    const articlesByRegion = new Map<string, ExternalArticle[]>();
    for (const article of externalArticles) {
      const region = article.region || 'Global';
      if (!articlesByRegion.has(region)) {
        articlesByRegion.set(region, []);
      }
      articlesByRegion.get(region)!.push(article);
    }

    // Ingest articles for each region
    for (const [region, regionArticles] of Array.from(articlesByRegion.entries())) {
      const sourceId = await this.getOrCreateRegionSource(providerId, providerName, region, baseUrl);
      
      for (const article of regionArticles) {
        try {
          if (!article.title || !article.url) {
            console.warn('Skipping article with missing title or URL');
            continue;
          }
          
          const articleId = this.generateArticleId(article.url);
          
          const existing = await db.select().from(articles).where(eq(articles.id, articleId));
          
          if (existing.length === 0) {
            const topics = tagArticleTopics(article.title, article.description);
            const polarisationScore = generatePolarisationScore();
            
            await db.insert(articles).values({
              id: articleId,
              title: article.title,
              link: article.url,
              sourceName: article.source || 'Unknown',
              sourceId: sourceId,
              publishedAt: this.parsePublishDate(article.publishedAt),
              summary: article.description || null,
              imageUrl: article.imageUrl || null,
              topics: topics,
              polarisationScore: polarisationScore,
            });
            ingestedCount++;
          }
        } catch (error) {
          console.error(`Error ingesting article: ${article.title}`, error);
        }
      }
    }

    return ingestedCount;
  }

  async refreshFromExternalProviders(): Promise<{ providerId: string; articlesIngested: number }[]> {
    const results: { providerId: string; articlesIngested: number }[] = [];
    const enabledProviders = await this.getProviders();

    for (const provider of enabledProviders) {
      try {
        console.log(`Fetching from ${provider.name} (multi-region)...`);
        const externalArticles = await this.fetchFromProvider(provider.id);
        
        const ingested = await this.ingestExternalArticles(
          externalArticles, 
          provider.id, 
          provider.name, 
          provider.baseUrl
        );
        console.log(`Ingested ${ingested} articles from ${provider.name} across multiple regions`);
        
        results.push({ providerId: provider.id, articlesIngested: ingested });
      } catch (error) {
        console.error(`Error refreshing from ${provider.name}:`, error);
        results.push({ providerId: provider.id, articlesIngested: 0 });
      }
    }

    return results;
  }

  getProviderStatus(): { providerId: string; name: string; hasApiKey: boolean; isEnabled: boolean }[] {
    const providers = [
      { id: 'newsapi', name: 'NewsAPI.org', envVar: 'NEWSAPI_ORG_KEY' },
      { id: 'newsdata', name: 'Newsdata.io', envVar: 'NEWSDATA_IO_KEY' },
      { id: 'mediastack', name: 'Mediastack', envVar: 'MEDIASTACK_KEY' },
    ];

    return providers.map(p => ({
      providerId: p.id,
      name: p.name,
      hasApiKey: !!process.env[p.envVar],
      isEnabled: false,
    }));
  }
}

export const newsProviderService = new NewsProviderService();
