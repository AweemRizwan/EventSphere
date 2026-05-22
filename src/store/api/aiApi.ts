import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { apiFetch } from "@/lib/api-client";
import { featureFlags } from "@/lib/feature-flags";
import type { AIInsight } from "@/types";

export const aiApi = createApi({
  reducerPath: "aiApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["AI"],
  endpoints: (builder) => ({
    getRecommendations: builder.query<AIInsight[], void>({
      queryFn: async () => {
        if (!featureFlags.aiInsights) return { data: [] };
        try {
          const data = await apiFetch<AIInsight[]>("/ai/recommendations");
          return { data };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      providesTags: ["AI"],
    }),

    getEventInsights: builder.query<AIInsight[], string>({
      queryFn: async (eventId) => {
        if (!featureFlags.aiInsights) return { data: [] };
        try {
          const data = await apiFetch<AIInsight[]>(`/ai/events/${eventId}/insights`);
          return { data };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
      providesTags: (_r, _e, eventId) => [{ type: "AI", id: eventId }],
    }),
  }),
});

export const { useGetRecommendationsQuery, useGetEventInsightsQuery } = aiApi;
