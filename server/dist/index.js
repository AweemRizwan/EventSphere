import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { registerChatSockets } from "./sockets/chat.js";
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: env.corsOrigin, credentials: true },
});
registerChatSockets(io);
server.listen(env.port, () => {
    console.log(`EventSphere API listening on http://localhost:${env.port}`);
});
