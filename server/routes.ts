import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { articleStore } from "./articleStore";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { articles, articleQuerySchema, insertFeedSourceSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { newsProviderService } from "./newsProviderService";
import { generateAISummary, validateApiKey } from "./summaryService";
import { runDigestsForAllUsers, runBehaviorBasedDigests, startDigestScheduler } from "./services/digestService";
import { sendWelcomeEmail, sendLoginNotificationEmail } from "./services/emailService";
import { extractArticleContent } from "./contentExtractor";

// Admin email addresses from environment variable (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "ljmginqi0.1@gmail.com,lumginqi1@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase());

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Admin middleware - checks if user is an admin (via query param or header)
async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const supabaseId = req.query.supabaseId as string || req.headers['x-supabase-id'] as string;
  
  if (!supabaseId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const user = await storage.getUserBySupabaseId(supabaseId);
    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
}

// Middleware to extract user ID from session or X-Username header (fallback)
async function userMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionUser = req.user as any;
  
  if (sessionUser?.claims?.sub) {
    try {
      const user = await storage.getUserBySupabaseId(sessionUser.claims.sub);
      if (user) {
        (req as any).userId = user.id;
      }
    } catch (error) {
      console.error("Error looking up session user:", error);
    }
  } else {
    const username = req.headers["x-username"] as string | undefined;
    if (username) {
      try {
        const user = await storage.getOrCreateUser(username);
        (req as any).userId = user.id;
      } catch (error) {
        console.error("Error looking up user:", error);
      }
    }
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize news providers first so they're available during article store refresh
  console.log("Initializing news providers...");
  await newsProviderService.initialize();
  console.log("News providers initialized");

  console.log("Initializing article store...");
  await articleStore.initialize();
  console.log("Article store initialized");

  // Start the behavior-based digest scheduler (every 2 days)
  startDigestScheduler();

  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Supabase auth - handle login/signup and send notifications
  app.post("/api/auth/supabase-login", async (req, res) => {
    try {
      const { supabaseId, email, firstName, lastName } = req.body;
      
      if (!supabaseId || !email) {
        return res.status(400).json({ error: "supabaseId and email are required" });
      }

      const { user, isNewUser } = await storage.upsertUserBySupabaseId({
        supabaseId,
        email,
        firstName,
        lastName,
      });

      // Send appropriate email
      if (isNewUser) {
        // Send welcome email for new users
        sendWelcomeEmail(email, firstName || user.username).catch(err => 
          console.error("Failed to send welcome email:", err)
        );
      } else {
        // Send login notification for existing users (if enabled)
        const prefs = await storage.getUserPreferences(user.id);
        if (!prefs || prefs.loginNotificationEnabled !== false) {
          sendLoginNotificationEmail(email, firstName || user.username).catch(err =>
            console.error("Failed to send login notification:", err)
          );
        }
      }

      res.json({ user, isNewUser });
    } catch (error) {
      console.error("Error handling Supabase login:", error);
      res.status(500).json({ error: "Failed to process login" });
    }
  });

  // Get user by Supabase ID
  app.get("/api/auth/supabase-user/:supabaseId", async (req, res) => {
    try {
      const user = await storage.getUserBySupabaseId(req.params.supabaseId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching Supabase user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Apply user middleware to all other API routes
  app.use("/api", userMiddleware);

  // ==================== ARTICLES ====================
  app.get("/api/articles", async (req, res) => {
    try {
      const validationResult = articleQuerySchema.safeParse({
        sourceId: req.query.sourceId,
        topics: req.query.topics,
        regions: req.query.regions,
        search: req.query.search,
        caseSensitive: req.query.caseSensitive === "true",
        exactPhrase: req.query.exactPhrase === "true",
        since: req.query.since,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
        bookmarkedOnly: req.query.bookmarkedOnly === "true",
        unreadOnly: req.query.unreadOnly === "true",
        mostPolarised: req.query.mostPolarised === "true",
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { sourceId, topics, regions, search, caseSensitive, exactPhrase, since, page, pageSize, bookmarkedOnly, unreadOnly, mostPolarised } = validationResult.data;
      
      // Get userId from session if available
      const userId = (req as any).userId || undefined;

      const result = await articleStore.getFilteredArticles({
        sourceId,
        topics,
        regions,
        search,
        caseSensitive,
        exactPhrase,
        since,
        page,
        pageSize,
        userId,
        bookmarkedOnly,
        unreadOnly,
        mostPolarised,
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const userId = (req as any).userId || undefined;
      const article = await articleStore.getArticle(req.params.id, userId);
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.get("/api/articles/:id/related", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const related = await articleStore.getRelatedArticles(req.params.id, limit);
      res.json({ articles: related });
    } catch (error) {
      console.error("Error fetching related articles:", error);
      res.status(500).json({ error: "Failed to fetch related articles" });
    }
  });

  app.get("/api/articles/:id/neighbors", async (req, res) => {
    try {
      const neighbors = await storage.getArticleNeighbors(req.params.id);
      res.json(neighbors);
    } catch (error) {
      console.error("Error fetching article neighbors:", error);
      res.status(500).json({ error: "Failed to fetch article neighbors" });
    }
  });

  // ==================== AI SUMMARY ====================
  app.post("/api/articles/:id/ai-summary", async (req, res) => {
    try {
      const articleId = req.params.id;

      const serverApiKey = process.env.OPENROUTER_API_KEY;
      if (!serverApiKey) {
        return res.status(503).json({ error: "AI summary service is not configured" });
      }

      const result = await generateAISummary(articleId, serverApiKey);
      res.json(result);
    } catch (error: any) {
      console.error("Error generating AI summary:", error);
      
      if (error.message?.includes("Article not found")) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      if (error.message?.includes("Invalid API key") || 
          error.message?.includes("Insufficient credits") ||
          error.message?.includes("Rate limit")) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || "Failed to generate AI summary" });
    }
  });

  // ==================== CONTENT EXTRACTION ====================
  app.get("/api/articles/:id/content", async (req, res) => {
    try {
      const articleId = req.params.id;
      const content = await extractArticleContent(articleId);
      res.json(content);
    } catch (error: any) {
      console.error("Error extracting article content:", error);
      
      if (error.message?.includes("Article not found")) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.status(500).json({ error: error.message || "Failed to extract content" });
    }
  });

  // ==================== SOURCES ====================
  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await articleStore.getSources();
      const lastRefreshTime = await articleStore.getLastRefreshTime();

      res.json({
        sources,
        lastRefreshTime,
      });
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  // ==================== ADMIN CHECK ====================
  app.get("/api/admin/check", async (req: any, res) => {
    try {
      const supabaseId = req.query.supabaseId as string;
      if (!supabaseId) {
        return res.json({ isAdmin: false });
      }
      const user = await storage.getUserBySupabaseId(supabaseId);
      const userEmail = user?.email?.toLowerCase();
      const adminStatus = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
      console.log("[Admin Check] User email:", userEmail, "Admin emails:", ADMIN_EMAILS, "Is admin:", adminStatus);
      res.json({ isAdmin: adminStatus });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.json({ isAdmin: false });
    }
  });

  // ==================== FEED MANAGEMENT (Admin Only) ====================
  app.get("/api/feeds", isAdmin, async (req, res) => {
    try {
      const feeds = await storage.getFeedSources();
      res.json({ feeds });
    } catch (error) {
      console.error("Error fetching feeds:", error);
      res.status(500).json({ error: "Failed to fetch feeds" });
    }
  });

  app.post("/api/feeds", isAdmin, async (req, res) => {
    try {
      const validationResult = insertFeedSourceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid feed data",
          details: validationResult.error.errors,
        });
      }

      const feed = await storage.createFeedSource(validationResult.data);
      res.status(201).json(feed);
    } catch (error) {
      console.error("Error creating feed:", error);
      res.status(500).json({ error: "Failed to create feed" });
    }
  });

  app.patch("/api/feeds/:id", isAdmin, async (req, res) => {
    try {
      const feed = await storage.updateFeedSource(req.params.id, req.body);
      
      if (!feed) {
        return res.status(404).json({ error: "Feed not found" });
      }

      res.json(feed);
    } catch (error) {
      console.error("Error updating feed:", error);
      res.status(500).json({ error: "Failed to update feed" });
    }
  });

  app.delete("/api/feeds/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteFeedSource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting feed:", error);
      res.status(500).json({ error: "Failed to delete feed" });
    }
  });

  // ==================== REFRESH ====================
  app.post("/api/refresh", async (req, res) => {
    try {
      await articleStore.refresh();
      res.json({ success: true, message: "Feed refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing feed:", error);
      res.status(500).json({ error: "Failed to refresh feed" });
    }
  });

  // ==================== BOOKMARKS ====================
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const { articleId } = req.body;
      const userId = (req as any).userId as number | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const existing = await storage.getBookmark(userId, articleId);
      
      if (existing) {
        return res.status(409).json({ error: "Bookmark already exists" });
      }

      const bookmark = await storage.createBookmark({
        userId,
        articleId,
      });

      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ error: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks", async (req, res) => {
    try {
      const { articleId } = req.body;
      const userId = (req as any).userId as number | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.deleteBookmark(userId, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  app.get("/api/bookmarks", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.json({ bookmarks: [] });
      }

      const bookmarks = await storage.getUserBookmarks(userId);
      res.json({ bookmarks });
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  // ==================== READ STATUS ====================
  app.post("/api/read", async (req, res) => {
    try {
      const { articleId } = req.body;
      const userId = (req as any).userId as number | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const readStatus = await storage.markAsRead(userId, articleId);
      res.status(201).json(readStatus);
    } catch (error) {
      console.error("Error marking as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.get("/api/read-history", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const history = await storage.getReadHistory(userId, limit);
      res.json({ articles: history, total: history.length });
    } catch (error) {
      console.error("Error fetching read history:", error);
      res.status(500).json({ error: "Failed to fetch read history" });
    }
  });

  app.delete("/api/read-history", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.clearReadHistory(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing read history:", error);
      res.status(500).json({ error: "Failed to clear read history" });
    }
  });

  // ==================== USER PREFERENCES ====================
  app.get("/api/preferences", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.json({ preferences: null });
      }

      const preferences = await storage.getUserPreferences(userId);
      res.json({ preferences: preferences || null });
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      const { 
        favoriteSources, 
        favouriteTopics, 
        preferredRegions, 
        defaultSearchQuery, 
        defaultTimeFilter,
        emailDigestEnabled 
      } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const preferences = await storage.upsertUserPreferences({
        userId,
        favoriteSources,
        favouriteTopics,
        preferredRegions,
        defaultSearchQuery,
        defaultTimeFilter,
        emailDigestEnabled,
      });

      res.json({ preferences });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  app.put("/api/users/me/preferences", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      const { favouriteTopics, preferredRegions, emailDigestEnabled, loginNotificationEnabled } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const existingPrefs = await storage.getUserPreferences(userId);
      
      const preferences = await storage.upsertUserPreferences({
        userId,
        favoriteSources: existingPrefs?.favoriteSources,
        favouriteTopics: favouriteTopics || existingPrefs?.favouriteTopics,
        preferredRegions: preferredRegions || existingPrefs?.preferredRegions,
        defaultSearchQuery: existingPrefs?.defaultSearchQuery,
        defaultTimeFilter: existingPrefs?.defaultTimeFilter,
        emailDigestEnabled: emailDigestEnabled ?? existingPrefs?.emailDigestEnabled ?? true,
        loginNotificationEnabled: loginNotificationEnabled ?? existingPrefs?.loginNotificationEnabled ?? true,
      });

      res.json({ preferences });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // ==================== FOR YOU (PERSONALIZED FEED) ====================
  app.get("/api/for-you", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required for personalized feed" });
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;

      const result = await storage.getPersonalizedArticles(userId, page, pageSize);
      
      res.json({
        articles: result.articles,
        inferredTopics: result.topics,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      });
    } catch (error) {
      console.error("Error fetching personalized feed:", error);
      res.status(500).json({ error: "Failed to fetch personalized feed" });
    }
  });

  // ==================== STORY CLUSTERS ====================
  app.get("/api/clusters", async (req, res) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const clusters = await storage.getArticleClusters({ since, limit });
      
      res.json({ clusters });
    } catch (error) {
      console.error("Error fetching article clusters:", error);
      res.status(500).json({ error: "Failed to fetch article clusters" });
    }
  });

  // ==================== BREAKING NEWS ====================
  app.get("/api/breaking-news", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        // Return general breaking news without personalization
        const clusters = await storage.getArticleClusters({ 
          since: new Date(Date.now() - 2 * 60 * 60 * 1000),
          limit: 3 
        });
        const articles = clusters.flatMap(c => c.articles).slice(0, 10);
        return res.json({ articles, personalized: false });
      }

      const articles = await storage.getBreakingNews(userId);
      res.json({ articles, personalized: true });
    } catch (error) {
      console.error("Error fetching breaking news:", error);
      res.status(500).json({ error: "Failed to fetch breaking news" });
    }
  });

  // ==================== READING PROGRESS ====================
  app.get("/api/reading-progress/:articleId", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const progress = await storage.getReadingProgress(userId, req.params.articleId);
      res.json({ progress: progress || null });
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ error: "Failed to fetch reading progress" });
    }
  });

  app.post("/api/reading-progress", async (req, res) => {
    try {
      const userId = (req as any).userId as number | undefined;
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { articleId, scrollPosition, percentRead } = req.body;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }

      const progress = await storage.upsertReadingProgress({
        userId,
        articleId,
        scrollPosition: scrollPosition ?? 0,
        percentRead: percentRead ?? 0,
      });

      res.json({ progress });
    } catch (error) {
      console.error("Error saving reading progress:", error);
      res.status(500).json({ error: "Failed to save reading progress" });
    }
  });

  // ==================== NEWS PROVIDERS ====================
  const providerFeatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!newsProviderService.isAvailable()) {
      return res.status(503).json({ 
        error: "External news providers feature is not available. Run 'npm run db:push' to enable it.",
        hint: "The news_providers table needs to be created. Please run migrations."
      });
    }
    next();
  };

  app.get("/api/providers", providerFeatureMiddleware, async (req, res) => {
    try {
      const providers = await newsProviderService.getAllProviders();
      const providerStatuses = providers.map(p => ({
        ...p,
        hasApiKey: !!process.env[p.apiKeyEnvVar],
      }));
      res.json({ providers: providerStatuses });
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.patch("/api/providers/:id", providerFeatureMiddleware, async (req, res) => {
    try {
      const { isEnabled } = req.body;
      
      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ error: "isEnabled must be a boolean" });
      }

      const provider = await newsProviderService.updateProvider(req.params.id, { isEnabled });
      
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }

      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(500).json({ error: "Failed to update provider" });
    }
  });

  app.post("/api/providers/refresh", providerFeatureMiddleware, async (req, res) => {
    try {
      const results = await newsProviderService.refreshFromExternalProviders();
      res.json({ success: true, results });
    } catch (error) {
      console.error("Error refreshing from providers:", error);
      res.status(500).json({ error: "Failed to refresh from providers" });
    }
  });

  app.post("/api/providers/:id/fetch", providerFeatureMiddleware, async (req, res) => {
    try {
      const provider = await newsProviderService.getProvider(req.params.id);
      
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      if (!process.env[provider.apiKeyEnvVar]) {
        return res.status(400).json({ 
          error: `API key not configured. Please set the ${provider.apiKeyEnvVar} environment variable.`,
          apiKeyEnvVar: provider.apiKeyEnvVar
        });
      }
      
      const { category } = req.body;
      const articles = await newsProviderService.fetchFromProvider(req.params.id, category || 'general');
      res.json({ articles, count: articles.length });
    } catch (error) {
      console.error("Error fetching from provider:", error);
      res.status(500).json({ error: "Failed to fetch from provider" });
    }
  });

  // ==================== ADMIN: RE-TAG ARTICLES ====================
  app.post("/api/admin/retag-articles", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("[Admin] Re-tagging all articles with improved topic logic...");
      const { tagArticleTopics } = await import("./topicTagger");
      
      // Get all articles
      const allArticles = await db.select({
        id: articles.id,
        title: articles.title,
        summary: articles.summary,
      }).from(articles);
      
      let updated = 0;
      for (const article of allArticles) {
        const newTopics = tagArticleTopics(article.title, article.summary);
        await db.update(articles)
          .set({ topics: newTopics })
          .where(eq(articles.id, article.id));
        updated++;
      }
      
      console.log(`[Admin] Re-tagged ${updated} articles`);
      res.json({ 
        success: true, 
        message: `Re-tagged ${updated} articles with improved topic logic`,
        articlesUpdated: updated
      });
    } catch (error) {
      console.error("Error re-tagging articles:", error);
      res.status(500).json({ error: "Failed to re-tag articles" });
    }
  });

  // ==================== ADMIN: DIGEST EMAILS ====================
  app.post("/api/admin/run-digests", async (req, res) => {
    try {
      console.log("[Admin] Running digest emails for all users...");
      const stats = await runDigestsForAllUsers();
      res.json({ 
        success: true, 
        message: `Processed ${stats.usersProcessed} users, sent ${stats.emailsSent} emails`,
        stats 
      });
    } catch (error) {
      console.error("Error running digests:", error);
      res.status(500).json({ error: "Failed to run digests" });
    }
  });

  // ==================== BEHAVIOR-BASED DIGESTS (learns from reading history) ====================
  app.post("/api/admin/run-behavior-digests", async (req, res) => {
    try {
      console.log("[Admin] Running behavior-based digest emails...");
      const stats = await runBehaviorBasedDigests();
      res.json({ 
        success: true, 
        message: `Processed ${stats.usersProcessed} users, sent ${stats.emailsSent} behavior-based emails`,
        stats 
      });
    } catch (error) {
      console.error("Error running behavior-based digests:", error);
      res.status(500).json({ error: "Failed to run behavior-based digests" });
    }
  });

  // ==================== WELCOME EMAIL (for testing) ====================
  app.post("/api/admin/send-welcome", async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "email is required" });
      }

      await sendWelcomeEmail(email, name);
      res.json({ success: true, message: `Welcome email sent to ${email}` });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
