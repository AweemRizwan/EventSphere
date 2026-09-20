import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "@/lib/supabase";
import type { Booking } from "@/types";

export async function hasConfirmedBookingForUser(eventId: string, userIdOverride?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  const activeUserId = userIdOverride ?? user?.id;

  if (!activeUserId) return false;

  const [bookingResult, manualResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .eq("user_id", activeUserId)
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .maybeSingle(),
    supabase
      .from("manual_ticket_requests")
      .select("id")
      .eq("user_id", activeUserId)
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .maybeSingle(),
  ]);

  if (bookingResult.error) throw new Error(bookingResult.error.message);
  if (manualResult.error) throw new Error(manualResult.error.message);

  return !!bookingResult.data || !!manualResult.data;
}

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
        try {
          const data = await hasConfirmedBookingForUser(eventId);
          return { data };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Unable to check confirmed booking." };
        }
      },
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useHasConfirmedBookingQuery,
} = bookingsApi;
