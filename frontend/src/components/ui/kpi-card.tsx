import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  className,
}: KPICardProps) {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden border-slate-200/80 dark:border-slate-800", className)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-36 mt-4" />
          <Skeleton className="h-3.5 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-200/80 bg-white transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
