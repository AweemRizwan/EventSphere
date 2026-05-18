import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, MousePointer, TrendingUp, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useAppSelector } from "@/store/hooks";
import { formatCurrency } from "@/lib/utils";

const impressionData = [
  { day: "Mon", impressions: 1200, clicks: 48 },
  { day: "Tue", impressions: 1800, clicks: 72 },
  { day: "Wed", impressions: 1400, clicks: 56 },
  { day: "Thu", impressions: 2200, clicks: 88 },
  { day: "Fri", impressions: 2800, clicks: 112 },
  { day: "Sat", impressions: 3200, clicks: 128 },
  { day: "Sun", impressions: 2600, clicks: 104 },
];

export default function SponsorDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [sponsorships, setSponsorships] = useState<{ id: string; tier: string; status: string; amount: number; event?: { title: string } }[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: sponsor } = await supabase.from("sponsors").select("id").eq("user_id", user!.id).maybeSingle();
      if (!sponsor) return;
      const { data } = await supabase
        .from("sponsorships")
        .select("id, tier, status, amount, event:events(title)")
        .eq("sponsor_id", sponsor.id)
        .limit(5);
      if (data) setSponsorships(data as unknown as typeof sponsorships);
    }
    load();
  }, [user]);

  const totalInvested = sponsorships.reduce((s, sp) => s + (sp.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Sponsor Dashboard" description="Track your sponsorship performance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Impressions" value="28.4K" change="+18% this week" changeType="positive" icon={Eye} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" delay={0} />
        <StatCard title="Total Clicks" value="1,124" change="+12% this week" changeType="positive" icon={MousePointer} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" delay={0.05} />
        <StatCard title="Active Sponsorships" value={sponsorships.filter((s) => s.status === "approved").length} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" delay={0.1} />
        <StatCard title="Total Invested" value={formatCurrency(totalInvested)} icon={TrendingUp} iconColor="text-rose-600" iconBg="bg-rose-100 dark:bg-rose-900/30" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">Ad Performance (This Week)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={impressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="impressions" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Impressions" />
                  <Bar dataKey="clicks" fill="#10B981" radius={[4, 4, 0, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">My Sponsorships</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/sponsor/sponsorships">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {sponsorships.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm mb-3">No sponsorships yet</p>
                  <Button size="sm" asChild><Link to="/sponsor/opportunities">Browse Opportunities</Link></Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {sponsorships.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{s.event?.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.tier} tier · {formatCurrency(s.amount)}</p>
                      </div>
                      <Badge variant={s.status === "approved" ? "success" : s.status === "rejected" ? "destructive" : "warning"}>{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
