import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, CircleCheck as CheckCircle, Circle as XCircle, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";
import toast from "react-hot-toast";

export default function AdminEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      let query = supabase.from("events")
        .select("*, organizer:profiles(full_name), category:categories(name)")
        .order("created_at", { ascending: false });
      if (search) query = query.ilike("title", `%${search}%`);
      const { data } = await query.limit(50);
      if (data) setEvents(data as unknown as Event[]);
      setLoading(false);
    }
    load();
  }, [search]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Event ${status}`);
      setEvents(events.map((e) => e.id === id ? { ...e, status: status as Event["status"] } : e));
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Event deleted"); setEvents(events.filter((e) => e.id !== id)); }
  };

  const statusColor: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
    published: "success", pending: "warning", draft: "secondary", cancelled: "destructive"
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;

  return (
    <div>
      <PageHeader title="Manage Events" description={`${events.length} total events`} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-semibold">All Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Organizer</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <motion.tr key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[200px]">
                      <p className="truncate">{event.title}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{event.organizer?.full_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{event.category?.name || "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(event.starts_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColor[event.status] || "secondary"}>{event.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/events/${event.id}`)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {event.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => updateStatus(event.id, "published")} title="Approve">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => updateStatus(event.id, "cancelled")} title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
