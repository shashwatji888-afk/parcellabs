import time
from fastapi.testclient import TestClient

from parcllabs.api.app import create_app
from parcllabs.services.analytics_service import AnalyticsService

def test_full_baseline_api_workflow_integration() -> None:
    service = AnalyticsService()
    service.initialize()
    app = create_app(service=service)
    client = TestClient(app)

    # 1. Health check
    h_resp = client.get("/api/health")
    assert h_resp.status_code == 200

    # 2. Data status & quality audit
    status_resp = client.get("/api/data/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["client_count"] == 2000

    qual_resp = client.get("/api/data/quality")
    assert qual_resp.status_code == 200
    assert qual_resp.json()["is_dataset_valid"] is True

    # 3. Analytics overview
    ov_resp = client.get("/api/analytics/overview")
    assert ov_resp.status_code == 200
    assert ov_resp.json()["total_buyers"] == 2000

    # 4. ML candidate K evaluations
    t0 = time.perf_counter()
    eval_resp = client.get("/api/ml/evaluation")
    t_eval = (time.perf_counter() - t0) * 1000.0
    assert eval_resp.status_code == 200
    assert len(eval_resp.json()["evaluations"]) == 9

    # 5. Execute custom segmentation (K=4 to test micro-segment)
    t1 = time.perf_counter()
    seg_resp = client.post(
        "/api/ml/segments",
        json={
            "k": 4,
            "random_state": 42,
            "n_init": 20,
            "preprocessing_config": {
                "scaler_type": "standard",
                "include_country": True,
                "include_gender": False,
            },
        },
    )
    t_seg = (time.perf_counter() - t1) * 1000.0
    assert seg_resp.status_code == 200
    seg_data = seg_resp.json()
    assert seg_data["k"] == 4
    assert len(seg_data["cluster_assignments"]) == 2000

    # 6. Verify single cluster detail
    det_resp = client.get("/api/ml/segments/0")
    assert det_resp.status_code == 200
    assert det_resp.json()["cluster_id"] == 0

    # 7. Verify PCA projection with K=4 active
    pca_resp = client.get("/api/analytics/projection")
    assert pca_resp.status_code == 200
    pca_data = pca_resp.json()
    assert len(pca_data["points"]) == 2000

    # 8. Hierarchical dendrogram
    hier_resp = client.get("/api/ml/hierarchical?sample_size=150")
    assert hier_resp.status_code == 200
    assert len(hier_resp.json()["linkage_matrix"]) == 149

    print(f"\nAPI Evaluation response time: {t_eval:.2f} ms")
    print(f"API Segmentation execution time: {t_seg:.2f} ms")
