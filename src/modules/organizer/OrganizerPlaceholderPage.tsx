import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
}

export default function OrganizerPlaceholderPage({ title, description }: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            This organizer view will connect to bookings and ticket tiers via Supabase RLS.
          </p>
          <Button asChild variant="outline">
            <Link to="/organizer/events">Back to my events</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
