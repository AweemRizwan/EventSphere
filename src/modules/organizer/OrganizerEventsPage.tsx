import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CreditCard as Edit2, Trash2, Eye, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Event } from "@/types";
import toast from "react-hot-toast";

export default function OrganizerEventsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("*, category:categories(name, color), ticket_tiers(price, quantity, sold)")
        .eq("organizer_id", user!.id)
        .order("created_at", { ascending: false });
      if (data) setEvents(data as unknown as Event[]);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Event deleted"); setEvents(events.filter((e) => e.id !== id)); }
  };

  const statusColor: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    published: "success", pending: "warning", draft: "secondary", cancelled: "destructive", completed: "info" as "success"
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <PageHeader
        title="My Events"
        description="Manage your events"
        action={
          <Button asChild><Link to="/organizer/events/new"><Plus className="w-4 h-4 mr-2" />Create Event</Link></Button>
        }
      />

      {events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No events yet</p>
          <Button asChild><Link to="/organizer/events/new">Create your first event</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-blue-600 to-cyan-500 relative">
                  {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />}
                  <div className="absolute top-2 right-2">
                    <Badge variant={statusColor[event.status] || "secondary"}>{event.status}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-1">{event.title}</h3>
                  <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(event.starts_at)}</div>
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" />
                      {event.ticket_tiers?.reduce((s, t) => s + t.sold, 0) || 0} / {event.capacity || "∞"} attendees
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => navigate(`/events/${event.id}`)}>
                      <Eye className="w-3 h-3 mr-1" />View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => navigate(`/organizer/events/${event.id}/edit`)}>
                      <Edit2 className="w-3 h-3 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => handleDelete(event.id)}>
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
