"use client";

import React from "react";
import { GitCompare, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClusterStabilityResponse } from "@/types/api";

export interface StabilityAnalysisCardProps {
  stability: ClusterStabilityResponse;
  className?: string;
}

export function StabilityAnalysisCard({ stability, className }: StabilityAnalysisCardProps) {
  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Multi-Seed Cluster Stability & Convergence Diagnostics (K={stability.k})
            </CardTitle>
            <CardDescription className="text-xs">
              Pairwise Adjusted Rand Index (ARI) and Normalized Mutual Information (NMI) across distinct random centroid seeds
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-mono dark:bg-emerald-950/40 dark:text-emerald-300">
            {stability.stability_rating}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Mean Adjusted Rand Index (ARI)
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stability.mean_adjusted_rand_index.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500">
              Range: [{stability.min_adjusted_rand_index.toFixed(4)} — {stability.max_adjusted_rand_index.toFixed(4)}]
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Mean Normalized Mutual Info (NMI)
            </span>
            <div className="mt-1 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {stability.mean_normalized_mutual_info.toFixed(4)}
            </div>
            <span className="text-[10px] text-slate-500">
              Information-theoretic agreement (0.0 to 1.0)
            </span>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Evaluated Random Seeds
            </span>
            <div className="mt-1 text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
              [{stability.seeds_evaluated.join(", ")}]
            </div>
            <span className="text-[10px] text-slate-500">
              {stability.pairwise_agreements.length} pairwise seed comparisons
            </span>
          </div>
        </div>

        {/* Pairwise Agreement Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 font-sans">
                <th className="py-2 pl-3">Seed A</th>
                <th className="py-2">Seed B</th>
                <th className="py-2 text-right">Adjusted Rand Index (ARI)</th>
                <th className="py-2 text-right pr-3">Normalized Mutual Info (NMI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {stability.pairwise_agreements.map((pair, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2 pl-3 text-slate-700 dark:text-slate-300">
                    Seed {pair.seed_a}
                  </td>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    Seed {pair.seed_b}
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {pair.adjusted_rand_index.toFixed(4)}
                  </td>
                  <td className="py-2 pr-3 text-right text-indigo-600 dark:text-indigo-400">
                    {pair.normalized_mutual_info.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stability vs Validity Disclaimer */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Quality vs. Stability Distinction:</strong> {stability.interpretation_caveat}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
