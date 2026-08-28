import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SegmentsPage from "@/app/segments/page";
import { apiClient } from "@/lib/api";
import { NumericalFeatureProfile } from "@/types/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getCandidateKEvaluation: vi.fn(),
    runSegmentation: vi.fn(),
    getPCAProjection: vi.fn(),
    getBuyers: vi.fn(),
    getDatasetStatus: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/segments",
}));

const mockNumSummary = (mean: number): NumericalFeatureProfile => ({
  feature_name: "feature",
  mean,
  median: mean,
  std: 100,
  iqr: 50,
  q25: mean - 25,
  q75: mean + 25,
  population_mean: mean,
  population_std: 100,
  z_score_deviation: 0.1,
  pct_difference: 5.0,
});

describe("SegmentsPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.restoreAllMocks();
    vi.mocked(apiClient.getDatasetStatus).mockResolvedValue({
      is_loaded: true,
      client_count: 2000,
      property_count: 10000,
      sold_property_count: 7305,
      available_property_count: 2695,
      is_dataset_valid: true,
      last_updated: "2026-08-28T01:00:00Z",
    });
  });

  it("loads evaluation, segmentation K=3, PCA projection, and buyer table", async () => {
    vi.mocked(apiClient.getCandidateKEvaluation).mockResolvedValue({
      recommended_k: 3,
      recommendation_rationale: "K=3 maximizes silhouette under micro-cluster size constraints.",
      alternative_k_candidates: [4],
      min_cluster_pct_threshold: 4.0,
      evaluations: [],
    });

    vi.mocked(apiClient.runSegmentation).mockResolvedValue({
      run_id: "run_123",
      algorithm: "kmeans",
      k: 3,
      random_state: 42,
      cluster_assignments: { C0001: 0, C0002: 1 },
      cluster_sizes: { 0: 842, 1: 520, 2: 638 },
      cluster_percentages: { 0: 42.1, 1: 26.0, 2: 31.9 },
      metrics: {
        k: 3,
        inertia: 13372.6,
        silhouette_score: 0.1251,
        calinski_harabasz: 1154.2,
        davies_bouldin: 2.2235,
        min_cluster_pct: 26.0,
        cluster_sizes: { 0: 842, 1: 520, 2: 638 },
      },
      cluster_profiles: {
        0: {
          cluster_id: 0,
          count: 842,
          percentage: 42.1,
          numerical_profiles: {
            total_spend: mockNumSummary(1080932),
            avg_price_per_unit: mockNumSummary(315730),
            total_properties: mockNumSummary(3.5),
            loan_applied_binary: mockNumSummary(0.0),
          },
          categorical_profiles: {},
          differentiating_features: [],
          negligible_features: [],
        },
      },
      archetypes: {
        0: {
          cluster_id: 0,
          cluster_key: "cluster_0",
          generated_name: "Unleveraged Value Buyers",
          confidence: "Strong Evidence",
          is_micro_segment: false,
          short_thesis: "Completely equity-funded cash buyers.",
          detailed_rationale: "Zero loan usage.",
          supporting_evidence: [],
          counter_evidence: [],
          rejection_reasons: {},
          key_metrics_summary: {},
          count: 842,
          percentage: 42.1,
        },
      },
      feature_names: [],
      execution_time_ms: 15.2,
    });

    vi.mocked(apiClient.getPCAProjection).mockResolvedValue({
      points: [
        { client_id: "C0001", cluster_id: 0, x: 1.0, y: 2.0, z: 0.5 },
        { client_id: "C0002", cluster_id: 1, x: -1.0, y: -2.0, z: -0.5 },
      ],
      explained_variance_ratio: [0.2219, 0.1386, 0.1211],
      total_explained_variance: 0.4816,
      feature_count: 24,
      sample_count: 2,
    });

    vi.mocked(apiClient.getBuyers).mockResolvedValue([
      {
        client_id: "C0001",
        client_type: "Individual",
        first_name: "Alice",
        last_name: "Cash",
        gender: "F",
        country: "USA",
        region: "California",
        date_of_birth_parsed: "1990-01-01",
        age: 34,
        acquisition_purpose: "Home",
        satisfaction_score: 3,
        loan_applied: "No",
        loan_applied_binary: 0,
        referral_channel: "Website",
        total_properties: 3,
        total_spend: 900000.0,
        avg_price_per_unit: 300000.0,
        avg_floor_area_sqft: 950.0,
        office_units_count: 0,
        office_ratio: 0.0,
        apartment_units_count: 3,
        apartment_ratio: 1.0,
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <SegmentsPage />
      </QueryClientProvider>
    );

    // Verify K selector and recommended badge
    expect(await screen.findByText("Recommended: K = 3")).toBeInTheDocument();

    // Verify Model Diagnostics
    expect(await screen.findByText("0.1251")).toBeInTheDocument();
    expect(await screen.findByText("K=3 maximizes silhouette under micro-cluster size constraints.")).toBeInTheDocument();

    // Verify Archetype card and table rendering
    const archetypeElements = await screen.findAllByText("Unleveraged Value Buyers");
    expect(archetypeElements.length).toBeGreaterThan(0);

    // Verify Statistical disclaimer
    expect(await screen.findByText(/48.16% of cumulative variance/)).toBeInTheDocument();

    // Verify Buyer table
    expect(await screen.findByText("C0001")).toBeInTheDocument();
  });
});
