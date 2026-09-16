import "dotenv/config";

const fallbackSupabaseUrl = process.env.VITE_SUPABASE_URL || "https://avfkawjpwjzhmzrbfjpf.supabase.co";
const fallbackSupabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const env = {
  port: Number(process.env.PORT) || 4001,
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: process.env.SUPABASE_URL || fallbackSupabaseUrl,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || fallbackSupabaseKey,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  featureAi: process.env.FEATURE_AI === "true" || process.env.VITE_FEATURE_AI === "true",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
