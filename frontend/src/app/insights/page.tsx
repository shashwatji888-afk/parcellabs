"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { SegmentSelectorTabs } from "@/components/insights/segment-selector-tabs";
import { SegmentHeroCard } from "@/components/insights/segment-hero-card";
import { EvidencePanel } from "@/components/insights/evidence-panel";
import { FeatureDistributionsCard } from "@/components/insights/feature-distributions-card";
import { CategoricalBreakdownCard } from "@/components/insights/categorical-breakdown-card";
import { SegmentBuyerTable } from "@/components/insights/segment-buyer-table";

const NICKNAME_STORAGE_KEY_PREFIX = "parcllabs_presentation_nickname_";

function getStoredNicknames(k: number): Record<number, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(`${NICKNAME_STORAGE_KEY_PREFIX}k${k}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function InsightsStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlK = searchParams.get("k");
  const urlCluster = searchParams.get("clusterId");

  const [activeK, setActiveK] = useState<number>(urlK ? parseInt(urlK, 10) || 3 : 3);
  const [selectedClusterId, setSelectedClusterId] = useState<number>(
    urlCluster ? parseInt(urlCluster, 10) || 0 : 0
  );

  // Presentation Nicknames state (persisted in browser localStorage)
  const [nicknames, setNicknames] = useState<Record<number, string>>(() =>
    getStoredNicknames(urlK ? parseInt(urlK, 10) || 3 : 3)
  );

  const handleSaveNickname = (clusterId: number, nickname: string) => {
    const updated = { ...nicknames, [clusterId]: nickname };
    setNicknames(updated);
    try {
      localStorage.setItem(
        `${NICKNAME_STORAGE_KEY_PREFIX}k${activeK}`,
        JSON.stringify(updated)
      );
    } catch {
      // Ignored
    }
  };

  const handleResetNickname = (clusterId: number) => {
    const updated = { ...nicknames };
    delete updated[clusterId];
    setNicknames(updated);
    try {
      localStorage.setItem(
        `${NICKNAME_STORAGE_KEY_PREFIX}k${activeK}`,
        JSON.stringify(updated)
      );
    } catch {
      // Ignored
    }
  };

  // 1. Candidate K Evaluation
  const { data: evaluation } = useQuery({
    queryKey: ["candidate-k-evaluation"],
    queryFn: () => apiClient.getCandidateKEvaluation(),
  });

  // 2. Segmentation Solution
  const {
    data: segmentation,
    isLoading: isSegLoading,
    isError: isSegError,
    error: segError,
    refetch: refetchSeg,
  } = useQuery({
    queryKey: ["segmentation-solution", activeK],
    queryFn: () => apiClient.runSegmentation({ k: activeK }),
  });

  // 3. Buyers
  const {
    data: buyers,
    isLoading: isBuyersLoading,
  } = useQuery({
    queryKey: ["all-buyers"],
    queryFn: () => apiClient.getBuyers(),
  });

  const recommendedK = evaluation?.recommended_k || 3;

  // Selected silhouette score
  const activeEval = evaluation?.evaluations.find((e) => e.k === activeK);
  const silhouetteScore = activeEval?.silhouette_score || 0.183;

  const clusterProfiles = useMemo(() => {
    if (!segmentation) return {};
    return segmentation.cluster_profiles || (segmentation as unknown as { profiles: typeof segmentation.cluster_profiles }).profiles || {};
  }, [segmentation]);

  const archetypes = useMemo(() => {
    if (!segmentation) return {};
    return segmentation.archetypes || {};
  }, [segmentation]);

  const clusterIds = useMemo(() => {
    return Object.keys(clusterProfiles)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);
  }, [clusterProfiles]);

  const currentClusterId = useMemo(() => {
    if (clusterIds.length > 0 && !clusterIds.includes(selectedClusterId)) {
      return clusterIds[0];
    }
    return selectedClusterId;
  }, [clusterIds, selectedClusterId]);

  const activeProfile = clusterProfiles[currentClusterId];
  const activeArchetype = archetypes[currentClusterId];

  // Filter buyers for selected cluster
  const clusterBuyers = useMemo(() => {
    if (!buyers || !segmentation?.cluster_assignments) return [];
    return buyers.filter(
      (b) => segmentation.cluster_assignments[b.client_id] === currentClusterId
    );
  }, [buyers, segmentation, currentClusterId]);

  const isLoading = isSegLoading || isBuyersLoading;
  const isError = isSegError;
  const errorMessage = segError instanceof Error ? segError.message : "Failed to load segment insights";

  const handleSelectCluster = (clusterId: number) => {
    setSelectedClusterId(clusterId);
    router.replace(`/insights?k=${activeK}&clusterId=${clusterId}`, { scroll: false });
  };

  const handleSelectK = (newK: number) => {
    setActiveK(newK);
    setSelectedClusterId(0);
    setNicknames(getStoredNicknames(newK));
    router.replace(`/insights?k=${newK}&clusterId=0`, { scroll: false });
  };

  const segmentDisplayName =
    nicknames[currentClusterId] ||
    activeArchetype?.generated_name ||
    `Segment C${currentClusterId}`;

  return (
    <div className="space-y-6">
      {/* Model K Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
            Individual Cohort Workspace
          </Badge>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Partition Model:
          </span>
          <div className="flex items-center gap-1.5">
            {[2, 3, 4, 5, 6].map((k) => (
              <Button
                key={k}
                size="sm"
                variant={activeK === k ? "default" : "outline"}
                onClick={() => handleSelectK(k)}
                className={`text-xs h-7 px-2.5 font-mono ${
                  activeK === k ? "bg-indigo-600 text-white" : ""
                }`}
              >
                K={k} {k === recommendedK ? "★" : ""} {k === 4 ? "μ" : ""}
              </Button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchSeg()}
          disabled={isLoading}
          className="text-xs h-8"
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Failed to Load Segment Insights
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300">{errorMessage}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchSeg()}
                className="mt-2 text-xs border-rose-300 bg-white hover:bg-rose-50 text-rose-900"
              >
                Retry Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !segmentation && (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {/* Studio Content */}
      {!isLoading && segmentation && activeProfile && activeArchetype && (
        <div className="space-y-6">
          {/* 1. Segment Selector Tabs Strip */}
          <SegmentSelectorTabs
            clusterIds={clusterIds}
            profiles={clusterProfiles}
            archetypes={archetypes}
            selectedClusterId={currentClusterId}
            onSelectCluster={handleSelectCluster}
            activeK={activeK}
            recommendedK={recommendedK}
            nicknames={nicknames}
          />

          {/* 2. Segment Hero Card */}
          <SegmentHeroCard
            clusterId={currentClusterId}
            profile={activeProfile}
            archetype={activeArchetype}
            activeK={activeK}
            silhouetteScore={silhouetteScore}
            nickname={nicknames[currentClusterId]}
            onSaveNickname={handleSaveNickname}
            onResetNickname={handleResetNickname}
          />

          {/* 3. Evidence & Analytical Guardrails Panel */}
          <EvidencePanel
            archetype={activeArchetype}
            profile={activeProfile}
          />

          {/* 4. Numerical Distributions vs Population */}
          <FeatureDistributionsCard
            profile={activeProfile}
          />

          {/* 5. Categorical Breakdown vs Population */}
          <CategoricalBreakdownCard
            profile={activeProfile}
          />

          {/* 6. Segment Member Buyer Table */}
          <SegmentBuyerTable
            buyers={clusterBuyers}
            clusterId={currentClusterId}
            segmentDisplayName={segmentDisplayName}
          />
        </div>
      )}
    </div>
  );
}

export default function InsightsStudioPage() {
  return (
    <DashboardShell
      title="Segment Deep-Dive Studio"
      subtitle="Granular profiling, statistical evidence, continuous distributions, micro-level buyer registry, and custom analyst presentation nicknames"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        }
      >
        <InsightsStudioContent />
      </Suspense>
    </DashboardShell>
  );
}
