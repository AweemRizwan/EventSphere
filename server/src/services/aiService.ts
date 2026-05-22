import { supabaseAdmin } from "../lib/supabase.js";
import { env } from "../config/env.js";

export async function getRecommendations(userId: string) {
  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("event_id, event:events(category_id)")
    .eq("user_id", userId)
    .limit(10);

  const categoryIds = new Set<string>();
  for (const b of bookings ?? []) {
    const cat = (b as { event?: { category_id?: string } }).event?.category_id;
    if (cat) categoryIds.add(cat);
  }

  let query = supabaseAdmin
    .from("events")
    .select("id, title, starts_at, category_id")
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(5);

  if (categoryIds.size) {
    query = query.in("category_id", [...categoryIds]);
  }

  const { data: events } = await query;

  const insights = (events ?? []).map((e, i) => ({
    id: `rec-${e.id}`,
    scope: "user" as const,
    scope_id: userId,
    insight_type: "recommendation" as const,
    payload: { event_id: e.id, title: e.title, rank: i + 1, reason: "Based on your interests" },
    generated_at: new Date().toISOString(),
  }));

  if (env.featureAi && insights.length) {
    await supabaseAdmin.from("ai_insights").insert(
      insights.map((ins) => ({
        scope: ins.scope,
        scope_id: ins.scope_id,
        insight_type: ins.insight_type,
        payload: ins.payload,
      }))
    );
  }

  return insights;
}

export async function getEventInsights(eventId: string) {
  const { count: bookings } = await supabaseAdmin
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  const { count: chatCount } = await supabaseAdmin
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("capacity, title")
    .eq("id", eventId)
    .maybeSingle();

  const capacity = event?.capacity || 100;
  const forecast = Math.min(100, Math.round(((bookings ?? 0) / capacity) * 100) + 10);

  const sentimentScore =
    (chatCount ?? 0) > 20 ? 0.72 : (chatCount ?? 0) > 5 ? 0.55 : 0.4;

  return [
    {
      id: `forecast-${eventId}`,
      scope: "event" as const,
      scope_id: eventId,
      insight_type: "attendance_forecast" as const,
      payload: {
        forecast_percent: forecast,
        confirmed_bookings: bookings ?? 0,
        capacity,
      },
      generated_at: new Date().toISOString(),
    },
    {
      id: `sentiment-${eventId}`,
      scope: "event" as const,
      scope_id: eventId,
      insight_type: "sentiment" as const,
      payload: {
        score: sentimentScore,
        label: sentimentScore > 0.6 ? "positive" : "neutral",
        message_count: chatCount ?? 0,
      },
      generated_at: new Date().toISOString(),
    },
  ];
}
