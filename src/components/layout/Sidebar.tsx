import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Calendar, Users, Ticket, ChartBar as BarChart3, Settings, Zap, Building2, Star, MessageSquare, Bell, Shield, ChevronLeft, ChevronRight, CirclePlus as PlusCircle, BookOpen, Megaphone, Trophy, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/uiSlice";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "organizer", "attendee", "sponsor"] },
  // Admin
  { label: "Manage Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { label: "Manage Events", href: "/admin/events", icon: Calendar, roles: ["admin"] },
  { label: "Categories", href: "/admin/categories", icon: Globe, roles: ["admin"] },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
  { label: "Permissions", href: "/admin/permissions", icon: Shield, roles: ["admin"] },
  // Organizer
  { label: "My Events", href: "/organizer/events", icon: Calendar, roles: ["organizer"] },
  { label: "Create Event", href: "/organizer/events/new", icon: PlusCircle, roles: ["organizer"] },
  { label: "Registrations", href: "/organizer/registrations", icon: BookOpen, roles: ["organizer"] },
  { label: "Ticket Management", href: "/organizer/tickets", icon: Ticket, roles: ["organizer"] },
  // Attendee
  { label: "Browse Events", href: "/events", icon: Globe, roles: ["attendee"] },
  { label: "My Bookings", href: "/attendee/bookings", icon: Ticket, roles: ["attendee"] },
  // Sponsor
  { label: "Opportunities", href: "/sponsor/opportunities", icon: Star, roles: ["sponsor"] },
  { label: "My Campaigns", href: "/sponsor/campaigns", icon: Megaphone, roles: ["sponsor"] },
  { label: "Sponsorships", href: "/sponsor/sponsorships", icon: Trophy, roles: ["sponsor"] },
  // Shared
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: ["admin", "organizer", "sponsor"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["admin", "organizer", "attendee", "sponsor"] },
  { label: "Live Events", href: "/events/live", icon: MessageSquare, roles: ["attendee", "organizer"] },
  { label: "Profile", href: "/profile", icon: Building2, roles: ["admin", "organizer", "attendee", "sponsor"] },
];

export default function Sidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((s) => s.ui);
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role || "attendee";

  const filtered = navItems.filter((item) => item.roles.includes(role as UserRole));

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen bg-slate-900 dark:bg-slate-950 flex flex-col fixed left-0 top-0 z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white font-bold font-display text-lg whitespace-nowrap"
            >
              EventSphere
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2 space-y-1">
        {filtered.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="flex items-center justify-center h-10 m-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
