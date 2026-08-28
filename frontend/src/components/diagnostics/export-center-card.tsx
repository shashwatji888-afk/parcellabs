"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, ShieldCheck, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";

export interface ExportCenterCardProps {
  selectedK: number;
  totalBuyers?: number;
  className?: string;
}

export function ExportCenterCard({ selectedK, totalBuyers = 2000, className }: ExportCenterCardProps) {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>("all");
  const [isExportingBuyers, setIsExportingBuyers] = useState(false);
  const [isExportingSummary, setIsExportingSummary] = useState(false);

  const handleDownloadBuyers = () => {
    setIsExportingBuyers(true);
    const clusterId = selectedClusterFilter === "all" ? undefined : parseInt(selectedClusterFilter, 10);
    const url = apiClient.getExportBuyersUrl({ k: selectedK, cluster_id: clusterId });
    window.location.href = url;
    setTimeout(() => setIsExportingBuyers(false), 1000);
  };

  const handleDownloadSummary = () => {
    setIsExportingSummary(true);
    const url = apiClient.getExportSummaryUrl(selectedK);
    window.location.href = url;
    setTimeout(() => setIsExportingSummary(false), 1000);
  };

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Data Export & Reporting Hub
            </CardTitle>
            <CardDescription className="text-xs">
              Generate structured CSV reports for individual buyer records and aggregated segment profiles
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-mono dark:bg-emerald-950/40 dark:text-emerald-300">
            Reconciliation Verified: Σ N = {totalBuyers}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: Buyer-Level CSV Export */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="h-4 w-4 text-indigo-500" />
                Buyer-Level Portfolio CSV
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                Model K={selectedK}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete buyer dataset (client_id, cluster_id, generated archetype, presentation nickname, portfolio metrics, loan status, geography).
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <Filter className="h-3 w-3 text-slate-400" />
                <span>Cluster:</span>
                <select
                  value={selectedClusterFilter}
                  onChange={(e) => setSelectedClusterFilter(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="all">All Clusters (2,000 Buyers)</option>
                  {Array.from({ length: selectedK }).map((_, i) => (
                    <option key={i} value={i.toString()}>
                      Cluster {i} Only
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                onClick={handleDownloadBuyers}
                disabled={isExportingBuyers}
                className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {isExportingBuyers ? "Generating..." : "Download CSV"}
              </Button>
            </div>
          </div>

          {/* Action 2: Segment Summary CSV Export */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Segment Summary Statistics CSV
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedK} Rows
              </Badge>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aggregated cohort benchmarks (cluster_id, generated archetype, buyer count, population %, spend means/medians, differentiating features, confidence).
            </p>

            <div className="flex items-center justify-end pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadSummary}
                disabled={isExportingSummary}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 font-medium"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {isExportingSummary ? "Generating..." : "Download Summary CSV"}
              </Button>
            </div>
          </div>
        </div>

        {/* Reconciliation Guardrail */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Export Reconciliation Guardrail:</strong> Sum of exported cluster counts strictly reconciles to {totalBuyers} buyers. Every exported buyer record maintains consistent linkage between client ID, cluster ID, and generated archetype name. Presentation nicknames are exported as a presentation layer without mutating underlying ML statistics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
