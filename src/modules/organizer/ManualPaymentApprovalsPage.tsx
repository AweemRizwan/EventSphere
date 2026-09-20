import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, UserRound } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { approveManualBooking, getAllManualBookings, type ManualBookingRecord } from "@/lib/manual-bookings";
import { formatCurrency } from "@/lib/utils";

export default function ManualPaymentApprovalsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [bookings, setBookings] = useState<ManualBookingRecord[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      const allBookings = await getAllManualBookings();
      if (isMounted) {
        setBookings(allBookings);
      }
    };

    void loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings]
  );

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "confirmed"),
    [bookings]
  );

  const handleApprove = async (bookingId: string) => {
    if (!user?.full_name) return;
    const updated = await approveManualBooking(bookingId, user.full_name);
    if (updated) {
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? updated : booking)));
    }
  };

  const renderBookingCard = (booking: ManualBookingRecord, isApproved: boolean) => (
    <Card key={booking.id}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">{booking.event_title}</CardTitle>
          <Badge variant={isApproved ? "default" : "secondary"} className="flex items-center gap-1">
            {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {isApproved ? "Approved" : "Pending review"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <p className="text-muted-foreground">Attendee</p>
            <p className="font-medium">{booking.contact_details}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ticket</p>
            <p className="font-medium">{booking.ticket_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Booked ticket number</p>
            <p className="font-mono">{booking.ticket_number}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment reference</p>
            <p className="font-mono">{booking.payment_reference}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-medium">{formatCurrency(booking.total_amount, booking.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment method</p>
            <p className="font-medium">{booking.payment_method}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground mb-2">Receipt / payment proof</p>
          {booking.payment_proof ? (
            <a
              href={booking.payment_proof}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline break-all"
            >
              {booking.payment_proof}
            </a>
          ) : (
            <p className="text-sm">No receipt link provided.</p>
          )}
        </div>

        {!isApproved && (
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Submitted by {booking.contact_details}
            </div>
            <Button onClick={() => handleApprove(booking.id)} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Approve payment
            </Button>
          </div>
        )}

        {isApproved && (
          <div className="flex items-center justify-between gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Approved by {booking.approved_by || "organizer"}
            </div>
            <span>{booking.approved_at ? new Date(booking.approved_at).toLocaleDateString() : "Approved"}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Manual payment approvals"
        description="Review payment proof and approve tickets after verification."
      />

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No payment submissions yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingBookings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Pending review</h3>
              {pendingBookings.map((booking) => renderBookingCard(booking, false))}
            </div>
          )}

          {approvedBookings.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Approved records</h3>
              {approvedBookings.map((booking) => renderBookingCard(booking, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
