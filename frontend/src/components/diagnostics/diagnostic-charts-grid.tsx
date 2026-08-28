"use client";

import React from "react";
import { Activity, TrendingDown, Sliders, LineChart, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateKMetrics } from "@/types/api";

export interface DiagnosticChartsGridProps {
  evaluations: CandidateKMetrics[];
  selectedK: number;
  recommendedK: number;
  onSelectK: (k: number) => void;
  className?: string;
}

interface SparklineProps {
  data: { k: number; val: number }[];
  selectedK: number;
  recommendedK?: number;
  color: string;
  formatVal?: (val: number) => string;
}

function MetricCurve({
  data,
  selectedK,
  recommendedK,
  color,
  formatVal = (v) => v.toFixed(2),
}: SparklineProps) {
  if (data.length === 0) return null;

  const minVal = Math.min(...data.map((d) => d.val));
  const maxVal = Math.max(...data.map((d) => d.val));
  const range = maxVal - minVal || 1;

  const width = 360;
  const height = 130;
  const paddingX = 28;
  const paddingY = 20;

  const getX = (idx: number) => paddingX + (idx / (data.length - 1)) * (width - 2 * paddingX);
  const getY = (val: number) => height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);

  const points = data.map((d, idx) => `${getX(idx)},${getY(d.val)}`).join(" ");

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-36 overflow-visible select-none"
      >
        {/* Horizontal reference gridlines */}
        <line
          x1={paddingX}
          y1={paddingY}
          x2={width - paddingX}
          y2={paddingY}
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeDasharray="3 3"
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeDasharray="3 3"
        />

        {/* Shaded Area */}
        <polygon
          points={`${getX(0)},${height - paddingY} ${points} ${getX(data.length - 1)},${height - paddingY}`}
          fill={color}
          fillOpacity={0.12}
        />

        {/* Metric Polyline */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((d, idx) => {
          const cx = getX(idx);
          const cy = getY(d.val);
          const isSelected = d.k === selectedK;
          const isRec = d.k === recommendedK;

          return (
            <g key={d.k} className="cursor-pointer">
              {/* Highlight halo for selected or recommended K */}
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  className="text-indigo-600 dark:text-indigo-400"
                  strokeWidth="2"
                />
              )}

              <circle
                cx={cx}
                cy={cy}
                r={isSelected ? "4.5" : isRec ? "4" : "3"}
                fill={isSelected ? "#4f46e5" : isRec ? "#10b981" : "#ffffff"}
                stroke={color}
                strokeWidth="2"
              />

              {/* K label on X axis */}
              <text
                x={cx}
                y={height - 4}
                textAnchor="middle"
                className={`text-[10px] font-mono ${
                  isSelected
                    ? "fill-indigo-600 font-bold dark:fill-indigo-400"
                    : "fill-slate-400"
                }`}
              >
                K={d.k}
              </text>

              {/* Value label on point for selected or recommended */}
              {(isSelected || isRec) && (
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${
                    isSelected ? "fill-indigo-600 dark:fill-indigo-400" : "fill-emerald-600 dark:fill-emerald-400"
                  }`}
                >
                  {formatVal(d.val)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DiagnosticChartsGrid({
  evaluations,
  selectedK,
  recommendedK,
  className,
}: DiagnosticChartsGridProps) {
  const sortedEvals = [...evaluations].sort((a, b) => a.k - b.k);

  const silhouetteData = sortedEvals.map((e) => ({ k: e.k, val: e.silhouette_score }));
  const inertiaData = sortedEvals.map((e) => ({ k: e.k, val: e.inertia }));
  const calinskiData = sortedEvals.map((e) => ({ k: e.k, val: e.calinski_harabasz }));
  const daviesData = sortedEvals.map((e) => ({ k: e.k, val: e.davies_bouldin }));

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1: Silhouette vs K */}
        <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Mean Silhouette Coefficient vs K
              </CardTitle>
              <span className="text-[10px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Higher is Better
              </span>
            </div>
            <CardDescription className="text-xs">
              Measures how closely matched samples are to their own cluster vs neighboring clusters (-1 to +1)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCurve
              data={silhouetteData}
              selectedK={selectedK}
              recommendedK={recommendedK}
              color="#9333ea"
              formatVal={(v) => v.toFixed(3)}
            />
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <Info className="inline h-3 w-3 mr-1 text-slate-400" />
              Peak occurs at K=4 (0.198) with a 2.55% micro-segment; K=3 (0.183) is the highest-scoring model without micro-clusters.
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Inertia (Elbow) vs K */}
        <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Within-Cluster Sum of Squares (Inertia Elbow)
              </CardTitle>
              <span className="text-[10px] uppercase font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                Lower is Better (Look for Elbow)
              </span>
            </div>
            <CardDescription className="text-xs">
              Total Euclidean squared distance of all points to their assigned cluster centroids (WCSS)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCurve
              data={inertiaData}
              selectedK={selectedK}
              recommendedK={recommendedK}
              color="#4f46e5"
              formatVal={(v) => v.toFixed(0)}
            />
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <Info className="inline h-3 w-3 mr-1 text-slate-400" />
              Gradual slope decline reflects continuous underlying density without a sharp discontinuous drop.
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Calinski-Harabasz Index vs K */}
        <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Calinski-Harabasz Variance Ratio Criterion
              </CardTitle>
              <span className="text-[10px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Higher is Better
              </span>
            </div>
            <CardDescription className="text-xs">
              Ratio of between-cluster dispersion to within-cluster dispersion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCurve
              data={calinskiData}
              selectedK={selectedK}
              recommendedK={recommendedK}
              color="#059669"
              formatVal={(v) => v.toFixed(1)}
            />
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <Info className="inline h-3 w-3 mr-1 text-slate-400" />
              Evaluates structural dispersion; higher values indicate clusters are dense and well-separated.
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Davies-Bouldin Index vs K */}
        <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <LineChart className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Davies-Bouldin Cluster Separation Index
              </CardTitle>
              <span className="text-[10px] uppercase font-mono font-semibold text-amber-600 dark:text-amber-400">
                Lower is Better
              </span>
            </div>
            <CardDescription className="text-xs">
              Average similarity between each cluster and its most similar counterpart
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <MetricCurve
              data={daviesData}
              selectedK={selectedK}
              recommendedK={recommendedK}
              color="#d97706"
              formatVal={(v) => v.toFixed(2)}
            />
            <div className="rounded-md border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
              <Info className="inline h-3 w-3 mr-1 text-slate-400" />
              Measures similarity between overlapping cluster pairs; lower scores indicate minimal boundary ambiguity.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
