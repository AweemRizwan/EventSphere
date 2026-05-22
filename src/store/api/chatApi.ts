import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Chat"],
  endpoints: (builder) => ({
    getChatMessages: builder.query<ChatMessage[], string>({
      queryFn: async (eventId) => {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*, user:profiles(full_name, avatar_url)")
          .eq("event_id", eventId)
          .eq("is_deleted", false)
          .order("created_at", { ascending: true })
          .limit(100);
        if (error) return { error: error.message };
        return { data: data as unknown as ChatMessage[] };
      },
      providesTags: (_r, _e, eventId) => [{ type: "Chat", id: eventId }],
    }),

    sendChatMessage: builder.mutation<
      ChatMessage,
      { eventId: string; message: string; type?: ChatMessage["type"] }
    >({
      queryFn: async ({ eventId, message, type = "text" }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const { data, error } = await supabase
          .from("chat_messages")
          .insert({ event_id: eventId, user_id: user.id, message, type })
          .select("*, user:profiles(full_name, avatar_url)")
          .single();
        if (error) return { error: error.message };
        return { data: data as unknown as ChatMessage };
      },
      invalidatesTags: (_r, _e, { eventId }) => [{ type: "Chat", id: eventId }],
    }),
  }),
});

export const { useGetChatMessagesQuery, useSendChatMessageMutation } = chatApi;
