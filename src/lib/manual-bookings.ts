import { supabase } from "@/lib/supabase";

export type ManualBookingStatus = "pending" | "confirmed" | "cancelled";

export interface ManualBookingRecord {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string;
  ticket_name: string;
  ticket_number: string;
  payment_reference: string;
  status: ManualBookingStatus;
  total_amount: number;
  currency: string;
  quantity: number;
  payment_method: string;
  contact_details: string;
  payment_proof: string;
  receipt_note?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
}

const TABLE_NAME = "manual_ticket_requests";

function buildReference(prefix = "TKT") {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export function mergeUserBookings(bookings: any[], manualBookings: ManualBookingRecord[]) {
  return [
    ...manualBookings.map((booking) => ({
      id: booking.id,
      event: {
        id: booking.event_id,
        title: booking.event_title,
        starts_at: booking.created_at,
      },
      total_amount: booking.total_amount,
      status: booking.status,
      ticket_number: booking.ticket_number,
      payment_reference: booking.payment_reference,
      payment_status_label: booking.status === "confirmed" ? "Approved" : "Pending approval",
    })),
    ...bookings,
  ];
}

export async function getManualBookingsForUser(userId: string): Promise<ManualBookingRecord[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load manual ticket requests for user:", error.message);
    return [];
  }

  return (data ?? []) as ManualBookingRecord[];
}

export async function getAllManualBookings(): Promise<ManualBookingRecord[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch manual ticket requests:", error.message);
    return [];
  }

  return (data ?? []) as ManualBookingRecord[];
}

export async function createManualBooking(input: {
  user_id: string;
  event_id: string;
  event_title: string;
  ticket_name: string;
  total_amount: number;
  currency?: string;
  quantity: number;
  payment_method: string;
  contact_details: string;
  payment_proof: string;
  receipt_note?: string;
}): Promise<ManualBookingRecord> {
  const now = new Date().toISOString();
  const payload = {
    user_id: input.user_id,
    event_id: input.event_id,
    event_title: input.event_title,
    ticket_name: input.ticket_name,
    ticket_number: buildReference("TKT"),
    payment_reference: buildReference("PAY"),
    status: "pending" as const,
    total_amount: input.total_amount,
    currency: input.currency ?? "USD",
    quantity: Math.max(1, input.quantity),
    payment_method: input.payment_method,
    contact_details: input.contact_details,
    payment_proof: input.payment_proof,
    receipt_note: input.receipt_note ?? "",
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from(TABLE_NAME).insert([payload]).select();

  if (error) {
    throw new Error(error.message);
  }

  const record = Array.isArray(data) && data.length > 0 ? data[0] : payload;
  return record as ManualBookingRecord;
}

export async function approveManualBooking(
  bookingId: string,
  approvedBy: string
): Promise<ManualBookingRecord | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      status: "confirmed",
      approved_by: approvedBy,
      approved_at: now,
      updated_at: now,
    })
    .eq("id", bookingId)
    .select();

  if (error) {
    console.error("Failed to approve manual ticket request:", error.message);
    return null;
  }

  const record = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return record as ManualBookingRecord | null;
}
