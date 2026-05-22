import type { Server, Socket } from "socket.io";
import { supabaseAdmin } from "../lib/supabase.js";

export function registerChatSockets(io: Server) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return next(new Error("Invalid token"));

    socket.data.userId = user.id;
    next();
  });

  io.on("connection", (socket: Socket) => {
    socket.on("event:join", ({ eventId }: { eventId: string }) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("event:leave", ({ eventId }: { eventId: string }) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on(
      "chat:send",
      async ({ eventId, message }: { eventId: string; message: string }) => {
        const userId = socket.data.userId as string;
        const { data, error } = await supabaseAdmin
          .from("chat_messages")
          .insert({ event_id: eventId, user_id: userId, message, type: "text" })
          .select("*, user:profiles(full_name, avatar_url)")
          .single();

        if (!error && data) {
          io.to(`event:${eventId}`).emit("chat:message", data);
        }
      }
    );
  });
}
