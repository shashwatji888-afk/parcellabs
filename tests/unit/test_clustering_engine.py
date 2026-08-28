from datetime import date
from typing import List
import numpy as np
import pytest

from parcllabs.core.exceptions import ClusteringConfigurationError
from parcllabs.models.analytical import CustomerPortfolioProfile
from parcllabs.ml.contracts import (
    ClusteringConfig,
    PreprocessingConfig,
    ProcessedMLMatrix,
)
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.evaluator import ClusterEvaluator
from parcllabs.ml.hierarchical import HierarchicalClusterer

@pytest.fixture
def synthetic_profiles() -> List[CustomerPortfolioProfile]:
    """Generates 30 synthetic profiles split across two distinct behavioral clusters."""
    profiles: List[CustomerPortfolioProfile] = []
    # Group 1: 15 young first-time buyers with small portfolios and loans
    for i in range(15):
        profiles.append(
            CustomerPortfolioProfile(
                client_id=f"C{i+1:04d}",
                client_type="Individual",
                first_name="User",
                last_name=f"Young{i}",
                gender="F" if i % 2 == 0 else "M",
                country="USA",
                region="California",
                date_of_birth_parsed=date(1995, 1, 1),
                age=29,
                acquisition_purpose="Home",
                satisfaction_score=3,
                loan_applied="Yes",
                loan_applied_binary=1,
                referral_channel="Website",
                total_properties=3,
                total_spend=600000.0 + (i * 10000),
                avg_price_per_unit=200000.0,
                avg_floor_area_sqft=750.0,
                office_units_count=0,
                office_ratio=0.0,
                apartment_units_count=3,
                apartment_ratio=1.0,
            )
        )
    # Group 2: 15 corporate buyers with multi-unit office portfolios and high spend
    for i in range(15, 30):
        profiles.append(
            CustomerPortfolioProfile(
                client_id=f"C{i+1:04d}",
                client_type="Company",
                first_name="Corp",
                last_name=f"Invest{i}",
                gender="M",
                country="Canada",
                region="Ontario",
                date_of_birth_parsed=date(1970, 1, 1),
                age=54,
                acquisition_purpose="Investment",
                satisfaction_score=5,
                loan_applied="No",
                loan_applied_binary=0,
                referral_channel="Agency",
                total_properties=10,
                total_spend=3000000.0 + (i * 20000),
                avg_price_per_unit=300000.0,
                avg_floor_area_sqft=1400.0,
                office_units_count=5,
                office_ratio=0.5,
                apartment_units_count=5,
                apartment_ratio=0.5,
            )
        )
    return profiles

def test_kmeans_clustering_basic_fit(synthetic_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = preprocessor.fit_transform(synthetic_profiles)

    clusterer = KMeansClusterer(ClusteringConfig(k=2, random_state=42, n_init=20))
    result = clusterer.fit(matrix)

    assert result.k == 2
    assert len(result.cluster_assignments) == 30
    assert result.cluster_sizes[0] == 15 or result.cluster_sizes[0] == 15
    assert result.metrics.silhouette_score > 0.4
    assert result.metrics.inertia > 0.0

def test_kmeans_clustering_determinism(synthetic_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = preprocessor.fit_transform(synthetic_profiles)

    config = ClusteringConfig(k=2, random_state=42, n_init=20)
    res1 = KMeansClusterer(config).fit(matrix)
    res2 = KMeansClusterer(config).fit(matrix)

    assert res1.metrics.inertia == pytest.approx(res2.metrics.inertia)
    assert res1.metrics.silhouette_score == pytest.approx(res2.metrics.silhouette_score)
    assert res1.cluster_assignments == res2.cluster_assignments

def test_cluster_evaluator_range(synthetic_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = preprocessor.fit_transform(synthetic_profiles)

    evaluator = ClusterEvaluator(min_k=2, max_k=5, min_cluster_pct_threshold=4.0)
    evaluation = evaluator.evaluate(matrix)

    assert len(evaluation.evaluations) == 4  # K=2, 3, 4, 5
    assert evaluation.recommended_k == 2
    assert "Silhouette" in evaluation.recommendation_rationale
    assert evaluation.evaluations[0].k == 2
    assert evaluation.evaluations[0].silhouette_score > 0.4

def test_kmeans_invalid_k_raises(synthetic_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor()
    matrix = preprocessor.fit_transform(synthetic_profiles)

    # K < 2 is rejected by Pydantic validation contract
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        ClusteringConfig(k=1)

    # K >= N is rejected by clustering engine
    with pytest.raises(ClusteringConfigurationError) as exc:
        KMeansClusterer(ClusteringConfig(k=50)).fit(matrix)
    assert "exceeds" in str(exc.value).lower()

def test_hierarchical_clustering_and_linkage(synthetic_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = preprocessor.fit_transform(synthetic_profiles)

    h_clusterer = HierarchicalClusterer(ClusteringConfig(k=2))
    h_res = h_clusterer.fit(matrix)

    assert h_res.k == 2
    assert len(h_res.cluster_assignments) == 30
    assert h_res.metrics.silhouette_score > 0.4

    dendrogram_data = h_clusterer.compute_dendrogram_linkage(matrix)
    # Linkage matrix shape for N=30 should be (29, 4)
    assert len(dendrogram_data.linkage_matrix) == 29
    assert len(dendrogram_data.leaf_labels) == 30
    assert dendrogram_data.cophenetic_correlation > 0.0
