import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createManualBooking,
  approveManualBooking,
  getManualBookingsForUser,
  mergeUserBookings,
} from "@/lib/manual-bookings";
import { hasConfirmedBookingForUser } from "@/store/api/bookingsApi";

const { fromMock, authMock, insertMock, selectMock, updateMock, eqMock, orderMock, singleMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  authMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  orderMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: authMock,
    },
    from: fromMock,
  },
}));

describe("manual ticket requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      const buildQueryChain = (data: any) => ({
        eq: () => buildQueryChain(data),
        order: async () => ({
          data: [{
            id: "manual-1",
            user_id: "user-1",
            event_id: "event-1",
            event_title: "Test event",
            ticket_name: "VIP",
            ticket_number: "TKT-ABC123",
            payment_reference: "PAY-XYZ789",
            total_amount: 85,
            currency: "USD",
            quantity: 1,
            payment_method: "Bank transfer",
            contact_details: "+123456",
            payment_proof: "https://proof.example/1",
            receipt_note: "Paid",
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
          error: null,
        }),
        maybeSingle: async () => ({ data, error: null }),
      });

      const queryResult = buildQueryChain(
        table === "manual_ticket_requests"
          ? { id: "manual-1", user_id: "user-1", event_id: "event-1", status: "confirmed" }
          : null
      );

      return {
        insert: insertMock,
        select: () => queryResult,
        update: updateMock,
        eq: eqMock,
        order: orderMock,
        single: singleMock,
      };
    });

    insertMock.mockReturnValue({
      select: () => ({
        data: [{
          id: "manual-1",
          ticket_number: "TKT-ABC123",
          payment_reference: "PAY-XYZ789",
          status: "pending",
        }],
        error: null,
      }),
    });


    eqMock.mockImplementation(() => ({
      order: orderMock,
      select: () => ({
        data: [{
          id: "manual-1",
          status: "confirmed",
          approved_by: "organizer-1",
        }],
        error: null,
      }),
      eq: () => ({
        maybeSingle: async () => ({
          data: { id: "manual-1", user_id: "user-1", event_id: "event-1", status: "confirmed" },
          error: null,
        }),
      }),
    }));

    orderMock.mockResolvedValue({
      data: [{
        id: "manual-1",
        user_id: "user-1",
        event_id: "event-1",
        event_title: "Test event",
        ticket_name: "VIP",
        ticket_number: "TKT-ABC123",
        payment_reference: "PAY-XYZ789",
        total_amount: 85,
        currency: "USD",
        quantity: 1,
        payment_method: "Bank transfer",
        contact_details: "+123456",
        payment_proof: "https://proof.example/1",
        receipt_note: "Paid",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }],
      error: null,
    });

    updateMock.mockReturnValue({
      eq: () => ({
        select: () => ({
          data: [{
            id: "manual-1",
            status: "confirmed",
            approved_by: "organizer-1",
          }],
          error: null,
        }),
      }),
    });
  });

  it("stores a payment request in the manual_ticket_requests table", async () => {
    const booking = await createManualBooking({
      user_id: "user-1",
      event_id: "event-1",
      event_title: "Test event",
      ticket_name: "VIP",
      total_amount: 85,
      payment_method: "Bank transfer",
      contact_details: "+123456",
      payment_proof: "https://proof.example/1",
      quantity: 1,
    });

    expect(fromMock).toHaveBeenCalledWith("manual_ticket_requests");
    expect(insertMock).toHaveBeenCalled();
    expect(booking.ticket_number).toBeTruthy();
  });

  it("loads and approves manual payment requests from Supabase", async () => {
    const records = await getManualBookingsForUser("user-1");
    expect(records.length).toBeGreaterThanOrEqual(1);

    const approved = await approveManualBooking("manual-1", "organizer-1");
    expect(approved?.status).toBe("confirmed");
  });

  it("treats an approved manual ticket as a confirmed booking for stream access", async () => {
    const result = await hasConfirmedBookingForUser("event-1");
    expect(result).toBe(true);
    expect(fromMock).toHaveBeenCalledWith("bookings");
    expect(fromMock).toHaveBeenCalledWith("manual_ticket_requests");
  });

  it("merges approved and pending manual bookings with regular bookings for analytics", () => {
    const merged = mergeUserBookings(
      [
        { id: "booking-1", status: "confirmed", total_amount: 100, event: { title: "Standard booking" } },
        { id: "booking-2", status: "pending", total_amount: 50, event: { title: "Pending booking" } },
      ],
      [
        {
          id: "manual-1",
          user_id: "user-1",
          event_id: "event-2",
          event_title: "Manual approved booking",
          ticket_name: "VIP",
          ticket_number: "TKT-2",
          payment_reference: "PAY-2",
          status: "confirmed",
          total_amount: 90,
          currency: "USD",
          quantity: 1,
          payment_method: "Bank transfer",
          contact_details: "+1234",
          payment_proof: "https://example.com/proof",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ]
    );

    expect(merged).toHaveLength(3);
    expect(merged.filter((entry) => entry.status === "confirmed")).toHaveLength(2);
  });
});
