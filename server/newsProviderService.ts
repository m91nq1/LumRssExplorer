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
  }>;
}

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
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'br', 'mx'],
      },
      {
        id: 'newsdata',
        name: 'Newsdata.io',
        baseUrl: 'https://newsdata.io/api/1',
        apiKeyEnvVar: 'NEWSDATA_IO_KEY',
        isEnabled: false,
        rateLimitPerDay: 200,
        supportedCategories: ['business', 'entertainment', 'environment', 'food', 'health', 'politics', 'science', 'sports', 'technology', 'top', 'world'],
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'br', 'mx'],
      },
      {
        id: 'mediastack',
        name: 'Mediastack',
        baseUrl: 'http://api.mediastack.com/v1',
        apiKeyEnvVar: 'MEDIASTACK_KEY',
        isEnabled: false,
        rateLimitPerDay: 500,
        supportedCategories: ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'],
        supportedCountries: ['us', 'gb', 'ca', 'au', 'de', 'fr', 'in', 'jp', 'br', 'mx'],
      },
    ];

    const errors: string[] = [];
    
    for (const provider of defaultProviders) {
      try {
        const existing = await db.select().from(newsProviders).where(eq(newsProviders.id, provider.id));
        if (existing.length === 0) {
          await db.insert(newsProviders).values(provider);
          console.log(`Seeded provider: ${provider.name}`);
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

  private async fetchFromNewsAPI(apiKey: string, category: string = 'general'): Promise<ExternalArticle[]> {
    try {
      const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`NewsAPI error: ${response.status}`);
        return [];
      }

      const data: NewsAPIResponse = await response.json();
      
      return data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        imageUrl: article.urlToImage,
      }));
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error);
      return [];
    }
  }

  private async fetchFromNewsdata(apiKey: string, category: string = 'top'): Promise<ExternalArticle[]> {
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=us&category=${category}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Newsdata.io error: ${response.status}`);
        return [];
      }

      const data: NewsdataResponse = await response.json();
      
      return (data.results || []).map(article => ({
        title: article.title,
        description: article.description,
        url: article.link,
        publishedAt: article.pubDate,
        source: article.source_id,
        imageUrl: article.image_url,
      }));
    } catch (error) {
      console.error('Error fetching from Newsdata.io:', error);
      return [];
    }
  }

  private async fetchFromMediastack(apiKey: string, category: string = 'general'): Promise<ExternalArticle[]> {
    try {
      const url = `http://api.mediastack.com/v1/news?access_key=${apiKey}&countries=us&categories=${category}&limit=50`;
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
      }));
    } catch (error) {
      console.error('Error fetching from Mediastack:', error);
      return [];
    }
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

    switch (providerId) {
      case 'newsapi':
        return this.fetchFromNewsAPI(apiKey, category);
      case 'newsdata':
        return this.fetchFromNewsdata(apiKey, category);
      case 'mediastack':
        return this.fetchFromMediastack(apiKey, category);
      default:
        console.error(`Unknown provider: ${providerId}`);
        return [];
    }
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

  async ingestExternalArticles(externalArticles: ExternalArticle[], sourceId: string): Promise<number> {
    let ingestedCount = 0;

    for (const article of externalArticles) {
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

    return ingestedCount;
  }

  async refreshFromExternalProviders(): Promise<{ providerId: string; articlesIngested: number }[]> {
    const results: { providerId: string; articlesIngested: number }[] = [];
    const enabledProviders = await this.getProviders();

    for (const provider of enabledProviders) {
      try {
        console.log(`Fetching from ${provider.name}...`);
        const externalArticles = await this.fetchFromProvider(provider.id);
        
        let [externalSource] = await db
          .select()
          .from(feedSources)
          .where(eq(feedSources.id, `external-${provider.id}`));
        
        if (!externalSource) {
          [externalSource] = await db.insert(feedSources).values({
            id: `external-${provider.id}`,
            name: provider.name,
            url: provider.baseUrl,
            sourceType: 'api',
            category: 'world',
            isEnabled: true,
          }).returning();
        }
        
        const ingested = await this.ingestExternalArticles(externalArticles, externalSource.id);
        console.log(`Ingested ${ingested} articles from ${provider.name}`);
        
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
