import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CreditCard as Edit2, Trash2, Eye, Calendar, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useGetEventsQuery, useDeleteEventMutation } from "@/store/api/eventsApi";
import { useAppSelector } from "@/store/hooks";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function OrganizerEventsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const { data: events = [], isLoading, currentData } = useGetEventsQuery(
    { organizerId: user?.id, allStatuses: true, limit: 100 },
    { skip: !user?.id }
  );
  const showLoading = isLoading && !currentData;
  const [deleteEvent] = useDeleteEventMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id).unwrap();
      toast.success("Event deleted");
    } catch (e) {
      toast.error((e as Error).message || "Delete failed");
    }
  };

  const statusColor: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    published: "success",
    pending: "warning",
    draft: "secondary",
    cancelled: "destructive",
    completed: "success",
  };

  if (showLoading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <PageHeader
        title="My Events"
        description="Manage your events"
        action={
          <Button asChild>
            <Link to="/organizer/events/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No events yet</p>
          <Button asChild>
            <Link to="/organizer/events/new">Create your first event</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-600 to-cyan-500 relative">
                  {event.banner_url && (
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={statusColor[event.status] || "secondary"}>{event.status}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-1">{event.title}</h3>
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.starts_at ? formatDate(event.starts_at) : "Date TBD"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.ticket_tiers?.reduce((s, t) => s + t.sold, 0) || 0} / {event.capacity || "∞"}{" "}
                      attendees
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
