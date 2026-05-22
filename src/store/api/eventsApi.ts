import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  normalizeEvent,
  normalizeEvents,
  insertEventAdaptive,
  updateEventAdaptive,
  type EventFormInput,
} from "@/lib/events";
import { supabase } from "@/lib/supabase";
import type { Category, Event, EventStatus, Speaker, EventSchedule } from "@/types";

export interface EventsListParams {
  search?: string;
  categoryId?: string;
  eventType?: "all" | "online" | "offline";
  status?: string;
  /** When true, returns events in any status (admin). */
  allStatuses?: boolean;
  organizerId?: string;
  upcomingOnly?: boolean;
  limit?: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Event", "Events", "Categories"],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], boolean | void>({
      queryFn: async (activeOnly = true) => {
        let query = supabase.from("categories").select("*").order("name");
        if (activeOnly !== false) query = query.eq("is_active", true);
        const { data, error } = await query;
        if (error) return { error: error.message };
        return { data: data as Category[] };
      },
      providesTags: ["Categories"],
    }),

    getEvents: builder.query<Event[], EventsListParams | void>({
      queryFn: async (params) => {
        const p = params ?? {};
        let query = supabase
          .from("events")
          .select(
            "*, organizer:profiles(full_name, avatar_url), category:categories(name, color), ticket_tiers(price, quantity, sold, is_active)"
          )
          .order("starts_at");

        if (p.status) query = query.eq("status", p.status);
        else if (!p.allStatuses) query = query.eq("status", "published");

        if (p.upcomingOnly) {
          query = query.gte("starts_at", new Date().toISOString());
        }

        if (p.organizerId) query = query.eq("organizer_id", p.organizerId);
        if (p.categoryId && p.categoryId !== "all") query = query.eq("category_id", p.categoryId);
        if (p.eventType === "online") query = query.eq("is_online", true);
        if (p.eventType === "offline") query = query.eq("is_online", false);
        if (p.search) query = query.ilike("title", `%${p.search}%`);

        const { data, error } = await query.limit(p.limit ?? 20);
        if (error) return { error: error.message };
        return { data: normalizeEvents((data ?? []) as Record<string, unknown>[]) };
      },
      providesTags: (result) =>
        result
          ? [...result.map((e) => ({ type: "Event" as const, id: e.id })), { type: "Events", id: "LIST" }]
          : [{ type: "Events", id: "LIST" }],
    }),

    getLiveEvents: builder.query<Event[], void>({
      queryFn: async () => {
        const { data: sessions } = await supabase
          .from("stream_sessions")
          .select("event_id")
          .eq("status", "live");

        const ids = (sessions ?? []).map((s: { event_id: string }) => s.event_id);
        if (!ids.length) return { data: [] };

        const { data, error } = await supabase
          .from("events")
          .select("*, category:categories(name, color), ticket_tiers(price)")
          .in("id", ids);
        if (error) return { error: error.message };
        return { data: normalizeEvents((data ?? []) as Record<string, unknown>[]) };
      },
      providesTags: [{ type: "Events", id: "LIVE" }],
    }),

    getEventById: builder.query<Event | null, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from("events")
          .select(
            "*, organizer:profiles(full_name, avatar_url, bio), category:categories(name, color), ticket_tiers(*)"
          )
          .eq("id", id)
          .maybeSingle();
        if (error) return { error: error.message };
        return { data: data ? normalizeEvent(data as Record<string, unknown>) : null };
      },
      providesTags: (_r, _e, id) => [{ type: "Event", id }],
    }),

    getEventExtras: builder.query<
      { speakers: Speaker[]; schedules: EventSchedule[] },
      string
    >({
      queryFn: async (eventId) => {
        const [spRes, schRes] = await Promise.all([
          supabase.from("event_speakers").select("speaker:speakers(*)").eq("event_id", eventId),
          supabase.from("event_schedules").select("*").eq("event_id", eventId).order("starts_at"),
        ]);
        if (spRes.error) return { error: spRes.error.message };
        if (schRes.error) return { error: schRes.error.message };

        const speakers = (spRes.data ?? [])
          .map((row) => (row as { speaker: Speaker | Speaker[] }).speaker)
          .flat()
          .filter((s): s is Speaker => Boolean(s) && typeof s === "object" && "id" in s);

        return { data: { speakers, schedules: (schRes.data ?? []) as EventSchedule[] } };
      },
    }),

    createEvent: builder.mutation<
      { id: string },
      { data: EventFormInput; organizerId: string; slug: string }
    >({
      queryFn: async ({ data, organizerId, slug }) => {
        try {
          const event = await insertEventAdaptive(supabase, data, organizerId, slug);
          return { data: event };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    updateEvent: builder.mutation<
      { id: string },
      {
        data: EventFormInput;
        organizerId: string;
        slug: string;
        eventId: string;
        status: EventStatus;
      }
    >({
      queryFn: async ({ data, organizerId, slug, eventId, status }) => {
        try {
          const event = await updateEventAdaptive(
            supabase,
            data,
            organizerId,
            slug,
            eventId,
            status
          );
          return { data: event };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      invalidatesTags: (_r, _e, { eventId }) => [
        { type: "Event", id: eventId },
        { type: "Events", id: "LIST" },
      ],
    }),

    updateEventStatus: builder.mutation<void, { id: string; status: EventStatus }>({
      queryFn: async ({ id, status }) => {
        const { error } = await supabase.from("events").update({ status }).eq("id", id);
        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Event", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    deleteEvent: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from("events").delete().eq("id", id);
        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    upsertCategory: builder.mutation<Category, { id?: string; data: CategoryInput }>({
      queryFn: async ({ id, data }) => {
        const row = {
          name: data.name,
          slug: data.slug,
          description: data.description ?? "",
          icon: data.icon ?? "tag",
          color: data.color ?? "#3B82F6",
          is_active: data.is_active ?? true,
        };
        const result = id
          ? await supabase.from("categories").update(row).eq("id", id).select().single()
          : await supabase.from("categories").insert(row).select().single();
        if (result.error) return { error: result.error.message };
        return { data: result.data as Category };
      },
      invalidatesTags: ["Categories"],
    }),

    deleteCategory: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) return { error: error.message };
        return { data: undefined };
      },
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetEventsQuery,
  useGetLiveEventsQuery,
  useGetEventByIdQuery,
  useGetEventExtrasQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventStatusMutation,
  useDeleteEventMutation,
  useUpsertCategoryMutation,
  useDeleteCategoryMutation,
} = eventsApi;
