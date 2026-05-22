export const featureFlags = {
  aiInsights: import.meta.env.VITE_FEATURE_AI === "true",
  socketChat: import.meta.env.VITE_FEATURE_SOCKET_CHAT !== "false",
} as const;
