import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import type { StreamSession } from "@/types";

export const streamsApi = createApi({
  reducerPath: "streamsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Stream"],
  endpoints: (builder) => ({
    getStreamSession: builder.query<StreamSession | null, string>({
      queryFn: async (eventId) => {
        const { data, error } = await supabase
          .from("stream_sessions")
          .select("*")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return { error: error.message };
        return { data: (data as StreamSession) ?? null };
      },
      providesTags: (_r, _e, eventId) => [{ type: "Stream", id: eventId }],
    }),

    getPlaybackUrl: builder.query<{ playback_url: string; status: string }, string>({
      queryFn: async (eventId) => {
        try {
          return {
            data: await apiFetch<{ playback_url: string; status: string }>(
              `/streams/${eventId}/playback`
            ),
          };
        } catch (e) {
          const { data: event } = await supabase
            .from("events")
            .select("stream_url")
            .eq("id", eventId)
            .maybeSingle();
          if (event?.stream_url) {
            return { data: { playback_url: event.stream_url, status: "live" } };
          }
          return { error: (e as Error).message };
        }
      },
    }),

    startStream: builder.mutation<StreamSession, { eventId: string; provider?: string }>({
      queryFn: async ({ eventId, provider = "custom" }) => {
        try {
          const data = await apiFetch<StreamSession>(`/streams/${eventId}/start`, {
            method: "POST",
            body: JSON.stringify({ provider }),
          });
          return { data };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Stream", id: eventId }],
    }),

    endStream: builder.mutation<void, string>({
      queryFn: async (eventId) => {
        try {
          await apiFetch(`/streams/${eventId}/end`, { method: "POST" });
          return { data: undefined };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      invalidatesTags: (_r, _e, eventId) => [{ type: "Stream", id: eventId }],
    }),
  }),
});

export const {
  useGetStreamSessionQuery,
  useGetPlaybackUrlQuery,
  useStartStreamMutation,
  useEndStreamMutation,
} = streamsApi;
