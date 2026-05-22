import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/permissions";

export default function AnalyticsExportsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const scope = hasPermission(user?.role, "analytics:platform") ? "platform" : "event";

  return (
    <div>
      <PageHeader
        title="Analytics exports"
        description={`Export ${scope}-level reports (CSV/PDF hooks via BFF planned)`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/analytics/reports">Back to reports</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Scheduled exports will run against Supabase views and the API BFF. Use Reports for live
          summaries today.
        </CardContent>
      </Card>
    </div>
  );
}
