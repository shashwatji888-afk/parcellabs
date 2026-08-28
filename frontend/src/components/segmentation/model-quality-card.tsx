import { CandidateKMetrics } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Info } from "lucide-react";

export interface ModelQualityCardProps {
  metrics?: CandidateKMetrics;
  recommendedK?: number;
  recommendationRationale?: string;
  selectedK: number;
}

export function ModelQualityCard({
  metrics,
  recommendedK = 3,
  recommendationRationale,
  selectedK,
}: ModelQualityCardProps) {
  if (!metrics) return null;

  const isRecommended = selectedK === recommendedK;

  return (
    <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500" />
            Model Evaluation Diagnostics (K = {metrics.k})
          </CardTitle>
          <CardDescription className="text-xs">
            Multi-metric performance metrics for the active clustering partition
          </CardDescription>
        </div>
        <Badge variant={isRecommended ? "success" : "outline"} className="text-xs">
          {isRecommended ? "Recommended Partition" : "Analyst Selected Partition"}
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Silhouette Score
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {metrics.silhouette_score.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Modest cluster separation
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Inertia (WCSS)
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {metrics.inertia.toLocaleString("en-US", { maximumFractionDigits: 1 })}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Within-cluster variance
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Calinski-Harabasz
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {metrics.calinski_harabasz.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Between / within ratio
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Davies-Bouldin
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {metrics.davies_bouldin.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Cluster similarity index
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 col-span-2 md:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Min Cluster Size
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {metrics.min_cluster_pct.toFixed(2)}%
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {metrics.min_cluster_pct < 4.0 ? "Micro-segment isolated" : "Balanced cohort"}
            </span>
          </div>
        </div>

        {recommendationRationale && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-800">
            <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <p className="leading-relaxed">{recommendationRationale}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
