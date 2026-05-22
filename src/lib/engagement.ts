import { supabase } from "@/lib/supabase";

export type EngagementAction =
  | "join_stream"
  | "leave_stream"
  | "chat_send"
  | "poll_vote"
  | "reaction"
  | "view_event";

export async function logEngagement(
  eventId: string,
  action: EngagementAction,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("engagement_events").insert({
    event_id: eventId,
    user_id: user.id,
    action,
    metadata,
  });
}
