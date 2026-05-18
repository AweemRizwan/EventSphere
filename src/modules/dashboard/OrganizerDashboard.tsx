import { useEffect, useState } from "react";
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
import { formatCurrency, formatDate } from "@/lib/utils";

const ticketData = [
  { day: "Mon", sold: 12 }, { day: "Tue", sold: 28 }, { day: "Wed", sold: 18 },
  { day: "Thu", sold: 35 }, { day: "Fri", sold: 42 }, { day: "Sat", sold: 56 }, { day: "Sun", sold: 38 },
];

export default function OrganizerDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [stats, setStats] = useState({ events: 0, attendees: 0, revenue: 0, upcoming: 0 });
  const [events, setEvents] = useState<{ id: string; title: string; status: string; starts_at: string; capacity: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: eventData, count } = await supabase.from("events").select("*", { count: "exact" }).eq("organizer_id", user!.id);
      const upcoming = (eventData || []).filter((e) => new Date(e.starts_at) > new Date()).length;
      const { data: bookings } = await supabase.from("bookings").select("total_amount, user_id").in("event_id", (eventData || []).map((e) => e.id));
      const revenue = (bookings || []).reduce((s, b) => s + (b.total_amount || 0), 0);
      setStats({ events: count || 0, attendees: bookings?.length || 0, revenue, upcoming });
      setEvents((eventData || []).slice(0, 5) as typeof events);
    }
    load();
  }, [user]);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.full_name || "Organizer"}!`}
        description="Here's what's happening with your events"
        action={
          <Button asChild>
            <Link to="/organizer/events/new"><PlusCircle className="w-4 h-4 mr-2" /> Create Event</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Events" value={stats.events} icon={Calendar} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" delay={0} />
        <StatCard title="Total Attendees" value={stats.attendees} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" delay={0.05} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" delay={0.1} />
        <StatCard title="Upcoming Events" value={stats.upcoming} icon={Ticket} iconColor="text-rose-600" iconBg="bg-rose-100 dark:bg-rose-900/30" delay={0.15} />
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
              <CardTitle className="text-base font-semibold">My Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/organizer/events">View all <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-3">No events yet</p>
                  <Button size="sm" asChild>
                    <Link to="/organizer/events/new">Create your first event</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.starts_at)}</p>
                      </div>
                      <Badge variant={event.status === "published" ? "success" : "secondary"}>{event.status}</Badge>
                    </div>
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
