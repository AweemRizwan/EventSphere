import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
}

/** Sponsor modules are planned per ARCHITECTURE.md — consistent shell until full build. */
export default function SponsorPlaceholderPage({ title, description }: Props) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Sponsor workflows (opportunities, campaigns, sponsorships) are on the roadmap.
            Browse published events in the meantime.
          </p>
          <Button asChild>
            <Link to="/events">Browse events</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
