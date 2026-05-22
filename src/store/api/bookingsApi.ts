import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/lib/supabase";
import type { Booking } from "@/types";

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Booking", "Bookings"],
  endpoints: (builder) => ({
    getMyBookings: builder.query<Booking[], void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: [] };

        const { data, error } = await supabase
          .from("bookings")
          .select("*, event:events(id, title, starts_at, banner_url, stream_url), booking_items(*, ticket_tier:ticket_tiers(name))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) return { error: error.message };
        return { data: data as unknown as Booking[] };
      },
      providesTags: [{ type: "Bookings", id: "MY" }],
    }),

    getBookingById: builder.query<Booking | null, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, event:events(*), booking_items(*, ticket_tier:ticket_tiers(*))")
          .eq("id", id)
          .maybeSingle();
        if (error) return { error: error.message };
        return { data: (data as unknown as Booking) ?? null };
      },
      providesTags: (_r, _e, id) => [{ type: "Booking", id }],
    }),

    hasConfirmedBooking: builder.query<boolean, string>({
      queryFn: async (eventId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: false };

        const { data, error } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .eq("status", "confirmed")
          .maybeSingle();
        if (error) return { error: error.message };
        return { data: !!data };
      },
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useHasConfirmedBookingQuery,
} = bookingsApi;
