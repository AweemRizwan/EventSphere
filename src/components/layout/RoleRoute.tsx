import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";
import { hasAnyRole, hasPermission, type Permission } from "@/lib/permissions";
import { Loader as Loader2 } from "lucide-react";

interface Props {
  roles?: UserRole[];
  permission?: Permission;
  redirectTo?: string;
}

export default function RoleRoute({ roles, permission, redirectTo = "/events" }: Props) {
  const { user, loading } = useAppSelector((s) => s.auth);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !hasAnyRole(user.role, roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (permission && !hasPermission(user.role, permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
