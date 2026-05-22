import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types";

const ROLE_ORDER: UserRole[] = ["admin", "organizer", "attendee", "sponsor"];

export default function AdminPermissionsPage() {
  const entries = Object.entries(PERMISSIONS) as [Permission, UserRole[]][];

  return (
    <div>
      <PageHeader
        title="Role permissions"
        description="RBAC matrix — enforced in ProtectedRoute, RoleRoute, and Supabase RLS"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Permission</th>
                {ROLE_ORDER.map((role) => (
                  <th key={role} className="text-center px-3 py-3 font-medium capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(([permission, roles]) => (
                <tr key={permission} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{permission}</td>
                  {ROLE_ORDER.map((role) => (
                    <td key={role} className="text-center px-3 py-2.5">
                      {roles.includes(role) ? (
                        <Badge variant="default" className="text-xs">
                          yes
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground mt-4">
        User roles are assigned on the Manage Users page and stored in <code>profiles.role</code>.
      </p>
    </div>
  );
}
