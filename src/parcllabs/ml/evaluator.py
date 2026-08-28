"""Candidate K evaluation engine assessing clustering quality across multiple diagnostic metrics."""

from typing import List, Optional
from parcllabs.core.exceptions import ClusteringConfigurationError
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.contracts import (
    CandidateKEvaluation,
    CandidateKMetrics,
    ClusteringConfig,
    ProcessedMLMatrix,
)

class ClusterEvaluator:
    """
    Evaluates candidate cluster counts across multiple metrics:
    - Silhouette Score (cohesion vs separation)
    - Inertia / WCSS (Elbow analysis)
    - Calinski-Harabasz Index (variance ratio)
    - Davies-Bouldin Index (cluster similarity)
    - Micro-cluster size constraints
    """

    def __init__(
        self,
        min_k: int = 2,
        max_k: int = 10,
        min_cluster_pct_threshold: float = 4.0,
        random_state: int = 42,
        n_init: int = 20,
    ) -> None:
        if min_k < 2:
            raise ClusteringConfigurationError(f"min_k must be at least 2; received min_k={min_k}")
        if max_k < min_k:
            raise ClusteringConfigurationError(f"max_k ({max_k}) cannot be less than min_k ({min_k})")

        self.min_k: int = min_k
        self.max_k: int = max_k
        self.min_cluster_pct_threshold: float = min_cluster_pct_threshold
        self.random_state: int = random_state
        self.n_init: int = n_init

    def evaluate(self, matrix: ProcessedMLMatrix) -> CandidateKEvaluation:
        """
        Evaluate clustering across candidate K values and produce explainable recommendations.

        Args:
            matrix: Standardized ProcessedMLMatrix.

        Returns:
            CandidateKEvaluation with all diagnostic curves and rationale.
        """
        n_samples = matrix.sample_count
        effective_max_k = min(self.max_k, n_samples - 1)

        evaluations: List[CandidateKMetrics] = []
        for k in range(self.min_k, effective_max_k + 1):
            clusterer = KMeansClusterer(
                ClusteringConfig(
                    k=k,
                    random_state=self.random_state,
                    n_init=self.n_init,
                    min_cluster_pct_threshold=self.min_cluster_pct_threshold,
                )
            )
            result = clusterer.fit(matrix)
            evaluations.append(result.metrics)

        # 1. Filter candidates by micro-cluster threshold constraint
        valid_candidates = [
            m for m in evaluations if m.min_cluster_pct >= self.min_cluster_pct_threshold
        ]
        pool = valid_candidates if valid_candidates else evaluations

        # 2. Rank candidates primarily by Silhouette Score (descending), tie-broken by Davies-Bouldin (ascending)
        ranked = sorted(pool, key=lambda m: (m.silhouette_score, -m.davies_bouldin), reverse=True)
        top_metric = ranked[0]
        recommended_k = top_metric.k

        # 3. Identify close competitive alternatives (within 5% of top silhouette score)
        alternatives: List[int] = [
            m.k
            for m in pool
            if m.k != recommended_k and m.silhouette_score >= (top_metric.silhouette_score * 0.95)
        ]

        # 4. Synthesize human-readable rationale
        alt_text = f" K={alternatives[0]} is a competitive alternative (Silhouette: {next(m.silhouette_score for m in pool if m.k == alternatives[0]):.4f})." if alternatives else ""
        constraint_note = f" All clusters satisfy the minimum {self.min_cluster_pct_threshold}% population threshold (smallest cluster: {top_metric.min_cluster_pct:.1f}%)." if valid_candidates else f" Note: Candidates with small clusters (<{self.min_cluster_pct_threshold}%) were considered as no partition met the size constraint."

        rationale = (
            f"K={recommended_k} is recommended with the optimal Silhouette Score ({top_metric.silhouette_score:.4f}) "
            f"and strong cluster separation (Davies-Bouldin: {top_metric.davies_bouldin:.4f}, Calinski-Harabasz: {top_metric.calinski_harabasz:.1f})."
            f"{constraint_note}{alt_text}"
        )

        return CandidateKEvaluation(
            evaluations=evaluations,
            recommended_k=recommended_k,
            recommendation_rationale=rationale,
            alternative_k_candidates=alternatives,
            min_cluster_pct_threshold=self.min_cluster_pct_threshold,
        )
