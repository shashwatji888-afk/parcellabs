import { Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface KSelectorProps {
  selectedK: number;
  recommendedK?: number;
  onSelectK: (k: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function KSelector({
  selectedK,
  recommendedK = 3,
  onSelectK,
  isLoading = false,
  className,
}: KSelectorProps) {
  const kOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Target Cluster Count (K)
        </div>
        {recommendedK && (
          <Badge variant="outline" className="gap-1 border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Recommended: K = {recommendedK}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Select number of clusters K">
        {kOptions.map((k) => {
          const isSelected = selectedK === k;
          const isRecommended = recommendedK === k;

          return (
            <button
              key={k}
              type="button"
              onClick={() => onSelectK(k)}
              disabled={isLoading}
              aria-pressed={isSelected}
              className={cn(
                "relative flex h-9 min-w-[54px] items-center justify-center rounded-lg px-3 text-xs font-semibold transition-all disabled:opacity-50",
                isSelected
                  ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900 ring-offset-2 dark:bg-slate-50 dark:text-slate-900 dark:ring-slate-400 dark:ring-offset-slate-900"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                isRecommended && !isSelected && "border border-emerald-400/60 dark:border-emerald-500/50"
              )}
            >
              <span>K = {k}</span>
              {isRecommended && !isSelected && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </button>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-1.5 pl-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
            <span>Reclustering...</span>
          </div>
        )}
      </div>
    </div>
  );
}
