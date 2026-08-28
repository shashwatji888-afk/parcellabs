"use client";

import React, { useMemo } from "react";
import { GitFork, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HierarchicalLinkageResult } from "@/types/api";

export interface DendrogramViewerProps {
  linkageResult: HierarchicalLinkageResult;
  className?: string;
}

export function DendrogramViewer({ linkageResult, className }: DendrogramViewerProps) {
  const { linkage_matrix, sample_size, cophenetic_correlation } = linkageResult;

  // Build SVG coordinates from Ward linkage matrix
  const { nodes, maxDistance } = useMemo(() => {
    if (!linkage_matrix || linkage_matrix.length === 0) {
      return { nodes: [], maxDistance: 1 };
    }

    const n = sample_size;
    const maxDist = Math.max(...linkage_matrix.map((row) => row[2])) || 1;

    // Map cluster indices to (x, y) coordinates
    const positions: Record<number, { x: number; y: number }> = {};
    for (let i = 0; i < n; i++) {
      positions[i] = { x: i, y: 0 };
    }

    const lines: { x1: number; y1: number; x2: number; y2: number; color?: string }[] = [];

    linkage_matrix.forEach((row, idx) => {
      const clusterA = Math.round(row[0]);
      const clusterB = Math.round(row[1]);
      const dist = row[2];
      const newClusterId = n + idx;

      const posA = positions[clusterA] || { x: 0, y: 0 };
      const posB = positions[clusterB] || { x: 0, y: 0 };

      const newX = (posA.x + posB.x) / 2;
      const newY = dist;

      positions[newClusterId] = { x: newX, y: newY };

      // Vertical line A
      lines.push({ x1: posA.x, y1: posA.y, x2: posA.x, y2: newY });
      // Vertical line B
      lines.push({ x1: posB.x, y1: posB.y, x2: posB.x, y2: newY });
      // Horizontal bridge line
      lines.push({ x1: posA.x, y1: newY, x2: posB.x, y2: newY });
    });

    return { nodes: lines, maxDistance: maxDist };
  }, [linkage_matrix, sample_size]);

  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 20;
  const paddingY = 20;

  const scaleX = (x: number) => paddingX + (x / (sample_size - 1)) * (svgWidth - 2 * paddingX);
  const scaleY = (y: number) => svgHeight - paddingY - (y / maxDistance) * (svgHeight - 2 * paddingY);

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitFork className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Hierarchical Agglomerative Tree & Dendrogram Topology
            </CardTitle>
            <CardDescription className="text-xs">
              Ward variance minimization linkage computed across a representative stratified sample (N={sample_size})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-mono dark:bg-purple-950/40 dark:text-purple-300">
              Cophenetic Correlation: r = {cophenetic_correlation.toFixed(3)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SVG Dendrogram Canvas */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/40 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 select-none"
          >
            {/* Gridlines */}
            {[0.25, 0.5, 0.75, 1.0].map((pct) => {
              const yPos = scaleY(maxDistance * pct);
              return (
                <g key={pct}>
                  <line
                    x1={paddingX}
                    y1={yPos}
                    x2={svgWidth - paddingX}
                    y2={yPos}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX + 4}
                    y={yPos - 4}
                    className="text-[9px] font-mono fill-slate-400"
                  >
                    d = {(maxDistance * pct).toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Tree Branches */}
            {nodes.map((l, i) => (
              <line
                key={i}
                x1={scaleX(l.x1)}
                y1={scaleY(l.y1)}
                x2={scaleX(l.x2)}
                y2={scaleY(l.y2)}
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="transition-colors hover:stroke-indigo-400"
              />
            ))}
          </svg>
        </div>

        {/* Explanatory Callout */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Hierarchical Caveat:</strong> The dendrogram displays the nested merge history of agglomerative Ward clustering. A cophenetic correlation of r = {cophenetic_correlation.toFixed(3)} indicates moderate tree preservation. While hierarchical clustering reveals nested structure, it does not independently validate K-Means cluster boundaries as ground truth.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
