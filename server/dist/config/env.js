import "dotenv/config";
export const env = {
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || "development",
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    featureAi: process.env.FEATURE_AI === "true",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
