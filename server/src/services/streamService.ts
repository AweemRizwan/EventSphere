import { supabaseAdmin } from "../lib/supabase.js";

export async function getEventStreamUrl(eventId: string) {
  const { data } = await supabaseAdmin
    .from("events")
    .select("stream_url, organizer_id, is_online")
    .eq("id", eventId)
    .maybeSingle();
  return data;
}

export async function getActiveSession(eventId: string) {
  const { data } = await supabaseAdmin
    .from("stream_sessions")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function startStream(eventId: string, provider: string) {
  const event = await getEventStreamUrl(eventId);
  if (!event) throw new Error("Event not found");

  const playback_url = event.stream_url || "";
  const { data, error } = await supabaseAdmin
    .from("stream_sessions")
    .insert({
      event_id: eventId,
      provider,
      playback_url,
      status: "live",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endStream(eventId: string) {
  const session = await getActiveSession(eventId);
  if (!session) throw new Error("No active session");

  const { data, error } = await supabaseAdmin
    .from("stream_sessions")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function userHasBooking(userId: string, eventId: string) {
  const { data } = await supabaseAdmin
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .maybeSingle();
  return !!data;
}
