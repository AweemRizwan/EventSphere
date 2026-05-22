import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Radio, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ChatPanel from "@/modules/chat/ChatPanel";
import {
  useGetEventByIdQuery,
} from "@/store/api/eventsApi";
import {
  useGetStreamSessionQuery,
  useGetPlaybackUrlQuery,
  useStartStreamMutation,
  useEndStreamMutation,
} from "@/store/api/streamsApi";
import { useHasConfirmedBookingQuery } from "@/store/api/bookingsApi";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/permissions";
import { logEngagement } from "@/lib/engagement";
import toast from "react-hot-toast";

export default function StreamPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const { data: event, isLoading: eventLoading } = useGetEventByIdQuery(eventId!, {
    skip: !eventId,
  });
  const { data: session } = useGetStreamSessionQuery(eventId!, { skip: !eventId });
  const { data: playback } = useGetPlaybackUrlQuery(eventId!, { skip: !eventId });
  const { data: hasBooking } = useHasConfirmedBookingQuery(eventId!, { skip: !eventId });

  const [startStream, { isLoading: starting }] = useStartStreamMutation();
  const [endStream, { isLoading: ending }] = useEndStreamMutation();

  const canModerate = hasPermission(user?.role, "streams:start");
  const canJoin =
    canModerate ||
    hasBooking ||
    !event?.ticket_tiers?.length;

  const playbackUrl = playback?.playback_url || event?.stream_url;
  const isLive = session?.status === "live" || playback?.status === "live";

  useEffect(() => {
    if (eventId && canJoin && isLive) {
      logEngagement(eventId, "join_stream");
      return () => {
        logEngagement(eventId, "leave_stream");
      };
    }
  }, [eventId, canJoin, isLive]);

  if (eventLoading || !eventId) return <LoadingSpinner className="py-20" size="lg" />;
  if (!event) return <div className="text-center py-20">Event not found</div>;

  if (!canJoin) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <p className="text-muted-foreground">Book a ticket to join this live stream.</p>
        <Link to={`/events/${eventId}`}>
          <Button>View event & book</Button>
        </Link>
      </div>
    );
  }

  const handleStart = async () => {
    try {
      await startStream({ eventId }).unwrap();
      toast.success("Stream started");
    } catch {
      toast.error("Could not start stream. Is the API server running?");
    }
  };

  const handleEnd = async () => {
    try {
      await endStream(eventId).unwrap();
      toast.success("Stream ended");
    } catch {
      toast.error("Failed to end stream");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <PageHeader
        title={event.title}
        description="Live campus stream"
        action={
          <div className="flex items-center gap-2">
            {isLive ? (
              <Badge className="bg-red-600 animate-pulse">
                <Radio className="w-3 h-3 mr-1" /> LIVE
              </Badge>
            ) : (
              <Badge variant="secondary">Offline</Badge>
            )}
            {canModerate && (
              <>
                {!isLive ? (
                  <Button size="sm" onClick={handleStart} disabled={starting}>
                    Go Live
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={handleEnd} disabled={ending}>
                    End Stream
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
            {playbackUrl && isLive ? (
              <iframe
                title="Live stream"
                src={playbackUrl.includes("youtube")
                  ? playbackUrl.replace("watch?v=", "embed/").split("&")[0]
                  : playbackUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-slate-400 text-center p-8">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Stream not live yet</p>
                {canModerate && <p className="text-sm mt-1">Click Go Live when ready</p>}
              </div>
            )}
          </div>
        </div>
        <div className="h-[480px]">
          <ChatPanel eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
