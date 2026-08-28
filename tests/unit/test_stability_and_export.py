"""Unit tests for multi-seed cluster stability, feature metadata diagnostics, and CSV export."""

import io
import csv
from pathlib import Path
import pytest
from parcllabs.services.analytics_service import AnalyticsService

@pytest.fixture
def service() -> AnalyticsService:
    svc = AnalyticsService(
        clients_path=Path("clients.csv"),
        properties_path=Path("properties.csv"),
    )
    svc.initialize()
    return svc

def test_cluster_stability_evaluation(service: AnalyticsService) -> None:
    """Verify multi-seed clustering agreement metrics and stability calculation."""
    stability_k3 = service.get_cluster_stability(k=3, seeds=[42, 100, 2024])
    assert stability_k3.k == 3
    assert len(stability_k3.seeds_evaluated) == 3
    assert 0.0 <= stability_k3.mean_adjusted_rand_index <= 1.0
    assert 0.0 <= stability_k3.mean_normalized_mutual_info <= 1.0
    assert len(stability_k3.pairwise_agreements) == 3  # (42,100), (42,2024), (100,2024)
    assert stability_k3.stability_rating != ""
    assert "stability" in stability_k3.interpretation_caveat.lower()

def test_feature_metadata_diagnostics(service: AnalyticsService) -> None:
    """Verify dynamic feature metadata reporting matches authoritative 24-feature baseline."""
    meta = service.get_feature_metadata()
    assert meta.total_feature_dimensions == 24
    assert len(meta.numerical_features) == 8
    assert "total_spend" in meta.numerical_features
    assert "total_properties" in meta.numerical_features
    assert "gender" in meta.excluded_features
    assert "region" in meta.excluded_features
    assert meta.scaler_applied == "StandardScaler"

def test_export_buyers_csv_reconciliation(service: AnalyticsService) -> None:
    """Verify buyer CSV export generation, headers, filtering, and exact reconciliation to 2,000 rows."""
    csv_str = service.export_buyers_csv(k=3)
    reader = csv.DictReader(io.StringIO(csv_str))
    rows = list(reader)

    # 1. Total row count must reconcile to 2,000 buyers
    assert len(rows) == 2000

    # 2. Required columns present
    required_cols = [
        "client_id",
        "cluster_id",
        "archetype_name",
        "presentation_nickname",
        "acquisition_purpose",
        "client_type",
        "country",
        "region",
        "loan_status",
        "total_properties",
        "total_spend",
        "avg_price_per_unit",
        "satisfaction_score",
    ]
    for col in required_cols:
        assert col in reader.fieldnames  # type: ignore[operator]

    # 3. Invariant: every buyer has non-empty ID and valid cluster ID (0, 1, or 2)
    cluster_ids = {int(r["cluster_id"]) for r in rows}
    assert cluster_ids == {0, 1, 2}

    # 4. Filtered export by cluster_id=0
    c0_unfiltered_count = sum(1 for r in rows if int(r["cluster_id"]) == 0)
    csv_c0 = service.export_buyers_csv(k=3, cluster_id=0)
    rows_c0 = list(csv.DictReader(io.StringIO(csv_c0)))
    assert len(rows_c0) == c0_unfiltered_count
    assert len(rows_c0) > 0
    assert all(int(r["cluster_id"]) == 0 for r in rows_c0)

def test_export_segment_summary_csv_reconciliation(service: AnalyticsService) -> None:
    """Verify segment summary CSV export generation and mathematical reconciliation."""
    csv_str = service.export_segment_summary_csv(k=3)
    reader = csv.DictReader(io.StringIO(csv_str))
    rows = list(reader)

    # 1. Row count must equal K=3
    assert len(rows) == 3

    # 2. Sum of buyer_count must equal 2,000
    total_buyers = sum(int(r["buyer_count"]) for r in rows)
    assert total_buyers == 2000

    # 3. Sum of population_percentage must equal 100.0%
    total_pct = sum(float(r["population_percentage"]) for r in rows)
    assert pytest.approx(total_pct, rel=1e-3) == 100.0

    # 4. Required summary columns
    summary_cols = [
        "cluster_id",
        "archetype_name",
        "presentation_nickname",
        "buyer_count",
        "population_percentage",
        "avg_spend",
        "median_spend",
        "avg_unit_price",
        "avg_properties",
        "loan_reliance_pct",
        "confidence_rating",
    ]
    for col in summary_cols:
        assert col in reader.fieldnames  # type: ignore[operator]
