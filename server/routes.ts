import type { Express } from "express";
import { createServer, type Server } from "http";
import { articleStore } from "./articleStore";
import { articleQuerySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Initializing article store...");
  await articleStore.initialize();
  console.log("Article store initialized");

  app.get("/api/articles", async (req, res) => {
    try {
      const validationResult = articleQuerySchema.safeParse({
        sourceId: req.query.sourceId,
        search: req.query.search,
        since: req.query.since,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: validationResult.error.errors,
        });
      }

      const { sourceId, search, since, page, pageSize } = validationResult.data;

      const filteredArticles = articleStore.getFilteredArticles(
        sourceId,
        search,
        since
      );

      const result = articleStore.getPaginatedArticles(
        filteredArticles,
        page,
        pageSize
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/sources", async (req, res) => {
    try {
      const sources = articleStore.getSources();
      const lastRefreshTime = articleStore.getLastRefreshTime();

      res.json({
        sources,
        lastRefreshTime,
      });
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.post("/api/refresh", async (req, res) => {
    try {
      await articleStore.refresh();
      res.json({ success: true, message: "Feed refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing feed:", error);
      res.status(500).json({ error: "Failed to refresh feed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
