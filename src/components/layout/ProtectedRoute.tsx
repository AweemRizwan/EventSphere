import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { UserRole } from "@/types";
import { Loader as Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAppSelector((s) => s.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role as UserRole)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
