import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useGetMyBookingsQuery } from "@/store/api/bookingsApi";
import { useAppSelector } from "@/store/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getManualBookingsForUser, mergeUserBookings } from "@/lib/manual-bookings";

export default function AttendeeBookingsPage() {
  const { data: bookings = [], isLoading } = useGetMyBookingsQuery();
  const user = useAppSelector((state) => state.auth.user);
  const [manualBookings, setManualBookings] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadManualBookings = async () => {
      if (!user?.id) {
        if (isMounted) setManualBookings([]);
        return;
      }

      const records = await getManualBookingsForUser(user.id);
      if (isMounted) setManualBookings(records);
    };

    void loadManualBookings();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const mergedBookings = mergeUserBookings(bookings, manualBookings);

  return (
    <div>
      <PageHeader title="My Bookings" description="Your event registrations and ticket payment status" />
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : mergedBookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No bookings yet.</p>
          <Link to="/events">
            <Button className="mt-4">Browse events</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mergedBookings.map((b) => {
            const normalizedStatus = b.status === "confirmed" ? "confirmed" : "pending";
            const isApproved = normalizedStatus === "confirmed";

            return (
              <Card key={b.id}>
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{b.event?.title ?? "Event"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {b.event?.starts_at ? formatDate(b.event.starts_at) : "Manual ticket request"}
                    </p>
                    <p className="text-sm mt-1">
                      {formatCurrency(b.total_amount)} · {isApproved ? "Approved" : "Pending approval"}
                    </p>
                    {"ticket_number" in b && b.ticket_number && (
                      <p className="text-xs text-muted-foreground mt-1">Ticket number: {b.ticket_number}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isApproved ? "default" : "secondary"}>
                      {isApproved ? "Approved" : "Pending approval"}
                    </Badge>
                    {isApproved && b.event?.id && (
                      <Link to={`/events/${b.event.id}/stream`}>
                        <Button size="sm" variant="outline">
                          <Radio className="w-4 h-4 mr-1" /> Join stream
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
