import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import * as streamService from "../services/streamService.js";

export const streamsRouter = Router();

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

streamsRouter.get("/:eventId/playback", requireAuth, async (req, res) => {
  try {
    const eventId = getParam(req.params.eventId);
    const user = req.user!;

    const event = await streamService.getEventStreamUrl(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const isOrganizer =
      event.organizer_id === user.id || user.role === "admin";
    const hasBooking = await streamService.userHasBooking(user.id, eventId);

    const { supabaseAdmin } = await import("../lib/supabase.js");
    const { data: tiers } = await supabaseAdmin
      .from("ticket_tiers")
      .select("price")
      .eq("event_id", eventId)
      .eq("is_active", true);
    const isFreeEvent =
      !tiers?.length || tiers.every((t: { price: number }) => Number(t.price) === 0);

    if (!isOrganizer && !hasBooking && !isFreeEvent) {
      return res.status(403).json({ error: "Booking required to join stream" });
    }

    const session = await streamService.getActiveSession(eventId);
    const playback_url = session?.playback_url || event.stream_url || "";

    res.json({
      playback_url,
      status: session?.status === "live" ? "live" : playback_url ? "live" : "offline",
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

streamsRouter.post(
  "/:eventId/start",
  requireAuth,
  requireRole("organizer", "admin"),
  async (req, res) => {
    try {
      const eventId = getParam(req.params.eventId);
      const { provider = "custom" } = req.body ?? {};

      if (req.user!.role === "organizer") {
        const event = await streamService.getEventStreamUrl(eventId);
        if (event?.organizer_id !== req.user!.id) {
          return res.status(403).json({ error: "Not your event" });
        }
      }

      const session = await streamService.startStream(eventId, provider);
      res.status(201).json(session);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

streamsRouter.post(
  "/:eventId/end",
  requireAuth,
  requireRole("organizer", "admin"),
  async (req, res) => {
    try {
      const eventId = getParam(req.params.eventId);
      const session = await streamService.endStream(eventId);
      res.json(session);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);
