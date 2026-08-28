"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Sliders,
  GitCompare,
  GitFork,
  Database,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";

import { DiagnosticsKPISummary } from "@/components/diagnostics/diagnostics-kpi-summary";
import { DiagnosticChartsGrid } from "@/components/diagnostics/diagnostic-charts-grid";
import { CandidateKTable } from "@/components/diagnostics/candidate-k-table";
import { StabilityAnalysisCard } from "@/components/diagnostics/stability-analysis-card";
import { DendrogramViewer } from "@/components/diagnostics/dendrogram-viewer";
import { FeatureMetadataCard } from "@/components/diagnostics/feature-metadata-card";
import { DataQualityCard } from "@/components/diagnostics/data-quality-card";
import { ExportCenterCard } from "@/components/diagnostics/export-center-card";

type TabId = "evaluation" | "stability" | "hierarchical" | "features" | "quality" | "export";

export default function DiagnosticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("evaluation");
  const [selectedK, setSelectedK] = useState<number>(3);

  const {
    data: evaluation,
    isLoading: isEvalLoading,
    isError: isEvalError,
    error: evalError,
    refetch: refetchEval,
  } = useQuery({
    queryKey: ["candidate-k-evaluation"],
    queryFn: () => apiClient.getCandidateKEvaluation(),
  });

  const {
    data: hierarchical,
    isLoading: isHierLoading,
    refetch: refetchHier,
  } = useQuery({
    queryKey: ["hierarchical-clustering"],
    queryFn: () => apiClient.getHierarchicalClustering(150),
  });

  const {
    data: stability,
    isLoading: isStabLoading,
    refetch: refetchStab,
  } = useQuery({
    queryKey: ["cluster-stability", selectedK],
    queryFn: () => apiClient.getClusterStability(selectedK),
  });

  const {
    data: featureMeta,
    isLoading: isMetaLoading,
    refetch: refetchMeta,
  } = useQuery({
    queryKey: ["feature-metadata"],
    queryFn: () => apiClient.getFeatureMetadata(),
  });

  const {
    data: dataQuality,
    isLoading: isQualLoading,
    refetch: refetchQual,
  } = useQuery({
    queryKey: ["data-quality"],
    queryFn: () => apiClient.getDataQuality(),
  });

  const isLoading = isEvalLoading || isHierLoading || isStabLoading || isMetaLoading || isQualLoading;
  const isError = isEvalError;
  const errorMessage = evalError instanceof Error ? evalError.message : "Failed to load model diagnostics";

  const handleRefreshAll = () => {
    refetchEval();
    refetchHier();
    refetchStab();
    refetchMeta();
    refetchQual();
  };

  const handleSelectK = (newK: number) => {
    setSelectedK(newK);
  };

  const selectedMetrics = evaluation?.evaluations.find((e) => e.k === selectedK);

  return (
    <DashboardShell
      title="Machine Learning Model Diagnostics Lab"
      subtitle="Comprehensive candidate K evaluations, multi-seed stability convergence, hierarchical linkage tree, and data export"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl dark:bg-slate-900/60">
            <button
              onClick={() => setActiveTab("evaluation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "evaluation"
                  ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>K Evaluation & Curves</span>
            </button>

            <button
              onClick={() => setActiveTab("stability")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "stability"
                  ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Multi-Seed Stability</span>
            </button>

            <button
              onClick={() => setActiveTab("hierarchical")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "hierarchical"
                  ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Hierarchical Dendrogram</span>
            </button>

            <button
              onClick={() => setActiveTab("features")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "features"
                  ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Feature Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab("quality")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "quality"
                  ? "bg-white text-indigo-600 shadow-2xs dark:bg-slate-800 dark:text-indigo-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Data Quality</span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "export"
                  ? "bg-white text-emerald-600 shadow-2xs dark:bg-slate-800 dark:text-emerald-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Data Export</span>
            </button>
          </div>

          {/* Quick Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="text-xs h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Diagnostics
          </Button>
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                  Failed to Load Model Diagnostics
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshAll}
                  className="mt-2 text-xs border-rose-300 bg-white hover:bg-rose-50 text-rose-900"
                >
                  Retry Diagnostic Execution
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !evaluation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        )}

        {/* Content Tabs */}
        {!isLoading && evaluation && (
          <div className="space-y-6">
            {/* Top KPI Strip (Always visible for context) */}
            <DiagnosticsKPISummary
              evaluation={evaluation}
              selectedMetrics={selectedMetrics}
              selectedK={selectedK}
            />

            {activeTab === "evaluation" && (
              <div className="space-y-6">
                <DiagnosticChartsGrid
                  evaluations={evaluation.evaluations}
                  selectedK={selectedK}
                  recommendedK={evaluation.recommended_k}
                  onSelectK={handleSelectK}
                />
                <CandidateKTable
                  evaluations={evaluation.evaluations}
                  selectedK={selectedK}
                  recommendedK={evaluation.recommended_k}
                  minClusterPctThreshold={evaluation.min_cluster_pct_threshold}
                  onSelectK={handleSelectK}
                />
              </div>
            )}

            {activeTab === "stability" && stability && (
              <div className="space-y-6">
                <StabilityAnalysisCard stability={stability} />
                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Switch partition model to test stability:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4, 5, 6].map((k) => (
                      <Button
                        key={k}
                        size="sm"
                        variant={selectedK === k ? "default" : "outline"}
                        onClick={() => handleSelectK(k)}
                        className={`text-xs h-7 px-2.5 font-mono ${
                          selectedK === k ? "bg-indigo-600 text-white" : ""
                        }`}
                      >
                        K={k}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hierarchical" && hierarchical && (
              <div className="space-y-6">
                <DendrogramViewer linkageResult={hierarchical} />
              </div>
            )}

            {activeTab === "features" && featureMeta && (
              <div className="space-y-6">
                <FeatureMetadataCard metadata={featureMeta} />
              </div>
            )}

            {activeTab === "quality" && dataQuality && (
              <div className="space-y-6">
                <DataQualityCard auditReport={dataQuality} />
              </div>
            )}

            {activeTab === "export" && (
              <div className="space-y-6">
                <ExportCenterCard
                  selectedK={selectedK}
                  totalBuyers={dataQuality?.total_clients_audited || 2000}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
