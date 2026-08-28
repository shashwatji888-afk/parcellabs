"use client";

import React from "react";
import {
  Sparkles,
  Activity,
  Layers,
  AlertTriangle,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import { CandidateKEvaluation, CandidateKMetrics } from "@/types/api";

export interface DiagnosticsKPISummaryProps {
  evaluation: CandidateKEvaluation;
  selectedMetrics?: CandidateKMetrics;
  selectedK: number;
  className?: string;
}

export function DiagnosticsKPISummary({
  evaluation,
  selectedMetrics,
  selectedK,
  className,
}: DiagnosticsKPISummaryProps) {
  const isRecommended = selectedK === evaluation.recommended_k;
  const isMicro = (selectedMetrics?.min_cluster_pct ?? 100) < evaluation.min_cluster_pct_threshold;

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Recommended Model */}
        <Card className="border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Recommended Model
              </span>
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
              K = {evaluation.recommended_k}
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                Operational
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Optimal balance of silhouette and cohort scale
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Active Evaluation K */}
        <Card className="border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Selected Partition
              </span>
              <Layers className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
              K = {selectedK}
              {isRecommended ? (
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                  Recommended
                </Badge>
              ) : isMicro ? (
                <Badge variant="warning" className="text-[10px]">
                  Micro-Cohort
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Exploratory
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedMetrics ? `${selectedMetrics.k} cluster partitions evaluated` : "Active model run"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Silhouette Score */}
        <Card className="border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Silhouette Score
              </span>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {selectedMetrics ? selectedMetrics.silhouette_score.toFixed(3) : "—"}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cluster compactness vs nearest separation
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Min Cluster Percentage */}
        <Card className="border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Min Cluster Scale
              </span>
              {isMicro ? (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              )}
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${isMicro ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
              {selectedMetrics ? formatPercent(selectedMetrics.min_cluster_pct) : "—"}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Threshold constraint: &ge; {evaluation.min_cluster_pct_threshold.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Calinski-Harabasz Index */}
        <Card className="border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                Calinski-Harabasz
              </span>
              <Sliders className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {selectedMetrics ? selectedMetrics.calinski_harabasz.toFixed(1) : "—"}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Between-to-within variance ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rationale & Statistical Honesty Notice */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Diagnostic Decision Rationale:
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {evaluation.recommendation_rationale}
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-[11px] leading-relaxed pt-1">
              <strong>Statistical Boundary Notice:</strong> The buyer population exhibits continuous financial distributions with moderate separation. Clusters represent operational and analytical partitions rather than distinct ground-truth customer classes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
