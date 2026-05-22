import { Link } from "react-router-dom";
import { Ticket, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useGetMyBookingsQuery } from "@/store/api/bookingsApi";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AttendeeBookingsPage() {
  const { data: bookings = [], isLoading } = useGetMyBookingsQuery();

  return (
    <div>
      <PageHeader title="My Bookings" description="Your event registrations and tickets" />
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No bookings yet.</p>
          <Link to="/events">
            <Button className="mt-4">Browse events</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{b.event?.title ?? "Event"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {b.event?.starts_at ? formatDate(b.event.starts_at) : ""}
                  </p>
                  <p className="text-sm mt-1">{formatCurrency(b.total_amount)} · {b.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                    {b.status}
                  </Badge>
                  {b.status === "confirmed" && b.event?.id && (
                    <Link to={`/events/${b.event.id}/stream`}>
                      <Button size="sm" variant="outline">
                        <Radio className="w-4 h-4 mr-1" /> Join stream
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
