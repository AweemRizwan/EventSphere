import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ListFilter as Filter, Calendar, MapPin, Users, Wifi, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Event, Category } from "@/types";

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [eventType, setEventType] = useState("all");

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("events")
        .select("*, organizer:profiles(full_name, avatar_url), category:categories(name, color), ticket_tiers(price, quantity, sold)")
        .eq("status", "published")
        .order("starts_at");

      if (category !== "all") query = query.eq("category_id", category);
      if (eventType === "online") query = query.eq("is_online", true);
      if (eventType === "offline") query = query.eq("is_online", false);
      if (search) query = query.ilike("title", `%${search}%`);

      const { data } = await query.limit(20);
      if (data) setEvents(data as unknown as Event[]);
      setLoading(false);
    }
    load();
  }, [search, category, eventType]);

  const getMinPrice = (event: Event) => {
    if (!event.ticket_tiers?.length) return 0;
    const active = event.ticket_tiers.filter((t) => t.is_active);
    if (!active.length) return 0;
    return Math.min(...active.map((t) => t.price));
  };

  return (
    <div>
      <PageHeader title="Browse Events" description="Discover amazing events happening around the world" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">In-Person</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No events found</p>
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
              <Link to={`/events/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative h-44 bg-gradient-to-br from-blue-600 to-cyan-500 overflow-hidden">
                    {event.banner_url ? (
                      <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1">
                      {event.is_online && <Badge className="bg-emerald-500 text-white border-0"><Wifi className="w-3 h-3 mr-1" />Online</Badge>}
                      {event.is_featured && <Badge className="bg-amber-500 text-white border-0">Featured</Badge>}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                      <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
                        {getMinPrice(event) === 0 ? "Free" : `From ${formatCurrency(getMinPrice(event))}`}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(event.starts_at)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.is_online ? "Online" : `${event.venue}${event.city ? `, ${event.city}` : ""}`}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {event.capacity > 0 ? `${event.capacity} capacity` : "Unlimited"}
                      </span>
                      <span className="text-xs text-blue-600 flex items-center gap-0.5 font-medium group-hover:gap-1.5 transition-all">
                        View details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
