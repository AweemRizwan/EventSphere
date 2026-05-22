import { supabaseAdmin } from "../lib/supabase.js";
export async function requireAuth(req, res, next) {
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
        role: profile?.role || user.user_metadata?.role || "attendee",
    };
    next();
}
