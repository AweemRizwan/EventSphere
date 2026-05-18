import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ticket, Calendar, Globe, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AttendeeDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [bookings, setBookings] = useState<{ id: string; status: string; total_amount: number; created_at: string; event?: { title: string; starts_at: string } }[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; starts_at: string; venue: string; banner_url: string; is_online: boolean }[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [bookRes, eventsRes] = await Promise.all([
        supabase.from("bookings").select("id, status, total_amount, created_at, event:events(title, starts_at)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("events").select("id, title, starts_at, venue, banner_url, is_online").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(6),
      ]);
      if (bookRes.data) setBookings(bookRes.data as unknown as typeof bookings);
      if (eventsRes.data) setUpcomingEvents(eventsRes.data);
    }
    load();
  }, [user]);

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.full_name?.split(" ")[0] || "there"}!`}
        description="Discover amazing events happening near you"
        action={
          <Button asChild>
            <Link to="/events"><Globe className="w-4 h-4 mr-2" /> Browse Events</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="My Bookings" value={bookings.length} icon={Ticket} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" delay={0} />
        <StatCard title="Confirmed Tickets" value={confirmed} icon={Calendar} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" delay={0.05} />
        <StatCard title="Events Attended" value={bookings.filter((b) => b.status === "confirmed").length} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" delay={0.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/events">Browse all</Link></Button>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.starts_at)} · {event.is_online ? "Online" : event.venue}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">My Bookings</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/attendee/bookings">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-3">No bookings yet</p>
                  <Button size="sm" asChild><Link to="/events">Find Events</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{b.event?.title || "Event"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(b.created_at)} · {formatCurrency(b.total_amount)}</p>
                      </div>
                      <Badge variant={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
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
