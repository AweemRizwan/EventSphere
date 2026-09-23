import { supabase } from "@/lib/supabase";

export interface ParticipationRecord {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  recorded_at: string;
  status: string;
  certificate_enabled: boolean;
  attendee_name?: string;
  attendee_email?: string;
}

function isCertificateEnabledForEvent(metadata?: Record<string, unknown> | null): boolean {
  if (!metadata || typeof metadata !== "object") return false;

  const certificate = (metadata.certificate as Record<string, unknown> | undefined) ?? {};
  if (typeof certificate.enabled === "boolean") return certificate.enabled;

  return Boolean(certificate && Object.keys(certificate).length > 0);
}

export async function getParticipationHistoryForUser(userId: string): Promise<ParticipationRecord[]> {
  if (!userId) return [];

  const [bookingRes, manualRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, user_id, event_id, status, created_at, event:events(id, title, starts_at, ends_at, metadata)")
      .eq("user_id", userId)
      .eq("status", "confirmed"),
    supabase
      .from("manual_ticket_requests")
      .select("id, user_id, event_id, status, created_at, event_title, approved_at, event:events(id, title, starts_at, ends_at, metadata)")
      .eq("user_id", userId)
      .eq("status", "confirmed"),
  ]);

  if (bookingRes.error) {
    console.error("Failed to load confirmed bookings for participation history:", bookingRes.error.message);
  }

  if (manualRes.error) {
    console.error("Failed to load confirmed manual bookings for participation history:", manualRes.error.message);
  }

  const bookings = (bookingRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    event_id: string;
    status: string;
    created_at: string;
    event?: { id?: string; title?: string; starts_at?: string; ends_at?: string; metadata?: Record<string, unknown> };
  }>;

  const manualBookings = (manualRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    event_id: string;
    status: string;
    created_at: string;
    event_title?: string;
    approved_at?: string;
    event?: { id?: string; title?: string; starts_at?: string; ends_at?: string; metadata?: Record<string, unknown> };
  }>;

  const normalized = [
    ...bookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      event_title: booking.event?.title || "Event",
      event_date: booking.event?.starts_at || booking.created_at,
      recorded_at: booking.created_at,
      status: booking.status,
      certificate_enabled: isCertificateEnabledForEvent(booking.event?.metadata as Record<string, unknown> | undefined),
    })),
    ...manualBookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      event_title: booking.event?.title || booking.event_title || "Event",
      event_date: booking.approved_at || booking.created_at,
      recorded_at: booking.approved_at || booking.created_at,
      status: booking.status,
      certificate_enabled: isCertificateEnabledForEvent(booking.event?.metadata as Record<string, unknown> | undefined),
    })),
  ];

  const unique = new Map<string, ParticipationRecord>();
  for (const record of normalized) {
    if (!unique.has(record.event_id)) unique.set(record.event_id, record);
  }

  return [...unique.values()].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
}

export async function getParticipationHistoryForOrganizer(organizerId: string): Promise<ParticipationRecord[]> {
  if (!organizerId) return [];

  const { data: organizerEvents, error: eventError } = await supabase
    .from("events")
    .select("id, title, starts_at, metadata, organizer_id")
    .eq("organizer_id", organizerId);

  if (eventError) {
    console.error("Failed to load organizer events for participation summary:", eventError.message);
    return [];
  }

  const eventIds = (organizerEvents ?? []).map((event) => event.id);
  if (!eventIds.length) return [];

  const [bookingRes, manualRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, user_id, event_id, status, created_at, user:profiles(full_name, email), event:events(id, title, starts_at, ends_at, metadata)")
      .in("event_id", eventIds)
      .eq("status", "confirmed"),
    supabase
      .from("manual_ticket_requests")
      .select("id, user_id, event_id, status, created_at, event_title, approved_at, user:profiles(full_name, email), event:events(id, title, starts_at, ends_at, metadata)")
      .in("event_id", eventIds)
      .eq("status", "confirmed"),
  ]);

  const bookings = (bookingRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    event_id: string;
    status: string;
    created_at: string;
    user?: { full_name?: string; email?: string };
    event?: { id?: string; title?: string; starts_at?: string; ends_at?: string; metadata?: Record<string, unknown> };
  }>;

  const manualBookings = (manualRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    event_id: string;
    status: string;
    created_at: string;
    event_title?: string;
    approved_at?: string;
    user?: { full_name?: string; email?: string };
    event?: { id?: string; title?: string; starts_at?: string; ends_at?: string; metadata?: Record<string, unknown> };
  }>;

  const normalized = [
    ...bookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      event_title: booking.event?.title || "Event",
      event_date: booking.event?.starts_at || booking.created_at,
      recorded_at: booking.created_at,
      status: booking.status,
      certificate_enabled: isCertificateEnabledForEvent(booking.event?.metadata as Record<string, unknown> | undefined),
      attendee_name: booking.user?.full_name || "Attendee",
      attendee_email: booking.user?.email || "",
    })),
    ...manualBookings.map((booking) => ({
      id: booking.id,
      user_id: booking.user_id,
      event_id: booking.event_id,
      event_title: booking.event?.title || booking.event_title || "Event",
      event_date: booking.approved_at || booking.created_at,
      recorded_at: booking.approved_at || booking.created_at,
      status: booking.status,
      certificate_enabled: isCertificateEnabledForEvent(booking.event?.metadata as Record<string, unknown> | undefined),
      attendee_name: booking.user?.full_name || "Attendee",
      attendee_email: booking.user?.email || "",
    })),
  ];

  const unique = new Map<string, ParticipationRecord>();
  for (const record of normalized) {
    const key = `${record.event_id}:${record.user_id}`;
    if (!unique.has(key)) unique.set(key, record);
  }

  return [...unique.values()].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
}

export async function canIssueCertificateForEvent(userId: string, eventId: string): Promise<boolean> {
  const records = await getParticipationHistoryForUser(userId);
  return records.some(
    (record) => record.event_id === eventId && record.status === "confirmed" && record.certificate_enabled
  );
}
