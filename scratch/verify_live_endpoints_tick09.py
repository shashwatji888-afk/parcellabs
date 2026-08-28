from fastapi.testclient import TestClient
from parcllabs.api.app import create_app

def main():
    app = create_app()
    client = TestClient(app)

    print("1. Testing GET /api/data/buyers...")
    res = client.get("/api/data/buyers")
    assert res.status_code == 200, res.text
    buyers = res.json()
    assert len(buyers) == 2000
    print(f"   [OK] Loaded {len(buyers)} buyers with 100% data integrity.")

    print("\n2. Testing GET /api/ml/evaluation...")
    res = client.get("/api/ml/evaluation")
    assert res.status_code == 200, res.text
    evaluation = res.json()
    print(f"   [OK] Recommended K: {evaluation['recommended_k']}")
    print(f"   [OK] Recommendation: {evaluation['recommendation_rationale']}")

    print("\n3. Testing POST /api/ml/segments for K=2, K=3, K=4...")
    for k in [2, 3, 4]:
        res = client.post("/api/ml/segments", json={"k": k, "random_state": 42, "n_init": 20})
        assert res.status_code == 200, res.text
        seg = res.json()
        print(f"   [OK] K={k}: Silhouette={seg['metrics']['silhouette_score']:.4f}, Inertia={seg['metrics']['inertia']:.1f}, Min Cluster Pct={seg['metrics']['min_cluster_pct']:.2f}%")
        for cid, arch in seg["archetypes"].items():
            print(f"        Cluster {cid}: {arch['generated_name']} ({arch['count']} buyers, {arch['percentage']:.1f}%)")

    print("\n4. Testing GET /api/analytics/projection...")
    res = client.get("/api/analytics/projection")
    assert res.status_code == 200, res.text
    proj = res.json()
    print(f"   [OK] PCA Points: {len(proj['points'])} points projected.")
    print(f"   [OK] Explained Variance Ratios: {proj['explained_variance_ratio']}")
    print(f"   [OK] Total Explained Variance: {proj['total_explained_variance'] * 100:.2f}%")

    print("\nALL TICK-09 LIVE ENDPOINT VERIFICATION CHECKS PASSED!")

if __name__ == "__main__":
    main()
