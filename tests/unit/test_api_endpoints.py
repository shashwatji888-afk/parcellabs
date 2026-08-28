from fastapi.testclient import TestClient
import pytest

from parcllabs.api.app import create_app
from parcllabs.services.analytics_service import AnalyticsService

@pytest.fixture
def api_client() -> TestClient:
    service = AnalyticsService()
    service.initialize()
    app = create_app(service=service)
    return TestClient(app)

def test_api_health_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert "Real Estate" in data["app_name"]

def test_api_data_status_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/data/status")
    assert response.status_code == 200
    data = response.json()
    assert data["is_loaded"] is True
    assert data["client_count"] == 2000
    assert data["property_count"] == 10000
    assert data["sold_property_count"] == 7305
    assert data["available_property_count"] == 2695
    assert data["is_dataset_valid"] is True

def test_api_data_quality_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/data/quality")
    assert response.status_code == 200
    data = response.json()
    assert data["is_dataset_valid"] is True
    assert data["duplicate_client_ids"] == []
    assert data["orphan_client_refs"] == []

def test_api_data_buyers_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/data/buyers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2000
    assert data[0]["client_id"]
    assert "total_spend" in data[0]

def test_api_analytics_overview_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_buyers"] == 2000
    assert data["total_sold_properties"] == 7305
    assert data["total_portfolio_spend"] > 2500000000.0
    assert 1.0 <= data["avg_satisfaction"] <= 5.0
    assert data["unique_countries_count"] == 10

def test_api_ml_evaluation_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/ml/evaluation")
    assert response.status_code == 200
    data = response.json()
    assert len(data["evaluations"]) == 9  # K=2..10
    assert data["recommended_k"] in [3, 4]
    assert data["recommendation_rationale"]

def test_api_ml_segments_post_valid(api_client: TestClient) -> None:
    payload = {
        "k": 3,
        "random_state": 42,
        "n_init": 20,
        "min_cluster_pct_threshold": 4.0,
        "preprocessing_config": {
            "scaler_type": "standard",
            "include_country": True,
            "include_gender": False,
        },
    }
    response = api_client.post("/api/ml/segments", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["k"] == 3
    assert len(data["cluster_assignments"]) == 2000
    assert len(data["cluster_profiles"]) == 3
    assert len(data["archetypes"]) == 3
    assert data["execution_time_ms"] > 0

def test_api_ml_segments_post_invalid_k_rejected(api_client: TestClient) -> None:
    # K=1 is invalid (Pydantic ge=2)
    response = api_client.post("/api/ml/segments", json={"k": 1})
    assert response.status_code == 422

    # K=15 is invalid (Pydantic le=10)
    response = api_client.post("/api/ml/segments", json={"k": 15})
    assert response.status_code == 422

def test_api_ml_segment_detail_valid_and_404(api_client: TestClient) -> None:
    # Ensure active segmentation is K=3
    api_client.post("/api/ml/segments", json={"k": 3})

    # Valid cluster
    resp = api_client.get("/api/ml/segments/0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["cluster_id"] == 0
    assert "profile" in data
    assert "archetype" in data

    # Non-existent cluster
    resp_404 = api_client.get("/api/ml/segments/99")
    assert resp_404.status_code == 404
    err_data = resp_404.json()
    assert "error" in err_data or "detail" in err_data

def test_api_hierarchical_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/ml/hierarchical?sample_size=100")
    assert response.status_code == 200
    data = response.json()
    assert len(data["linkage_matrix"]) == 99
    assert len(data["leaf_labels"]) == 100
    assert data["cophenetic_correlation"] > 0.0

def test_api_pca_projection_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/analytics/projection")
    assert response.status_code == 200
    data = response.json()
    assert len(data["points"]) == 2000
    assert len(data["explained_variance_ratio"]) == 3
    assert data["total_explained_variance"] > 0.0

    pt0 = data["points"][0]
    assert "client_id" in pt0
    assert "cluster_id" in pt0
    assert "x" in pt0 and "y" in pt0 and "z" in pt0

def test_api_investor_behavior_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/analytics/investor-behavior")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_buyers"] == 2000
    assert data["summary"]["investment_buyers_count"] == 615
    assert len(data["financing_by_cluster"]) == 3
    assert len(data["comparison_by_cluster"]) == 3
    assert data["spend_percentiles"]["p50"] == data["summary"]["median_spend"]

    # Test filtering via query parameters
    resp_filtered = api_client.get("/api/analytics/investor-behavior?country=USA&acquisition_purpose=Investment")
    assert resp_filtered.status_code == 200
    data_filtered = resp_filtered.json()
    assert data_filtered["summary"]["total_buyers"] < 2000
    assert data_filtered["summary"]["investment_rate_pct"] == 100.0

def test_api_multi_property_endpoint(api_client: TestClient) -> None:
    # Default threshold N=5
    response = api_client.get("/api/analytics/multi-property")
    assert response.status_code == 200
    data = response.json()
    assert data["threshold"] == 5
    assert data["qualifying_buyers_count"] == 120
    assert data["qualifying_percentage"] == 6.0
    assert len(data["qualifying_buyers"]) == 120

    # Custom threshold N=6
    resp_6 = api_client.get("/api/analytics/multi-property?threshold=6")
    assert resp_6.status_code == 200
    data_6 = resp_6.json()
    assert data_6["qualifying_buyers_count"] == 51

    # Validation: threshold > 20 is rejected
    resp_invalid = api_client.get("/api/analytics/multi-property?threshold=25")
    assert resp_invalid.status_code == 422

def test_api_geography_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/analytics/geography")
    assert response.status_code == 200
    data = response.json()
    assert data["total_buyers"] == 2000
    assert data["total_countries"] == 10
    assert data["total_regions"] == 57
    assert data["top_country_name"] == "USA"
    assert len(data["countries"]) == 10
    assert len(data["cross_matrix"]) == 10

    # Filter by country
    resp_country = api_client.get("/api/analytics/geography?selected_country=UK")
    assert resp_country.status_code == 200
    data_uk = resp_country.json()
    assert data_uk["total_buyers"] == 95
    assert len(data_uk["countries"]) == 1
    assert data_uk["countries"][0]["country"] == "UK"

def test_api_stability_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/ml/stability?k=3")
    assert response.status_code == 200
    data = response.json()
    assert data["k"] == 3
    assert len(data["seeds_evaluated"]) >= 2
    assert "mean_adjusted_rand_index" in data
    assert "pairwise_agreements" in data
    assert "stability_rating" in data

def test_api_feature_metadata_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/ml/feature-metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["total_feature_dimensions"] == 24
    assert len(data["numerical_features"]) == 8
    assert "gender" in data["excluded_features"]

def test_api_export_buyers_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/export/buyers?k=3")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in response.headers["content-disposition"]
    lines = response.text.strip().split("\n")
    assert len(lines) == 2001  # Header + 2,000 buyers

def test_api_export_summary_endpoint(api_client: TestClient) -> None:
    response = api_client.get("/api/export/summary?k=3")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    lines = response.text.strip().split("\n")
    assert len(lines) == 4  # Header + 3 cluster summaries


