"""Hierarchical Agglomerative clustering and dendrogram linkage tree computation."""

import time
from collections import Counter
from typing import Dict, List, Optional
import numpy as np
from scipy.cluster.hierarchy import cophenet, linkage
from scipy.spatial.distance import pdist
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import (
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)

from parcllabs.core.exceptions import ClusteringConfigurationError
from parcllabs.ml.contracts import (
    CandidateKMetrics,
    ClusteringConfig,
    ClusteringRunResult,
    HierarchicalLinkageResult,
    ProcessedMLMatrix,
)

class HierarchicalClusterer:
    """Agglomerative Hierarchical clustering using Ward minimum variance linkage."""

    def __init__(self, config: Optional[ClusteringConfig] = None) -> None:
        self.config: ClusteringConfig = config or ClusteringConfig(algorithm="hierarchical")

    def fit(self, matrix: ProcessedMLMatrix) -> ClusteringRunResult:
        """
        Execute Hierarchical Agglomerative clustering on the processed feature matrix.

        Args:
            matrix: Standardized ProcessedMLMatrix.

        Returns:
            ClusteringRunResult with cluster assignments and evaluation metrics.

        Raises:
            ClusteringConfigurationError: If K < 2 or K >= N.
        """
        n_samples = matrix.sample_count
        if n_samples < 2:
            raise ClusteringConfigurationError(f"Insufficient samples for clustering: N={n_samples}")

        k = self.config.k
        if k < 2:
            raise ClusteringConfigurationError(f"K must be at least 2; received K={k}")

        if k >= n_samples:
            raise ClusteringConfigurationError(
                f"Cluster count K={k} exceeds or equals sample count N={n_samples}."
            )

        start_time = time.perf_counter()

        model = AgglomerativeClustering(
            n_clusters=k,
            linkage="ward",
            metric="euclidean",
        )
        labels = model.fit_predict(matrix.data)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Calculate cluster distributions
        size_counts = Counter(labels)
        cluster_sizes: Dict[int, int] = {i: int(size_counts.get(i, 0)) for i in range(k)}
        cluster_percentages: Dict[int, float] = {
            i: round((count / n_samples) * 100.0, 3) for i, count in cluster_sizes.items()
        }
        min_cluster_pct = min(cluster_percentages.values())

        # Calculate WCSS (within-cluster sum of squares)
        wcss = 0.0
        for i in range(k):
            cluster_points = matrix.data[labels == i]
            if len(cluster_points) > 0:
                centroid = cluster_points.mean(axis=0)
                wcss += float(np.sum((cluster_points - centroid) ** 2))

        sil_val = float(silhouette_score(matrix.data, labels))
        ch_val = float(calinski_harabasz_score(matrix.data, labels))
        db_val = float(davies_bouldin_score(matrix.data, labels))

        candidate_metrics = CandidateKMetrics(
            k=k,
            inertia=round(wcss, 2),
            silhouette_score=round(sil_val, 4),
            calinski_harabasz=round(ch_val, 2),
            davies_bouldin=round(db_val, 4),
            min_cluster_pct=round(min_cluster_pct, 3),
            cluster_sizes=cluster_sizes,
        )

        cluster_assignments: Dict[str, int] = {
            matrix.client_ids[i]: int(labels[i]) for i in range(n_samples)
        }

        return ClusteringRunResult(
            algorithm="hierarchical",
            k=k,
            random_state=self.config.random_state,
            cluster_assignments=cluster_assignments,
            cluster_sizes=cluster_sizes,
            cluster_percentages=cluster_percentages,
            metrics=candidate_metrics,
            feature_names=matrix.feature_names,
            execution_time_ms=round(elapsed_ms, 2),
            preprocessing_config=self.config.preprocessing_config,
        )

    def compute_dendrogram_linkage(
        self,
        matrix: ProcessedMLMatrix,
        sample_size: Optional[int] = None,
    ) -> HierarchicalLinkageResult:
        """
        Compute the Ward linkage matrix Z and cophenetic correlation for dendrogram visualization.

        Args:
            matrix: Standardized ProcessedMLMatrix.
            sample_size: Optional maximum number of samples to include (for rendering performance).

        Returns:
            HierarchicalLinkageResult containing linkage matrix and leaf labels.
        """
        data = matrix.data
        labels = matrix.client_ids

        if sample_size is not None and sample_size < len(data):
            np.random.seed(self.config.random_state)
            indices = np.sort(np.random.choice(len(data), size=sample_size, replace=False))
            data = data[indices]
            labels = [labels[i] for i in indices]

        Z = linkage(data, method="ward", metric="euclidean")
        coph_corr, _ = cophenet(Z, pdist(data))

        return HierarchicalLinkageResult(
            linkage_matrix=Z.tolist(),
            leaf_labels=labels,
            cophenetic_correlation=round(float(coph_corr), 4),
            sample_size=len(data),
        )
