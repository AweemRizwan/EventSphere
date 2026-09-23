import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { streamsRouter } from "./routes/streams.js";
import { aiRouter } from "./routes/ai.js";
import { webhooksRouter } from "./routes/webhooks.js";
const helmetMiddleware = helmet;
export function createApp() {
    const app = express();
    app.use(helmetMiddleware());
    app.use(cors({
        origin: env.corsOrigin,
        credentials: true,
    }));
    app.use("/api/v1/webhooks", webhooksRouter);
    app.use(express.json());
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", service: "eventsphere-api" });
    });
    app.use("/api/v1/streams", streamsRouter);
    app.use("/api/v1/ai", aiRouter);
    app.use((_req, res) => {
        res.status(404).json({ error: "Not found" });
    });
    return app;
}
