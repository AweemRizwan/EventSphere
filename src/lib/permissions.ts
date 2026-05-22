import type { UserRole } from "@/types";

export const PERMISSIONS = {
  "users:read": ["admin"],
  "users:write": ["admin"],
  "events:write:any": ["admin"],
  "events:write:own": ["organizer", "admin"],
  "streams:start": ["organizer", "admin"],
  "streams:join": ["attendee", "organizer", "admin", "sponsor"],
  "bookings:create": ["attendee", "organizer", "admin", "sponsor"],
  "chat:participate": ["attendee", "organizer", "admin", "sponsor"],
  "analytics:platform": ["admin"],
  "analytics:event": ["organizer", "admin"],
  "ai:insights": ["admin", "organizer"],
} as const satisfies Record<string, UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function hasAnyRole(role: UserRole | undefined, allowed: UserRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
