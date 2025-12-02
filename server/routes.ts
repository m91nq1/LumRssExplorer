import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { articleStore } from "./articleStore";
import { storage } from "./storage";
import { articleQuerySchema, insertFeedSourceSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to extract user ID from X-Username header
async function userMiddleware(req: Request, res: Response, next: NextFunction) {
  const username = req.headers["x-username"] as string | undefined;
  if (username) {
    try {
      // Auto-create user if they don't exist to ensure personalization works
      const user = await storage.getOrCreateUser(username);
      (req as any).userId = user.id;
    } catch (error) {
      console.error("Error looking up user:", error);
    }
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Initializing article store...");
  await articleStore.initialize();
  console.log("Article store initialized");

  // Apply user middleware to all API routes
  app.use("/api", userMiddleware);

  // ==================== ARTICLES ====================
  app.get("/api/articles", async (req, res) => {
    try {
      const validationResult = articleQuerySchema.safeParse({
        sourceId: req.query.sourceId,
        search: req.query.search,
        since: req.query.since,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
        bookmarkedOnly: req.query.bookmarkedOnly === "true",
        unreadOnly: req.query.unreadOnly === "true",
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { sourceId, search, since, page, pageSize, bookmarkedOnly, unreadOnly } = validationResult.data;
      
      // Get userId from session if available
      const userId = (req as any).userId || undefined;

      const result = await articleStore.getFilteredArticles(
        sourceId,
        search,
        since,
        page,
        pageSize,
        userId,
        bookmarkedOnly,
        unreadOnly
      );

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
      const username = req.headers["x-username"] as string | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!username) {
        return res.status(401).json({ error: "Username header is required" });
      }

      const user = await storage.getOrCreateUser(username);
      const existing = await storage.getBookmark(user.id, articleId);
      
      if (existing) {
        return res.status(409).json({ error: "Bookmark already exists" });
      }

      const bookmark = await storage.createBookmark({
        userId: user.id,
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
      const username = req.headers["x-username"] as string | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!username) {
        return res.status(401).json({ error: "Username header is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.deleteBookmark(user.id, articleId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ error: "Failed to delete bookmark" });
    }
  });

  app.get("/api/bookmarks", async (req, res) => {
    try {
      const username = req.query.username as string;
      
      if (!username) {
        return res.status(400).json({ error: "username is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.json({ bookmarks: [] });
      }

      const bookmarks = await storage.getUserBookmarks(user.id);
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
      const username = req.headers["x-username"] as string | undefined;
      
      if (!articleId) {
        return res.status(400).json({ error: "articleId is required" });
      }
      
      if (!username) {
        return res.status(401).json({ error: "Username header is required" });
      }

      const user = await storage.getOrCreateUser(username);
      const readStatus = await storage.markAsRead(user.id, articleId);
      res.status(201).json(readStatus);
    } catch (error) {
      console.error("Error marking as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
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
      const { favoriteSources, defaultSearchQuery, defaultTimeFilter } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const preferences = await storage.upsertUserPreferences({
        userId,
        favoriteSources,
        defaultSearchQuery,
        defaultTimeFilter,
      });

      res.json({ preferences });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
