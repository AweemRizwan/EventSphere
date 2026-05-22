import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useGetLiveEventsQuery } from "@/store/api/eventsApi";
import { formatDate } from "@/lib/utils";

export default function LiveEventsPage() {
  const { data: events = [], isLoading } = useGetLiveEventsQuery();

  return (
    <div>
      <PageHeader
        title="Live Events"
        description="Campus streams happening right now"
      />
      {isLoading ? (
        <LoadingSpinner className="py-16" />
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">No live streams at the moment.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}/stream`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <Badge className="bg-red-600">
                    <Radio className="w-3 h-3 mr-1" /> LIVE
                  </Badge>
                  <h3 className="font-semibold">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(event.starts_at)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
