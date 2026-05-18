import { useAppSelector } from "@/store/hooks";
import AdminDashboard from "./AdminDashboard";
import OrganizerDashboard from "./OrganizerDashboard";
import AttendeeDashboard from "./AttendeeDashboard";
import SponsorDashboard from "./SponsorDashboard";

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;

  if (role === "admin") return <AdminDashboard />;
  if (role === "organizer") return <OrganizerDashboard />;
  if (role === "sponsor") return <SponsorDashboard />;
  return <AttendeeDashboard />;
}
