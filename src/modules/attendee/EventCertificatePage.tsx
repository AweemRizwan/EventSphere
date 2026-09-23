import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetEventByIdQuery } from "@/store/api/eventsApi";
import { useAppSelector } from "@/store/hooks";
import { getParticipationHistoryForUser } from "@/lib/participation";

export default function EventCertificatePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: event, isLoading } = useGetEventByIdQuery(eventId || "", { skip: !eventId });
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    if (!eventId || !user?.id) return;
    void getParticipationHistoryForUser(user.id).then((records) => {
      setEligible(
        records.some(
          (record) => record.event_id === eventId && record.status === "confirmed" && record.certificate_enabled
        )
      );
    });
  }, [eventId, user?.id]);

  const certificate = useMemo(() => event?.metadata?.certificate ?? {}, [event]);

  if (!eventId || isLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading certificate…</div>;
  }

  if (!event || !eligible) {
    return (
      <div className="max-w-xl mx-auto py-20">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Award className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Certificate unavailable</h2>
            <p className="text-muted-foreground">
              This certificate is only available after your booking is confirmed and the event organizer has enabled certificate issuance.
            </p>
            <Button onClick={() => navigate(-1)}>Go back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const template = certificate.template || "classic";
  const bgStyle = certificate.background_url ? { backgroundImage: `url(${certificate.background_url})` } : undefined;

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Event Certificate</h1>
          <p className="text-sm text-muted-foreground">Issued for {event.title}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="w-4 h-4 mr-2" /> Save / Print
          </Button>
        </div>
      </div>

      <div className={`certificate-shell rounded-2xl border overflow-hidden ${template === "minimal" ? "bg-white" : "bg-slate-50"}`}>
        <div
          className={`certificate-preview min-h-[720px] relative p-8 md:p-12 ${template === "premium" ? "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white" : "bg-white text-slate-900"}`}
          style={bgStyle}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%)]" />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] opacity-75">EventSphere</div>
                <div className="mt-2 text-3xl font-bold">{certificate.title || "Certificate of Participation"}</div>
              </div>
              <Award className={`w-12 h-12 ${template === "premium" ? "text-amber-300" : "text-blue-600"}`} />
            </div>

            <div className="mt-10 text-center">
              <p className={`text-sm uppercase tracking-[0.3em] ${template === "premium" ? "text-slate-300" : "text-slate-500"}`}>
                {certificate.subtitle || "This is to certify that"}
              </p>
              <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-wide">{user?.full_name || "Participant"}</h2>
              <div className="mx-auto mt-6 h-px w-32 bg-slate-400" />
            </div>

            <div className="mt-8 text-center text-base md:text-lg leading-8 opacity-90">
              {certificate.message || "has successfully participated in this event and contributed to its success."}
            </div>

            <div className="mt-10 flex items-end justify-between gap-6 border-t border-current/20 pt-6">
              <div className="text-center flex-1">
                <div className="h-10 border-b border-current/30" />
                <p className="mt-2 text-sm uppercase tracking-[0.25em] opacity-80">{certificate.signature_name || "Event Organizer"}</p>
                <p className="text-xs opacity-70">{certificate.signature_title || "Organizer"}</p>
              </div>
              <div className="text-right flex-1">
                <div className="text-sm uppercase tracking-[0.25em] opacity-80">Event</div>
                <div className="mt-2 font-medium text-lg">{event.title}</div>
                <div className="text-xs opacity-70">{new Date(event.starts_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
