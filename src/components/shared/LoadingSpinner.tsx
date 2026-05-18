import { Loader as Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { className?: string; size?: "sm" | "md" | "lg"; }

export default function LoadingSpinner({ className, size = "md" }: Props) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-blue-600", sizes[size])} />
    </div>
  );
}
