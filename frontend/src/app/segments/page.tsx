"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KSelector } from "@/components/segmentation/k-selector";
import { ModelQualityCard } from "@/components/segmentation/model-quality-card";
import { ClusterComparisonCards } from "@/components/segmentation/cluster-comparison-cards";
import { PCAScatterPlot } from "@/components/segmentation/pca-scatter-plot";
import { BuyerAssignmentTable } from "@/components/segmentation/buyer-assignment-table";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";

export default function SegmentsPage() {
  const queryClient = useQueryClient();
  const [selectedK, setSelectedK] = useState<number>(3);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  // 1. Fetch Candidate K Evaluation Diagnostics
  const {
    data: evaluation,
    isLoading: isEvalLoading,
    error: evalError,
  } = useQuery({
    queryKey: ["ml-evaluation"],
    queryFn: () => apiClient.getCandidateKEvaluation(),
  });

  // 2. Fetch Active Segmentation
  const {
    data: segmentation,
    isLoading: isSegLoading,
    error: segError,
    refetch: refetchSeg,
  } = useQuery({
    queryKey: ["active-segmentation", selectedK],
    queryFn: () => apiClient.runSegmentation({ k: selectedK, random_state: 42, n_init: 20 }),
  });

  // 3. Fetch 2D/3D PCA Scatter Projection
  const {
    data: projection,
    isLoading: isProjLoading,
    error: projError,
    refetch: refetchProj,
  } = useQuery({
    queryKey: ["pca-projection", selectedK],
    queryFn: () => apiClient.getPCAProjection(),
  });

  // 4. Fetch All Customer Portfolio Profiles
  const {
    data: buyers,
    isLoading: isBuyersLoading,
    error: buyersError,
  } = useQuery({
    queryKey: ["all-buyers"],
    queryFn: () => apiClient.getBuyers(),
  });

  // 5. Mutation for Changing K
  const segmentationMutation = useMutation({
    mutationFn: (newK: number) =>
      apiClient.runSegmentation({ k: newK, random_state: 42, n_init: 20 }),
    onSuccess: (data, newK) => {
      setSelectedK(newK);
      setSelectedClusterId(null); // Reset cluster filter on new K
      queryClient.setQueryData(["active-segmentation", newK], data);
      queryClient.invalidateQueries({ queryKey: ["pca-projection"] });
      queryClient.invalidateQueries({ queryKey: ["dataset-status"] });
    },
  });

  const handleSelectK = (newK: number) => {
    if (newK === selectedK) return;
    segmentationMutation.mutate(newK);
  };

  const isLoading = isEvalLoading || isSegLoading || isProjLoading || isBuyersLoading;
  const isMutating = segmentationMutation.isPending;
  const hasError = evalError || segError || projError || buyersError;
  const errorMessage =
    evalError?.message ||
    segError?.message ||
    projError?.message ||
    buyersError?.message ||
    "Failed to load segmentation models or scatter projection data.";

  const recommendedK = evaluation?.recommended_k || 3;
  const activeMetrics = segmentation?.metrics;

  return (
    <DashboardShell
      title="Buyer Segmentation & Interactive Cluster Visualization"
      subtitle="Unsupervised K-Means clustering, empirical archetype interpretations, and interactive 2D/3D PCA projections"
      onRefresh={() => {
        refetchSeg();
        refetchProj();
      }}
    >
      <div className="space-y-8">
        {/* Error Notification */}
        {hasError && (
          <ErrorBanner
            title="Segmentation Engine Error"
            message={errorMessage}
            onRetry={() => {
              refetchSeg();
              refetchProj();
            }}
          />
        )}

        {/* Hyperparameter K Selection Control */}
        <section aria-labelledby="k-selection-heading">
          <h2 id="k-selection-heading" className="sr-only">
            Cluster Count Selection
          </h2>
          <KSelector
            selectedK={selectedK}
            recommendedK={recommendedK}
            onSelectK={handleSelectK}
            isLoading={isMutating}
          />
        </section>

        {/* Model Evaluation Diagnostics Card */}
        <section aria-labelledby="model-quality-heading">
          <h2 id="model-quality-heading" className="sr-only">
            Model Evaluation Diagnostics
          </h2>
          {isLoading ? (
            <Skeleton className="h-44 w-full rounded-xl" />
          ) : (
            <ModelQualityCard
              metrics={activeMetrics}
              recommendedK={recommendedK}
              recommendationRationale={evaluation?.recommendation_rationale}
              selectedK={selectedK}
            />
          )}
        </section>

        {/* Cluster Archetypes Comparison Grid */}
        <section aria-labelledby="cluster-comparison-heading">
          <h2 id="cluster-comparison-heading" className="sr-only">
            Cluster Archetype Summaries
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : segmentation ? (
            <ClusterComparisonCards
              profiles={segmentation.cluster_profiles}
              archetypes={segmentation.archetypes}
              selectedClusterId={selectedClusterId}
              onSelectCluster={setSelectedClusterId}
              activeK={selectedK}
            />
          ) : null}
        </section>

        {/* Interactive 2D / 3D PCA Scatter Plot */}
        <section aria-labelledby="pca-scatter-heading">
          <h2 id="pca-scatter-heading" className="sr-only">
            PCA Scatter Projection
          </h2>
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : projection && segmentation ? (
            <PCAScatterPlot
              points={projection.points}
              archetypes={segmentation.archetypes}
              explainedVarianceRatio={projection.explained_variance_ratio}
              totalExplainedVariance={projection.total_explained_variance}
              featureCount={projection.feature_count}
              selectedClusterId={selectedClusterId}
              onSelectCluster={setSelectedClusterId}
            />
          ) : null}
        </section>

        {/* Searchable & Filterable Buyer Assignment Table */}
        <section aria-labelledby="buyer-table-heading">
          <h2 id="buyer-table-heading" className="sr-only">
            Buyer Assignment Table
          </h2>
          {isLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : buyers && segmentation ? (
            <BuyerAssignmentTable
              buyers={buyers}
              assignments={segmentation.cluster_assignments}
              archetypes={segmentation.archetypes}
              selectedClusterId={selectedClusterId}
              onSelectCluster={setSelectedClusterId}
            />
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}
