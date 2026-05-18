import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Wifi, Clock, Tag, ArrowLeft, Share2, Star, ChevronRight, CircleCheck as CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { formatDatetime, formatCurrency, getInitials } from "@/lib/utils";
import type { Event, Speaker, EventSchedule } from "@/types";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [evRes, spRes, schRes] = await Promise.all([
        supabase.from("events").select("*, organizer:profiles(full_name, avatar_url, bio), category:categories(name, color), ticket_tiers(*)").eq("id", id).maybeSingle(),
        supabase.from("event_speakers").select("speaker:speakers(*)").eq("event_id", id),
        supabase.from("event_schedules").select("*").eq("event_id", id).order("starts_at"),
      ]);
      if (evRes.data) setEvent(evRes.data as unknown as Event);
      if (spRes.data) setSpeakers(spRes.data.map((s: { speaker: Speaker }) => s.speaker).filter(Boolean));
      if (schRes.data) setSchedules(schRes.data);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleBook = () => {
    if (!user) { navigate("/login"); return; }
    if (!selectedTier) { toast.error("Please select a ticket tier"); return; }
    navigate(`/checkout/${id}?tier=${selectedTier}`);
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!event) return <div className="text-center py-20 text-muted-foreground">Event not found</div>;

  const activeTiers = event.ticket_tiers?.filter((t) => t.is_active) || [];

  return (
    <div className="max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-500 mb-6">
        {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex gap-2 mb-2">
            {event.is_online && <Badge className="bg-emerald-500 text-white border-0"><Wifi className="w-3 h-3 mr-1" />Online</Badge>}
            {event.is_featured && <Badge className="bg-amber-500 text-white border-0"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
            {event.category && <Badge style={{ backgroundColor: event.category.color + "33", color: event.category.color, border: `1px solid ${event.category.color}` }}>{event.category.name}</Badge>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-display">{event.title}</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div><p className="text-xs text-muted-foreground">Starts</p><p className="font-medium">{formatDatetime(event.starts_at)}</p></div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <div><p className="text-xs text-muted-foreground">Ends</p><p className="font-medium">{formatDatetime(event.ends_at)}</p></div>
                </div>
                {!event.is_online && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{event.venue}{event.city && `, ${event.city}`}</p></div>
                  </div>
                )}
                {event.capacity > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div><p className="text-xs text-muted-foreground">Capacity</p><p className="font-medium">{event.capacity} attendees</p></div>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <h3 className="font-semibold mb-2">About this event</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              {event.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs"><Tag className="w-2.5 h-2.5 mr-1" />{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          {schedules.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Event Schedule</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div key={s.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                        <div className="w-0.5 h-full bg-border mt-1" />
                      </div>
                      <div className="pb-3">
                        <p className="text-xs text-muted-foreground">{formatDatetime(s.starts_at)}</p>
                        <p className="font-medium text-sm">{s.title}</p>
                        {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">Speakers</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {speakers.map((sp) => (
                    <div key={sp.id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={sp.avatar_url} />
                        <AvatarFallback>{getInitials(sp.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{sp.name}</p>
                        <p className="text-xs text-muted-foreground">{sp.title}{sp.company && ` @ ${sp.company}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ticket Sidebar */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="text-base font-semibold">Get Tickets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activeTiers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No tickets available</p>
              ) : (
                activeTiers.map((tier) => {
                  const available = tier.quantity - tier.sold;
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(isSelected ? null : tier.id)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${isSelected ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" : "border-border hover:border-blue-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{tier.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{available} left</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{tier.price === 0 ? "Free" : formatCurrency(tier.price)}</p>
                          {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto mt-0.5" />}
                        </div>
                      </div>
                      {tier.benefits?.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {tier.benefits.slice(0, 3).map((b, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })
              )}
              <Button className="w-full" onClick={handleBook} disabled={!selectedTier}>
                Book Now <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Share2 className="w-3 h-3 mr-2" /> Share Event
              </Button>
            </CardContent>
          </Card>

          {/* Organizer */}
          {event.organizer && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">Organized by</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={event.organizer.avatar_url} />
                    <AvatarFallback className="text-xs">{getInitials(event.organizer.full_name)}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{event.organizer.full_name}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
