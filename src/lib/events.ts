import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventStatus } from "@/types";

export interface OrganizerPaymentDetails {
  account_name: string;
  bank_name: string;
  account_number: string;
  wallet_number: string;
  currency: string;
  notes: string;
}

export interface EventFormInput {
  title: string;
  description: string;
  category_id?: string;
  banner_url?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  is_online: boolean;
  stream_url?: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  tags?: string;
  payment_details?: OrganizerPaymentDetails;
}

type EventRow = Record<string, unknown>;

const LOCATION_KEYS = ["venue", "address", "city", "country", "is_online", "stream_url"] as const;
const SCHEDULE_KEYS = ["starts_at", "ends_at"] as const;

function parseTags(tags?: string): string[] {
  if (!tags) return [];
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function toIsoDatetime(value: string): string {
  return new Date(value).toISOString();
}

/** Format ISO timestamp for `<input type="datetime-local" />`. */
export function toDatetimeLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function appendLocationToDescription(
  description: string,
  data: Pick<EventFormInput, "venue" | "address" | "city" | "country" | "is_online" | "stream_url">
): string {
  if (data.is_online && data.stream_url) {
    return `${description}\n\nOnline stream: ${data.stream_url}`;
  }
  const line = [data.venue, data.address, data.city, data.country].filter(Boolean).join(", ");
  if (!line) return description;
  return `${description}\n\nLocation: ${line}`;
}

export function appendScheduleToDescription(
  description: string,
  startsAt: string,
  endsAt: string
): string {
  const start = formatScheduleLabel(startsAt);
  const end = formatScheduleLabel(endsAt);
  return `${description}\n\nSchedule: ${start} – ${end}`;
}

function formatScheduleLabel(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildLocationMeta(data: EventFormInput) {
  return {
    venue: data.venue || "",
    address: data.address || "",
    city: data.city || "",
    country: data.country || "",
    is_online: data.is_online,
    stream_url: data.is_online ? (data.stream_url || "") : "",
  };
}

function buildScheduleMeta(data: EventFormInput) {
  return {
    starts_at: toIsoDatetime(data.starts_at),
    ends_at: toIsoDatetime(data.ends_at),
  };
}

/** Canonical insert/update row for EventSphere `events` table. */
export function buildEventRow(
  data: EventFormInput,
  organizerId: string,
  slug: string,
  status: EventStatus = "pending"
): EventRow {
  return {
    title: data.title,
    description: data.description,
    category_id: data.category_id || null,
    banner_url: data.banner_url || "",
    venue: data.venue || "",
    address: data.address || "",
    city: data.city || "",
    country: data.country || "",
    is_online: data.is_online,
    stream_url: data.is_online ? (data.stream_url || "") : "",
    starts_at: toIsoDatetime(data.starts_at),
    ends_at: toIsoDatetime(data.ends_at),
    capacity: data.capacity || 0,
    organizer_id: organizerId,
    slug,
    status,
    tags: parseTags(data.tags),
    metadata: {
      location: buildLocationMeta(data),
      schedule: buildScheduleMeta(data),
      payment_details: data.payment_details ?? {},
    },
  };
}

export function parseMissingColumn(message?: string | null): string | null {
  if (!message) return null;
  const match = message.match(/Could not find the '([^']+)' column/);
  return match?.[1] ?? null;
}

export function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "PGRST204" || (error?.message?.includes("schema cache") ?? false);
}

function stripColumn(row: EventRow, column: string): EventRow {
  const next = { ...row };
  delete next[column];
  return next;
}

function enrichAfterStrip(row: EventRow, column: string, data: EventFormInput): EventRow {
  let description = String(row.description ?? data.description);

  if (SCHEDULE_KEYS.includes(column as (typeof SCHEDULE_KEYS)[number])) {
    description = appendScheduleToDescription(description, data.starts_at, data.ends_at);
  }

  if (LOCATION_KEYS.includes(column as (typeof LOCATION_KEYS)[number])) {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    row = {
      ...row,
      description,
      metadata: { ...meta, location: buildLocationMeta(data) },
    };
    return row;
  }

  if (column === "metadata") {
    description = appendLocationToDescription(description, data);
    description = appendScheduleToDescription(description, data.starts_at, data.ends_at);
    const next = stripColumn({ ...row, description }, "metadata");
    return next;
  }

  return { ...row, description };
}

type EventsSupabaseClient = SupabaseClient;

async function writeEventAdaptive(
  supabase: EventsSupabaseClient,
  mode: "insert" | "update",
  data: EventFormInput,
  organizerId: string,
  slug: string,
  status: EventStatus,
  eventId?: string
): Promise<{ id: string }> {
  let row = buildEventRow(data, organizerId, slug, status);

  for (let attempt = 0; attempt < 40; attempt++) {
    const result =
      mode === "insert"
        ? await supabase.from("events").insert(row).select().single()
        : await supabase.from("events").update(row).eq("id", eventId!).select().single();

    if (!result.error && result.data) return result.data;

    const missing = parseMissingColumn(result.error?.message);
    if (!missing || !isMissingColumnError(result.error)) {
      throw new Error(result.error?.message ?? "Failed to save event");
    }

    row = enrichAfterStrip(stripColumn(row, missing), missing, data);
  }

  throw new Error("Failed to save event — database schema is missing required columns. Run supabase/migrations/20260522130000_events_complete_schema.sql in the Supabase SQL Editor.");
}

export function insertEventAdaptive(
  supabase: EventsSupabaseClient,
  data: EventFormInput,
  organizerId: string,
  slug: string
) {
  return writeEventAdaptive(supabase, "insert", data, organizerId, slug, "pending");
}

export function updateEventAdaptive(
  supabase: EventsSupabaseClient,
  data: EventFormInput,
  organizerId: string,
  slug: string,
  eventId: string,
  status: EventStatus
) {
  return writeEventAdaptive(supabase, "update", data, organizerId, slug, status, eventId);
}

/** Map DB row + metadata fallbacks to the app `Event` shape. */
export function normalizeEvent(row: EventRow): Event {
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const location = (meta.location as Record<string, unknown>) ?? {};
  const schedule = (meta.schedule as Record<string, unknown>) ?? {};

  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
  const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);

  return {
    id: str(row.id),
    organizer_id: str(row.organizer_id),
    category_id: (row.category_id as string | null) ?? null,
    title: str(row.title),
    slug: str(row.slug),
    description: str(row.description),
    banner_url: str(row.banner_url),
    thumbnail_url: str(row.thumbnail_url),
    venue: str(row.venue) || str(location.venue),
    address: str(row.address) || str(location.address),
    city: str(row.city) || str(location.city),
    country: str(row.country) || str(location.country),
    is_online: bool(row.is_online, bool(location.is_online)),
    stream_url: str(row.stream_url) || str(location.stream_url),
    starts_at: str(row.starts_at) || str(schedule.starts_at),
    ends_at: str(row.ends_at) || str(schedule.ends_at),
    capacity: num(row.capacity),
    status: (str(row.status, "draft") as EventStatus),
    is_featured: bool(row.is_featured),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    created_at: str(row.created_at),
    updated_at: str(row.updated_at),
    metadata: (meta as Event["metadata"]) ?? undefined,
    organizer: row.organizer as Event["organizer"],
    category: row.category as Event["category"],
    ticket_tiers: row.ticket_tiers as Event["ticket_tiers"],
  };
}

export function normalizeEvents(rows: EventRow[]): Event[] {
  return rows.map(normalizeEvent);
}
