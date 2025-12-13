import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { articleStore } from "./articleStore";
import { storage } from "./storage";
import { articleQuerySchema, insertFeedSourceSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { newsProviderService } from "./newsProviderService";
import { generateAISummary, validateApiKey } from "./summaryService";
import { runDigestsForAllUsers } from "./services/digestService";
import { sendWelcomeEmail } from "./services/emailService";

// Middleware to extract user ID from session or X-Username header (fallback)
async function userMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionUser = req.user as any;
  
  if (sessionUser?.claims?.sub) {
    try {
      const user = await storage.getUserByReplitId(sessionUser.claims.sub);
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

      const { sourceId, topics, regions, search, since, page, pageSize, bookmarkedOnly, unreadOnly, mostPolarised } = validationResult.data;
      
      // Get userId from session if available
      const userId = (req as any).userId || undefined;

      const result = await articleStore.getFilteredArticles({
        sourceId,
        topics,
        regions,
        search,
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
      const { apiKey } = req.body;
      const articleId = req.params.id;

      if (!apiKey) {
        return res.status(400).json({ error: "OpenRouter API key is required" });
      }

      if (!validateApiKey(apiKey)) {
        return res.status(400).json({ error: "Invalid API key format" });
      }

      const result = await generateAISummary(articleId, apiKey);
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

  // ==================== FEED MANAGEMENT ====================
  app.get("/api/feeds", async (req, res) => {
    try {
      const feeds = await storage.getFeedSources();
      res.json({ feeds });
    } catch (error) {
      console.error("Error fetching feeds:", error);
      res.status(500).json({ error: "Failed to fetch feeds" });
    }
  });

  app.post("/api/feeds", async (req, res) => {
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

  app.patch("/api/feeds/:id", async (req, res) => {
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

  app.delete("/api/feeds/:id", async (req, res) => {
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
      const { favouriteTopics, preferredRegions, emailDigestEnabled } = req.body;
      
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
        emailDigestEnabled: emailDigestEnabled ?? existingPrefs?.emailDigestEnabled ?? false,
      });

      res.json({ preferences });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
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
