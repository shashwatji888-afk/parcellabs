import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DiagnosticsPage from "@/app/diagnostics/page";
import { DendrogramViewer } from "@/components/diagnostics/dendrogram-viewer";
import { ExportCenterCard } from "@/components/diagnostics/export-center-card";
import { apiClient } from "@/lib/api";
import {
  CandidateKEvaluation,
  ClusterStabilityResponse,
  DataQualityReport,
  FeatureMetadataResponse,
  HierarchicalLinkageResult,
} from "@/types/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getCandidateKEvaluation: vi.fn(),
    getHierarchicalClustering: vi.fn(),
    getClusterStability: vi.fn(),
    getFeatureMetadata: vi.fn(),
    getDataQuality: vi.fn(),
    getDatasetStatus: vi.fn(),
    getExportBuyersUrl: vi.fn(() => "http://127.0.0.1:8000/api/export/buyers?k=3"),
    getExportSummaryUrl: vi.fn(() => "http://127.0.0.1:8000/api/export/summary?k=3"),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/diagnostics",
}));

const mockEvaluation: CandidateKEvaluation = {
  evaluations: [
    {
      k: 2,
      inertia: 15000.0,
      silhouette_score: 0.165,
      calinski_harabasz: 700.0,
      davies_bouldin: 1.85,
      min_cluster_pct: 45.0,
      cluster_sizes: { 0: 1100, 1: 900 },
    },
    {
      k: 3,
      inertia: 12000.5,
      silhouette_score: 0.183,
      calinski_harabasz: 850.2,
      davies_bouldin: 1.65,
      min_cluster_pct: 30.0,
      cluster_sizes: { 0: 842, 1: 628, 2: 530 },
    },
    {
      k: 4,
      inertia: 10500.2,
      silhouette_score: 0.198,
      calinski_harabasz: 920.1,
      davies_bouldin: 1.55,
      min_cluster_pct: 2.55,
      cluster_sizes: { 0: 51, 1: 778, 2: 632, 3: 539 },
    },
  ],
  recommended_k: 3,
  recommendation_rationale: "K=3 maximizes operational separation while avoiding micro-clusters (<4%).",
  alternative_k_candidates: [4],
  min_cluster_pct_threshold: 4.0,
};

const mockHierarchical: HierarchicalLinkageResult = {
  linkage_matrix: [
    [0, 1, 0.45, 2],
    [2, 3, 0.65, 3],
  ],
  leaf_labels: ["B001", "B002", "B003"],
  cophenetic_correlation: 0.624,
  sample_size: 150,
};

const mockStability: ClusterStabilityResponse = {
  k: 3,
  seeds_evaluated: [42, 100, 2024],
  mean_adjusted_rand_index: 0.9124,
  min_adjusted_rand_index: 0.885,
  max_adjusted_rand_index: 0.941,
  mean_normalized_mutual_info: 0.895,
  pairwise_agreements: [
    { seed_a: 42, seed_b: 100, adjusted_rand_index: 0.912, normalized_mutual_info: 0.895 },
    { seed_a: 42, seed_b: 2024, adjusted_rand_index: 0.941, normalized_mutual_info: 0.915 },
    { seed_a: 100, seed_b: 2024, adjusted_rand_index: 0.885, normalized_mutual_info: 0.875 },
  ],
  stability_rating: "High Multi-Seed Convergence (ARI ≥ 0.85)",
  interpretation_caveat: "Cluster stability measures algorithm reproducibility across seed initializations.",
};

const mockFeatureMeta: FeatureMetadataResponse = {
  total_feature_dimensions: 24,
  numerical_features: [
    "total_spend",
    "total_properties",
    "avg_price_per_unit",
    "avg_floor_area_sqft",
    "office_ratio",
    "age",
    "satisfaction_score",
    "loan_applied_binary",
  ],
  categorical_features: [
    "client_type",
    "acquisition_purpose",
    "referral_channel",
    "country",
  ],
  excluded_features: [
    "gender",
    "region",
    "apartment_ratio",
  ],
  scaler_applied: "StandardScaler",
  top_n_countries_encoded: 10,
  feature_dimension_names: [
    "num__total_spend",
    "num__total_properties",
    "cat__client_type_Individual",
    "cat__country_USA",
  ],
};

const mockDataQuality: DataQualityReport = {
  total_clients_audited: 2000,
  total_properties_audited: 10000,
  duplicate_client_ids: [],
  duplicate_property_ids: [],
  orphan_client_refs: [],
  missing_dates_of_birth_count: 0,
  missing_country_count: 0,
  missing_loan_status_count: 0,
  future_dates_count: 0,
  unparseable_records: [],
  is_dataset_valid: true,
};

describe("DiagnosticsPage (TICK-12 Model Diagnostics Lab)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(apiClient.getCandidateKEvaluation).mockResolvedValue(mockEvaluation);
    vi.mocked(apiClient.getHierarchicalClustering).mockResolvedValue(mockHierarchical);
    vi.mocked(apiClient.getClusterStability).mockResolvedValue(mockStability);
    vi.mocked(apiClient.getFeatureMetadata).mockResolvedValue(mockFeatureMeta);
    vi.mocked(apiClient.getDataQuality).mockResolvedValue(mockDataQuality);
    vi.mocked(apiClient.getDatasetStatus).mockResolvedValue({
      is_loaded: true,
      client_count: 2000,
      property_count: 10000,
      sold_property_count: 7305,
      available_property_count: 2695,
      is_dataset_valid: true,
      last_updated: "2024-01-01T00:00:00Z",
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <DiagnosticsPage />
      </QueryClientProvider>
    );

  it("renders KPI summary with recommended K=3 and diagnostic metrics", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Recommended Model")).toBeInTheDocument();
    });

    expect(screen.getAllByText("K = 3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("0.183").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("30.0%").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 4 diagnostic charts and candidate evaluation table on default tab", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Mean Silhouette Coefficient vs K/i)).toBeInTheDocument();
      expect(screen.getByText(/Within-Cluster Sum of Squares/i)).toBeInTheDocument();
      expect(screen.getByText(/Calinski-Harabasz Variance Ratio Criterion/i)).toBeInTheDocument();
      expect(screen.getByText(/Davies-Bouldin Cluster Separation Index/i)).toBeInTheDocument();
      expect(screen.getByText(/Candidate K Diagnostic Evaluation Matrix/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Micro-Cluster")).toBeInTheDocument();
  });

  it("switches to stability tab and displays multi-seed convergence matrix", async () => {
    renderComponent();
    await screen.findByText("Recommended Model");

    const tabBtn = screen.getByRole("button", { name: /multi-seed stability/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Multi-Seed Cluster Stability & Convergence Diagnostics/i)).toBeInTheDocument();
      expect(screen.getByText("0.9124")).toBeInTheDocument();
      expect(screen.getByText("High Multi-Seed Convergence (ARI ≥ 0.85)")).toBeInTheDocument();
    });
  });

  it("switches to hierarchical tab and displays dendrogram with cophenetic correlation", async () => {
    renderComponent();
    await screen.findByText("Recommended Model");

    const tabBtn = screen.getByRole("button", { name: /hierarchical dendrogram/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Hierarchical Agglomerative Tree & Dendrogram Topology/i)).toBeInTheDocument();
      expect(screen.getAllByText(/0.624/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders DendrogramViewer standalone", () => {
    render(<DendrogramViewer linkageResult={mockHierarchical} />);
    expect(screen.getByText(/Hierarchical Agglomerative Tree & Dendrogram Topology/i)).toBeInTheDocument();
    expect(screen.getAllByText(/0.624/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders ExportCenterCard standalone", () => {
    render(<ExportCenterCard selectedK={3} totalBuyers={2000} />);
    expect(screen.getByText(/Data Export & Reporting Hub/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Reconciliation/i).length).toBeGreaterThanOrEqual(1);
  });

  it("switches to feature matrix tab and displays authoritative 24-feature baseline", async () => {
    renderComponent();
    await screen.findByText("Recommended Model");

    const tabBtn = screen.getByRole("button", { name: /feature matrix/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Authoritative ML Feature Vector Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/24 Distance Dimensions/i)).toBeInTheDocument();
      expect(screen.getByText("total_spend")).toBeInTheDocument();
      expect(screen.getByText(/gender/i)).toBeInTheDocument();
    });
  });

  it("switches to data quality tab and verifies 100% audit verification", async () => {
    renderComponent();
    await screen.findByText("Recommended Model");

    const tabBtn = screen.getByRole("button", { name: /data quality/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Source Dataset Quality & Referential Integrity Audit/i)).toBeInTheDocument();
      expect(screen.getByText(/100% Audit Verified/i)).toBeInTheDocument();
      expect(screen.getByText("10,000")).toBeInTheDocument();
      expect(screen.getByText("2,000")).toBeInTheDocument();
    });
  });

  it("switches to export tab and exposes CSV download actions", async () => {
    renderComponent();
    await screen.findByText("Recommended Model");

    const tabBtn = screen.getByRole("button", { name: /data export/i });
    fireEvent.click(tabBtn);

    await waitFor(() => {
      expect(screen.getByText(/Data Export & Reporting Hub/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /download csv/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /download summary csv/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Reconciliation/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});
