import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, DollarSign, TrendingUp, Activity, Eye, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";

const revenueData = [
  { month: "Jan", revenue: 12400, events: 8 },
  { month: "Feb", revenue: 19800, events: 12 },
  { month: "Mar", revenue: 15600, events: 10 },
  { month: "Apr", revenue: 28400, events: 18 },
  { month: "May", revenue: 24200, events: 15 },
  { month: "Jun", revenue: 31800, events: 22 },
  { month: "Jul", revenue: 38900, events: 25 },
];

const categoryData = [
  { name: "Technology", value: 35, color: "#3B82F6" },
  { name: "Business", value: 25, color: "#10B981" },
  { name: "Music", value: 20, color: "#F59E0B" },
  { name: "Sports", value: 12, color: "#EF4444" },
  { name: "Other", value: 8, color: "#8B5CF6" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, events: 0, revenue: 0, bookings: 0 });
  const [recentEvents, setRecentEvents] = useState<{ id: string; title: string; status: string; starts_at: string; organizer?: { full_name: string } }[]>([]);

  useEffect(() => {
    async function loadStats() {
      const [usersRes, eventsRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("events").select("id", { count: "exact" }),
        supabase.from("bookings").select("total_amount"),
      ]);
      const revenue = (bookingsRes.data || []).reduce((s, b) => s + (b.total_amount || 0), 0);
      setStats({
        users: usersRes.count || 0,
        events: eventsRes.count || 0,
        revenue,
        bookings: bookingsRes.data?.length || 0,
      });
    }

    async function loadRecentEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, title, status, starts_at, organizer:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setRecentEvents(data as unknown as typeof recentEvents);
    }

    loadStats();
    loadRecentEvents();
  }, []);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      published: "success", pending: "warning", draft: "secondary", cancelled: "destructive"
    };
    return <Badge variant={map[status] as "success" | "warning" | "secondary" | "destructive" || "secondary"}>{status}</Badge>;
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Platform overview and analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={stats.users.toLocaleString()} change="+12% this month" changeType="positive" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" delay={0} />
        <StatCard title="Total Events" value={stats.events.toLocaleString()} change="+8% this month" changeType="positive" icon={Calendar} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" delay={0.05} />
        <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} change="+23% this month" changeType="positive" icon={DollarSign} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" delay={0.1} />
        <StatCard title="Total Bookings" value={stats.bookings.toLocaleString()} change="+15% this month" changeType="positive" icon={TrendingUp} iconColor="text-rose-600" iconBg="bg-rose-100 dark:bg-rose-900/30" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" /> Revenue & Events Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, n) => [n === "revenue" ? formatCurrency(v as number) : v, n === "revenue" ? "Revenue" : "Events"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenue)" strokeWidth={2} />
                  <Bar dataKey="events" fill="#10B981" opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" /> Events by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 mt-2">
                {categoryData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-medium">{c.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No events yet</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.starts_at)} · {event.organizer?.full_name}</p>
                    </div>
                    {statusBadge(event.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
