import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { env } from "../config/env.js";
import * as aiService from "../services/aiService.js";

export const aiRouter = Router();

aiRouter.get("/recommendations", requireAuth, async (req, res) => {
  if (!env.featureAi) {
    return res.json([]);
  }
  try {
    const data = await aiService.getRecommendations(req.user!.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

aiRouter.get(
  "/events/:eventId/insights",
  requireAuth,
  requireRole("organizer", "admin"),
  async (req, res) => {
    if (!env.featureAi) {
      return res.json([]);
    }
    try {
      const data = await aiService.getEventInsights(req.params.eventId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);
