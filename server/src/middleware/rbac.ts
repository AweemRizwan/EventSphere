import type { Request, Response, NextFunction } from "express";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  organizer: ["events:own", "streams:start", "analytics:event", "ai:event"],
  attendee: ["bookings:create", "streams:join", "chat:participate"],
  sponsor: ["bookings:create", "streams:join", "chat:participate", "analytics:sponsor"],
};

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const perms = ROLE_PERMISSIONS[req.user.role] || [];
    if (!perms.includes("*") && !perms.includes(permission)) {
      return res.status(403).json({ error: "Insufficient permission" });
    }
    next();
  };
}
