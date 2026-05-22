import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import type { Notification } from "@/types";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up"}
      />
      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={n.is_read ? "opacity-70" : ""}>
              <CardContent className="p-4 flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{n.title}</p>
                    {!n.is_read && <Badge variant="secondary">New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <Button variant="outline" size="sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
