import time
from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.contracts import PreprocessingConfig, ClusteringConfig
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.evaluator import ClusterEvaluator
from parcllabs.ml.hierarchical import HierarchicalClusterer

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_clustering_and_evaluation() -> None:
    config = DomainConfig(reference_date=date(2024, 1, 1))
    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    # Preprocess with default config (include_gender=False)
    prep = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = prep.fit_transform(profiles)
    assert matrix.sample_count == 2000

    # 1. Evaluate candidate K from 2 to 10
    start_eval = time.perf_counter()
    evaluator = ClusterEvaluator(min_k=2, max_k=10, min_cluster_pct_threshold=4.0)
    evaluation = evaluator.evaluate(matrix)
    eval_elapsed_ms = (time.perf_counter() - start_eval) * 1000.0

    assert len(evaluation.evaluations) == 9  # K=2..10
    assert 2 <= evaluation.recommended_k <= 10
    assert evaluation.recommendation_rationale

    # 2. Run recommended K-Means model
    clusterer = KMeansClusterer(ClusteringConfig(k=evaluation.recommended_k, random_state=42, n_init=20))
    run_result = clusterer.fit(matrix)

    assert run_result.k == evaluation.recommended_k
    assert len(run_result.cluster_assignments) == 2000
    assert sum(run_result.cluster_sizes.values()) == 2000
    assert pytest.approx(sum(run_result.cluster_percentages.values()), rel=1e-3) == 100.0

    # 3. Hierarchical Linkage Validation
    h_clusterer = HierarchicalClusterer(ClusteringConfig(k=evaluation.recommended_k))
    dendrogram_data = h_clusterer.compute_dendrogram_linkage(matrix, sample_size=150)
    assert len(dendrogram_data.linkage_matrix) == 149
    assert len(dendrogram_data.leaf_labels) == 150
    assert dendrogram_data.cophenetic_correlation > 0.0

    print(f"\nBaseline K-Means evaluation (K=2..10) completed in {eval_elapsed_ms:.2f} ms")
    print(f"Recommended K: {evaluation.recommended_k}")
    print(f"Recommendation Rationale: {evaluation.recommendation_rationale}")
