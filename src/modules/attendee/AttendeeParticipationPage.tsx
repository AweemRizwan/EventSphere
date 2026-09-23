import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAppSelector } from "@/store/hooks";
import { getParticipationHistoryForOrganizer, getParticipationHistoryForUser, type ParticipationRecord } from "@/lib/participation";

export default function AttendeeParticipationPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [records, setRecords] = useState<ParticipationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const isOrganizerView = user?.role === "organizer" || user?.role === "admin";

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    const task = isOrganizerView
      ? getParticipationHistoryForOrganizer(user.id)
      : getParticipationHistoryForUser(user.id);

    void task
      .then((data) => setRecords(data))
      .finally(() => setLoading(false));
  }, [user?.id, user?.role, isOrganizerView]);

  return (
    <div>
      <PageHeader
        title={isOrganizerView ? "Participation Summary" : "My Participation"}
        description={isOrganizerView ? "Confirmed attendee participation for your events" : "Your attended events and certificates"}
      />

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No attended events yet.</p>
            <Link to="/events">
              <Button className="mt-4">Browse events</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={`${record.event_id}-${record.user_id}-${record.id}`}>
              <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{record.event_title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {new Date(record.event_date).toLocaleDateString()}</span>
                    {isOrganizerView && record.attendee_name && (
                      <span className="font-medium text-slate-700 dark:text-slate-200">{record.attendee_name}</span>
                    )}
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {isOrganizerView ? "Confirmed" : "Attended"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isOrganizerView && (
                    record.certificate_enabled ? (
                      <Link to={`/attendee/certificate/${record.event_id}`}>
                        <Button size="sm">View certificate</Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Certificate not enabled
                      </Button>
                    )
                  )}

                  {isOrganizerView && (
                    <Badge variant={record.certificate_enabled ? "default" : "secondary"}>
                      {record.certificate_enabled ? "Certificates enabled" : "Certificate off"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
