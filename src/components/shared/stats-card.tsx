import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "red" | "purple" | "orange" | "teal";
  index?: number;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    value: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    icon: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
    value: "text-red-700 dark:text-red-300",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    icon: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    value: "text-purple-700 dark:text-purple-300",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    icon: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
    value: "text-orange-700 dark:text-orange-300",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    icon: "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400",
    value: "text-teal-700 dark:text-teal-300",
  },
};

export function StatsCard({ title, value, icon: Icon, trend, color = "blue", index = 0 }: StatsCardProps) {
  const colors = colorMap[color];
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className={cn("border-0 shadow-sm", colors.bg)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
              <p className={cn("text-2xl font-bold mt-1 truncate", colors.value)}>{value}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={cn("text-xs font-medium", isPositive ? "text-emerald-600" : "text-red-500")}>
                    {isPositive ? "+" : ""}{trend.value}%
                  </span>
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl shrink-0", colors.icon)}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
