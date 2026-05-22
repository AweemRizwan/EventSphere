import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";
import { hasAnyRole } from "@/lib/permissions";
import { Loader as Loader2 } from "lucide-react";

interface Props {
  roles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ roles, redirectTo = "/login" }: Props) {
  const { user, loading } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !hasAnyRole(user.role, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}