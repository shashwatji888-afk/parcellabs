"use client";

import React from "react";
import { TableProperties, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatNumber } from "@/lib/utils";
import { CandidateKMetrics } from "@/types/api";

export interface CandidateKTableProps {
  evaluations: CandidateKMetrics[];
  selectedK: number;
  recommendedK: number;
  minClusterPctThreshold: number;
  onSelectK: (k: number) => void;
  className?: string;
}

export function CandidateKTable({
  evaluations,
  selectedK,
  recommendedK,
  minClusterPctThreshold,
  onSelectK,
  className,
}: CandidateKTableProps) {
  const sortedEvals = [...evaluations].sort((a, b) => a.k - b.k);

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <TableProperties className="h-4 w-4 text-indigo-500" />
              Candidate K Diagnostic Evaluation Matrix (K = 2 to 10)
            </CardTitle>
            <CardDescription className="text-xs">
              Algorithmic performance metrics, cluster size distributions, and micro-segment constraint evaluations
            </CardDescription>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Micro-Cluster Cutoff: &lt; {minClusterPctThreshold.toFixed(1)}%
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <th className="py-2.5 pl-3">Model K</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right font-mono">Silhouette</th>
                <th className="py-2.5 text-right font-mono">Inertia (WCSS)</th>
                <th className="py-2.5 text-right font-mono">Calinski-Harabasz</th>
                <th className="py-2.5 text-right font-mono">Davies-Bouldin</th>
                <th className="py-2.5 text-right font-mono">Min Cluster %</th>
                <th className="py-2.5 pr-3 text-right">Cluster Sizes [N]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 font-mono">
              {sortedEvals.map((item) => {
                const isSelected = item.k === selectedK;
                const isRec = item.k === recommendedK;
                const isMicro = item.min_cluster_pct < minClusterPctThreshold;

                const sizesStr = Object.values(item.cluster_sizes)
                  .map((c) => formatNumber(c))
                  .join(", ");

                return (
                  <tr
                    key={item.k}
                    onClick={() => onSelectK(item.k)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30 font-semibold"
                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="py-2.5 pl-3 font-sans font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] dark:bg-slate-800 dark:text-slate-300 font-mono">
                        {item.k}
                      </span>
                      K={item.k}
                    </td>

                    <td className="py-2.5 font-sans">
                      {isRec ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit dark:bg-emerald-950/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" /> Recommended
                        </Badge>
                      ) : isMicro ? (
                        <Badge variant="warning" className="text-[10px] flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> Micro-Cluster
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-slate-500 w-fit">
                          <Layers className="h-3 w-3 mr-1" /> Candidate
                        </Badge>
                      )}
                    </td>

                    <td className={`py-2.5 text-right ${isRec || item.k === 4 ? "text-purple-600 dark:text-purple-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      {item.silhouette_score.toFixed(3)}
                    </td>

                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {formatNumber(Math.round(item.inertia))}
                    </td>

                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {item.calinski_harabasz.toFixed(1)}
                    </td>

                    <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                      {item.davies_bouldin.toFixed(2)}
                    </td>

                    <td className={`py-2.5 text-right ${isMicro ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      {formatPercent(item.min_cluster_pct)}
                    </td>

                    <td className="py-2.5 pr-3 text-right text-slate-500 text-[11px]">
                      [{sizesStr}]
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
