import { supabaseAdmin } from "../lib/supabase.js";
export function registerChatSockets(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error("Authentication required"));
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user)
            return next(new Error("Invalid token"));
        socket.data.userId = user.id;
        next();
    });
    io.on("connection", (socket) => {
        socket.on("event:join", ({ eventId }) => {
            socket.join(`event:${eventId}`);
        });
        socket.on("event:leave", ({ eventId }) => {
            socket.leave(`event:${eventId}`);
        });
        socket.on("chat:send", async ({ eventId, message }) => {
            const userId = socket.data.userId;
            const { data, error } = await supabaseAdmin
                .from("chat_messages")
                .insert({ event_id: eventId, user_id: userId, message, type: "text" })
                .select("*, user:profiles(full_name, avatar_url)")
                .single();
            if (!error && data) {
                io.to(`event:${eventId}`).emit("chat:message", data);
            }
        });
    });
}
