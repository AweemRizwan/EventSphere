import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = header.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    return res.status(403).json({ error: "Account inactive" });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: profile?.role || (user.user_metadata?.role as string) || "attendee",
  };
  next();
}
