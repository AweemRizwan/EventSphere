import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppSelector } from "@/store/hooks";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" description="Your EventSphere account" />
      <Card>
        <CardContent className="p-6 flex gap-4 items-start">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2 min-w-0">
            <h2 className="font-semibold text-lg">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            {user.company && (
              <p className="text-sm text-muted-foreground">{user.company}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
