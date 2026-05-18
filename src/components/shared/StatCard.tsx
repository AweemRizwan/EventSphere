import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  delay?: number;
}

export default function StatCard({
  title, value, change, changeType = "neutral", icon: Icon,
  iconColor = "text-blue-600", iconBg = "bg-blue-100", delay = 0
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-card border rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-0.5 font-display">{value}</p>
        {change && (
          <p className={cn("text-xs mt-1", {
            "text-emerald-600": changeType === "positive",
            "text-red-500": changeType === "negative",
            "text-muted-foreground": changeType === "neutral",
          })}>
            {change}
          </p>
        )}
      </div>
    </motion.div>
  );
}
