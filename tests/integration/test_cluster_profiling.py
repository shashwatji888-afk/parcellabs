from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.contracts import PreprocessingConfig, ClusteringConfig
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.profiler import ClusterProfiler

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_cluster_profiling_k3_and_k4() -> None:
    config = DomainConfig(reference_date=date(2024, 1, 1))
    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    prep = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = prep.fit_transform(profiles)
    profiler = ClusterProfiler()

    # 1. Test K=3 profiling
    k3_clusterer = KMeansClusterer(ClusteringConfig(k=3, random_state=42, n_init=20))
    k3_res = k3_clusterer.fit(matrix)
    k3_profile = profiler.profile(profiles, k3_res.cluster_assignments)

    assert k3_profile.k == 3
    assert k3_profile.population_size == 2000
    assert len(k3_profile.clusters) == 3
    # Check that loan_applied_binary is strongly differentiating in K=3
    all_k3_diffs = []
    for c in k3_profile.clusters.values():
        all_k3_diffs.extend(c.differentiating_features)
    assert any("loan_applied_binary" in d for d in all_k3_diffs)

    # 2. Test K=4 profiling
    k4_clusterer = KMeansClusterer(ClusteringConfig(k=4, random_state=42, n_init=20))
    k4_res = k4_clusterer.fit(matrix)
    k4_profile = profiler.profile(profiles, k4_res.cluster_assignments)

    assert k4_profile.k == 4
    assert len(k4_profile.clusters) == 4
    # Check that the 51-client micro-cluster (Cluster 0) has high total_properties mean (> 7.0)
    micro_cluster = next(c for c in k4_profile.clusters.values() if c.count == 51)
    assert micro_cluster.numerical_profiles["total_properties"].mean > 7.0
    assert micro_cluster.numerical_profiles["total_spend"].mean > 2000000.0
    # Crucially assert that its office_ratio is NOT elevated (Z < 0.2)
    assert abs(micro_cluster.numerical_profiles["office_ratio"].z_score_deviation) < 0.2
