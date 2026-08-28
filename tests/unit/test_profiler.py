from datetime import date
from typing import List
import pytest

from parcllabs.models.analytical import CustomerPortfolioProfile
from parcllabs.ml.profiler import ClusterProfiler
from parcllabs.ml.contracts import DatasetProfilingResult

@pytest.fixture
def profiling_sample_profiles() -> List[CustomerPortfolioProfile]:
    profiles: List[CustomerPortfolioProfile] = []
    # Cluster 0: 10 low-spend cash buyers
    for i in range(10):
        profiles.append(
            CustomerPortfolioProfile(
                client_id=f"C{i+1:04d}",
                client_type="Individual",
                first_name="User",
                last_name=f"Cash{i}",
                gender="F",
                country="USA",
                region="California",
                date_of_birth_parsed=date(1990, 1, 1),
                age=34,
                acquisition_purpose="Home",
                satisfaction_score=3,
                loan_applied="No",
                loan_applied_binary=0,
                referral_channel="Website",
                total_properties=3,
                total_spend=600000.0,
                avg_price_per_unit=200000.0,
                avg_floor_area_sqft=800.0,
                office_units_count=0,
                office_ratio=0.0,
                apartment_units_count=3,
                apartment_ratio=1.0,
            )
        )
    # Cluster 1: 10 high-spend luxury loan buyers
    for i in range(10, 20):
        profiles.append(
            CustomerPortfolioProfile(
                client_id=f"C{i+1:04d}",
                client_type="Individual",
                first_name="User",
                last_name=f"Loan{i}",
                gender="M",
                country="Canada",
                region="Ontario",
                date_of_birth_parsed=date(1970, 1, 1),
                age=54,
                acquisition_purpose="Investment",
                satisfaction_score=5,
                loan_applied="Yes",
                loan_applied_binary=1,
                referral_channel="Agency",
                total_properties=4,
                total_spend=1600000.0,
                avg_price_per_unit=400000.0,
                avg_floor_area_sqft=1300.0,
                office_units_count=1,
                office_ratio=0.25,
                apartment_units_count=3,
                apartment_ratio=0.75,
            )
        )
    return profiles

def test_cluster_profiler_computes_accurate_statistics(
    profiling_sample_profiles: List[CustomerPortfolioProfile],
) -> None:
    assignments = {p.client_id: (0 if i < 10 else 1) for i, p in enumerate(profiling_sample_profiles)}
    profiler = ClusterProfiler()
    result = profiler.profile(profiling_sample_profiles, assignments)

    assert isinstance(result, DatasetProfilingResult)
    assert result.k == 2
    assert result.population_size == 20
    assert 0 in result.clusters
    assert 1 in result.clusters

    c0 = result.clusters[0]
    assert c0.count == 10
    assert c0.percentage == 50.0
    assert c0.numerical_profiles["total_spend"].mean == 600000.0
    assert c0.numerical_profiles["loan_applied_binary"].mean == 0.0
    assert c0.numerical_profiles["loan_applied_binary"].z_score_deviation < 0.0

    c1 = result.clusters[1]
    assert c1.count == 10
    assert c1.percentage == 50.0
    assert c1.numerical_profiles["total_spend"].mean == 1600000.0
    assert c1.numerical_profiles["loan_applied_binary"].mean == 1.0
    assert c1.numerical_profiles["loan_applied_binary"].z_score_deviation > 0.0

def test_cluster_profiler_differentiating_features(
    profiling_sample_profiles: List[CustomerPortfolioProfile],
) -> None:
    assignments = {p.client_id: (0 if i < 10 else 1) for i, p in enumerate(profiling_sample_profiles)}
    profiler = ClusterProfiler()
    result = profiler.profile(profiling_sample_profiles, assignments)

    c0 = result.clusters[0]
    # In Cluster 0, loan_applied_binary and total_spend should be identified as differentiating
    diff_names = [f.split()[0] for f in c0.differentiating_features]
    assert "loan_applied_binary" in diff_names
    assert "total_spend" in diff_names
