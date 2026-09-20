import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Ticket, DollarSign, CirclePlus as PlusCircle, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import { useGetEventsQuery } from "@/store/api/eventsApi";
import { formatCurrency, formatDate } from "@/lib/utils";

const ticketData = [
  { day: "Mon", sold: 12 }, { day: "Tue", sold: 28 }, { day: "Wed", sold: 18 },
  { day: "Thu", sold: 35 }, { day: "Fri", sold: 42 }, { day: "Sat", sold: 56 }, { day: "Sun", sold: 38 },
];

export default function OrganizerDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: events = [] } = useGetEventsQuery(
    { organizerId: user?.id, allStatuses: true, limit: 100 },
    { skip: !user?.id }
  );
  const [manualBookings, setManualBookings] = useState<{ id: string; event_id: string; total_amount: number; status: string }[]>([]);

  useEffect(() => {
    if (!user?.id || events.length === 0) {
      setManualBookings([]);
      return;
    }

    let isMounted = true;

    const loadManualBookings = async () => {
      const { data } = await supabase.from("manual_ticket_requests").select("id, event_id, total_amount, status");
      if (isMounted && data) {
        setManualBookings(data as typeof manualBookings);
      }
    };

    void loadManualBookings();
    return () => {
      isMounted = false;
    };
  }, [user?.id, events.length]);

  const organizerEventIds = useMemo(() => new Set(events.map((event) => event.id)), [events]);
  const confirmedManualBookings = useMemo(
    () => manualBookings.filter((booking) => organizerEventIds.has(booking.event_id) && booking.status === "confirmed"),
    [manualBookings, organizerEventIds]
  );

  const upcoming = events.filter((e) => e.starts_at && new Date(e.starts_at) > new Date()).length;
  const sold = events.reduce(
    (sum, e) => sum + (e.ticket_tiers?.reduce((s, t) => s + t.sold, 0) ?? 0),
    0
  ) + confirmedManualBookings.length;
  const revenue = events.reduce((sum, e) => {
    const tierRev =
      e.ticket_tiers?.reduce((s, t) => s + t.sold * t.price, 0) ?? 0;
    return sum + tierRev;
  }, 0) + confirmedManualBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name || "Organizer"}!`}
        description="Here's what's happening with your events"
        action={
          <Button asChild>
            <Link to="/organizer/events/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Create Event
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Events" value={events.length} icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" delay={0} />
        <StatCard title="Tickets Sold" value={sold} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" delay={0.05} />
        <StatCard title="Est. Revenue" value={formatCurrency(revenue)} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" delay={0.1} />
        <StatCard title="Upcoming Events" value={upcoming} icon={Ticket} iconColor="text-rose-600" iconBg="bg-rose-100 dark:bg-rose-900/30" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Ticket Sales (This Week)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ticketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/organizer/events">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No events yet</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <Link
                      key={event.id}
                      to={`/organizer/events/${event.id}/edit`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.starts_at ? formatDate(event.starts_at) : "Date TBD"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize flex-shrink-0 ml-2">
                        {event.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
