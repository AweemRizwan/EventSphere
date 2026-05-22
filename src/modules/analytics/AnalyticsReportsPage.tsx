import { Link } from "react-router-dom";
import { Sparkles, BarChart3 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import StatCard from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/permissions";
import { featureFlags } from "@/lib/feature-flags";
import { useGetRecommendationsQuery } from "@/store/api/aiApi";
import { useGetEventsQuery } from "@/store/api/eventsApi";

export default function AnalyticsReportsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isPlatform = hasPermission(user?.role, "analytics:platform");
  const isEvent = hasPermission(user?.role, "analytics:event");

  const { data: events = [], isLoading: eventsLoading } = useGetEventsQuery(
    isPlatform ? { allStatuses: true, limit: 50 } : { organizerId: user?.id, allStatuses: true, limit: 50 },
    { skip: !user }
  );

  const { data: recommendations = [], isLoading: aiLoading } = useGetRecommendationsQuery(undefined, {
    skip: !featureFlags.aiInsights || !user,
  });

  const published = events.filter((e) => e.status === "published").length;
  const pending = events.filter((e) => e.status === "pending").length;

  return (
    <div>
      <PageHeader
        title={isPlatform ? "Platform analytics" : "Event analytics"}
        description={
          isPlatform
            ? "Admin overview across all campus events"
            : "Performance for your organized events"
        }
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/analytics/exports">Exports</Link>
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total events" value={events.length} icon={BarChart3} delay={0} />
        <StatCard title="Published" value={published} icon={BarChart3} delay={0.05} />
        <StatCard title="Pending approval" value={pending} icon={BarChart3} delay={0.1} />
        {isEvent && (
          <StatCard
            title="Your events"
            value={events.filter((e) => e.organizer_id === user?.id).length}
            icon={BarChart3}
            delay={0.15}
          />
        )}
      </div>

      {eventsLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Recent events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events to report on yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {events.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex justify-between gap-2 border-b last:border-0 py-2">
                    <Link to={`/events/${e.id}`} className="font-medium hover:text-blue-600 truncate">
                      {e.title}
                    </Link>
                    <span className="text-muted-foreground capitalize flex-shrink-0">{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {featureFlags.aiInsights && hasPermission(user?.role, "ai:insights") && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base">AI insights</CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <LoadingSpinner className="py-6" />
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recommendations yet. Enable the API BFF with <code>FEATURE_AI=true</code> and
                booking history for personalized suggestions.
              </p>
            ) : (
              <ul className="space-y-3">
                {recommendations.map((insight) => (
                  <li key={insight.id} className="text-sm border rounded-lg p-3">
                    <p className="font-medium capitalize">{insight.insight_type.replace(/_/g, " ")}</p>
                    <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                      {JSON.stringify(insight.payload, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
