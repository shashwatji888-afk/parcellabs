"""K-Means clustering implementation with deterministic execution and diagnostic evaluation."""

import time
from collections import Counter
from typing import Dict, List, Optional
import numpy as np
from sklearn.cluster import KMeans
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
    ProcessedMLMatrix,
)

class KMeansClusterer:
    """Deterministic K-Means clustering engine using k-means++ initialization."""

    def __init__(self, config: Optional[ClusteringConfig] = None) -> None:
        self.config: ClusteringConfig = config or ClusteringConfig(algorithm="kmeans")

    def fit(self, matrix: ProcessedMLMatrix) -> ClusteringRunResult:
        """
        Execute K-Means clustering on the processed feature matrix.

        Args:
            matrix: Standardized ProcessedMLMatrix.

        Returns:
            ClusteringRunResult with assignments, metrics, and execution timing.

        Raises:
            ClusteringConfigurationError: If K < 2, K >= N, or data contains NaNs/Infs.
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

        if np.isnan(matrix.data).any() or np.isinf(matrix.data).any():
            raise ClusteringConfigurationError("Input feature matrix contains NaN or Inf values.")

        start_time = time.perf_counter()

        model = KMeans(
            n_clusters=k,
            init="k-means++",
            n_init=self.config.n_init,
            max_iter=300,
            random_state=self.config.random_state,
        )
        model.fit(matrix.data)
        labels = model.labels_

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # Calculate cluster distributions
        size_counts = Counter(labels)
        cluster_sizes: Dict[int, int] = {i: int(size_counts.get(i, 0)) for i in range(k)}
        cluster_percentages: Dict[int, float] = {
            i: round((count / n_samples) * 100.0, 3) for i, count in cluster_sizes.items()
        }
        min_cluster_pct = min(cluster_percentages.values())

        # Calculate metrics
        inertia_val = float(model.inertia_)
        sil_val = float(silhouette_score(matrix.data, labels))
        ch_val = float(calinski_harabasz_score(matrix.data, labels))
        db_val = float(davies_bouldin_score(matrix.data, labels))

        candidate_metrics = CandidateKMetrics(
            k=k,
            inertia=round(inertia_val, 2),
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
            algorithm="kmeans",
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
