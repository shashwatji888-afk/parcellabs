import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InsightsStudioPage from "@/app/insights/page";
import { apiClient } from "@/lib/api";
import {
  CandidateKEvaluation,
  CustomerPortfolioProfile,
  SegmentationResponse,
} from "@/types/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getCandidateKEvaluation: vi.fn(),
    runSegmentation: vi.fn(),
    getBuyers: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "k") return "3";
      if (key === "clusterId") return "0";
      return null;
    },
  }),
  usePathname: () => "/insights",
}));

const mockEvaluation: CandidateKEvaluation = {
  evaluations: [
    {
      k: 3,
      inertia: 12000.5,
      silhouette_score: 0.183,
      calinski_harabasz: 850.2,
      davies_bouldin: 1.65,
      min_cluster_pct: 28.5,
      cluster_sizes: { 0: 600, 1: 700, 2: 700 },
    },
    {
      k: 4,
      inertia: 10500.2,
      silhouette_score: 0.165,
      calinski_harabasz: 920.1,
      davies_bouldin: 1.55,
      min_cluster_pct: 2.55,
      cluster_sizes: { 0: 51, 1: 580, 2: 670, 3: 699 },
    },
  ],
  recommended_k: 3,
  recommendation_rationale: "K=3 maximizes silhouette and avoids micro-clusters below 4%.",
  alternative_k_candidates: [4],
  min_cluster_pct_threshold: 4.0,
};

const mockSegmentationK3: SegmentationResponse = {
  run_id: "run_k3_test",
  algorithm: "kmeans",
  k: 3,
  random_state: 42,
  cluster_assignments: {
    C0001: 0,
    C0002: 1,
    C0003: 2,
  },
  cluster_sizes: { 0: 600, 1: 700, 2: 700 },
  cluster_percentages: { 0: 30.0, 1: 35.0, 2: 35.0 },
  metrics: {
    k: 3,
    inertia: 12000.5,
    silhouette_score: 0.183,
    calinski_harabasz: 850.2,
    davies_bouldin: 1.65,
    min_cluster_pct: 30.0,
    cluster_sizes: { 0: 600, 1: 700, 2: 700 },
  },
  feature_names: ["total_spend", "total_properties", "avg_price_per_unit"],
  execution_time_ms: 12.5,
  cluster_profiles: {
    0: {
      cluster_id: 0,
      count: 600,
      percentage: 30.0,
      numerical_profiles: {
        total_spend: {
          feature_name: "total_spend",
          mean: 1100000.0,
          median: 1050000.0,
          std: 250000.0,
          iqr: 300000.0,
          q25: 900000.0,
          q75: 1200000.0,
          population_mean: 1260000.0,
          population_std: 350000.0,
          z_score_deviation: -0.45,
          pct_difference: -12.7,
        },
        total_properties: {
          feature_name: "total_properties",
          mean: 3.5,
          median: 4.0,
          std: 0.8,
          iqr: 1.0,
          q25: 3.0,
          q75: 4.0,
          population_mean: 3.65,
          population_std: 1.1,
          z_score_deviation: -0.14,
          pct_difference: -4.1,
        },
        avg_price_per_unit: {
          feature_name: "avg_price_per_unit",
          mean: 314000.0,
          median: 310000.0,
          std: 50000.0,
          iqr: 60000.0,
          q25: 280000.0,
          q75: 340000.0,
          population_mean: 345000.0,
          population_std: 70000.0,
          z_score_deviation: -0.44,
          pct_difference: -8.9,
        },
        avg_floor_area_sqft: {
          feature_name: "avg_floor_area_sqft",
          mean: 950.0,
          median: 940.0,
          std: 120.0,
          iqr: 150.0,
          q25: 870.0,
          q75: 1020.0,
          population_mean: 1040.0,
          population_std: 180.0,
          z_score_deviation: -0.5,
          pct_difference: -8.6,
        },
        age: {
          feature_name: "age",
          mean: 45.2,
          median: 44.0,
          std: 10.5,
          iqr: 14.0,
          q25: 38.0,
          q75: 52.0,
          population_mean: 46.1,
          population_std: 12.0,
          z_score_deviation: -0.07,
          pct_difference: -1.9,
        },
        satisfaction_score: {
          feature_name: "satisfaction_score",
          mean: 3.1,
          median: 3.0,
          std: 0.9,
          iqr: 1.0,
          q25: 3.0,
          q75: 4.0,
          population_mean: 3.03,
          population_std: 1.0,
          z_score_deviation: 0.07,
          pct_difference: 2.3,
        },
        loan_applied_binary: {
          feature_name: "loan_applied_binary",
          mean: 0.0,
          median: 0.0,
          std: 0.0,
          iqr: 0.0,
          q25: 0.0,
          q75: 0.0,
          population_mean: 0.368,
          population_std: 0.48,
          z_score_deviation: -0.76,
          pct_difference: -100.0,
        },
        office_ratio: {
          feature_name: "office_ratio",
          mean: 0.12,
          median: 0.0,
          std: 0.2,
          iqr: 0.25,
          q25: 0.0,
          q75: 0.25,
          population_mean: 0.14,
          population_std: 0.22,
          z_score_deviation: -0.09,
          pct_difference: -14.2,
        },
      },
      categorical_profiles: {
        acquisition_purpose: {
          feature_name: "acquisition_purpose",
          category_distributions: { Home: 0.72, Investment: 0.28 },
          category_counts: { Home: 432, Investment: 168 },
          population_distributions: { Home: 0.692, Investment: 0.308 },
          percentage_point_diff: { Home: 0.028, Investment: -0.028 },
        },
        client_type: {
          feature_name: "client_type",
          category_distributions: { Individual: 0.96, Company: 0.04 },
          category_counts: { Individual: 576, Company: 24 },
          population_distributions: { Individual: 0.948, Company: 0.052 },
          percentage_point_diff: { Individual: 0.012, Company: -0.012 },
        },
        country: {
          feature_name: "country",
          category_distributions: { USA: 0.78, UK: 0.08, Canada: 0.05 },
          category_counts: { USA: 468, UK: 48, Canada: 30 },
          population_distributions: { USA: 0.769, UK: 0.08, Canada: 0.055 },
          percentage_point_diff: { USA: 0.011, UK: 0.0, Canada: -0.005 },
        },
        referral_channel: {
          feature_name: "referral_channel",
          category_distributions: { Organic: 0.45, Partner: 0.35, Paid: 0.20 },
          category_counts: { Organic: 270, Partner: 210, Paid: 120 },
          population_distributions: { Organic: 0.44, Partner: 0.36, Paid: 0.20 },
          percentage_point_diff: { Organic: 0.01, Partner: -0.01, Paid: 0.0 },
        },
      },
      differentiating_features: ["loan_applied_binary", "total_spend"],
      negligible_features: ["age", "satisfaction_score"],
    },
  },
  archetypes: {
    0: {
      cluster_id: 0,
      cluster_key: "cluster_0",
      generated_name: "Unleveraged Value Buyers",
      user_nickname: null,
      confidence: "Strong Evidence",
      is_micro_segment: false,
      short_thesis: "100% unleveraged cash purchasers acquiring moderate-value residential assets.",
      detailed_rationale: "Cluster 0 is characterized by zero mortgage financing with typical portfolio scale.",
      supporting_evidence: [
        "Mortgage Loan Reliance: 0.0% vs Population 36.8% (Z = -0.76)",
        "Mean Total Spend: $1.10M vs Population $1.26M",
      ],
      counter_evidence: [
        "Moderate total spend is driven by unit prices, not small property counts.",
      ],
      rejection_reasons: {
        "Institutional Corporate": "Only 4.0% corporate entity proportion.",
      },
      key_metrics_summary: {
        spend_mean: 1100000.0,
        price_mean: 314000.0,
        properties_mean: 3.5,
        loan_ratio: 0.0,
      },
      count: 600,
      percentage: 30.0,
    },
  },
};

const mockBuyers: CustomerPortfolioProfile[] = [
  {
    client_id: "C0001",
    first_name: "Alice",
    last_name: "Smith",
    date_of_birth_parsed: "1980-05-15",
    total_properties: 3,
    total_spend: 942000.0,
    avg_price_per_unit: 314000.0,
    avg_floor_area_sqft: 950.0,
    office_units_count: 0,
    office_ratio: 0.0,
    apartment_units_count: 3,
    apartment_ratio: 1.0,
    client_type: "Individual",
    gender: "F",
    country: "USA",
    region: "California",
    age: 44,
    satisfaction_score: 3.5,
    loan_applied: "No",
    loan_applied_binary: 0,
    referral_channel: "Organic",
    acquisition_purpose: "Home",
  },
];

describe("InsightsStudioPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(apiClient.getCandidateKEvaluation).mockResolvedValue(mockEvaluation);
    vi.mocked(apiClient.runSegmentation).mockResolvedValue(mockSegmentationK3);
    vi.mocked(apiClient.getBuyers).mockResolvedValue(mockBuyers);
  });

  it("renders segment deep-dive studio with hero card, evidence panel, distributions, and buyer registry", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InsightsStudioPage />
      </QueryClientProvider>
    );

    // Title
    expect(screen.getByText("Segment Deep-Dive Studio")).toBeInTheDocument();
    expect(screen.getByText("Individual Cohort Workspace")).toBeInTheDocument();

    // Segment Selector Tabs
    expect(await screen.findByText(/Active Segment Partitions/i)).toBeInTheDocument();
    expect(screen.getByText("Recommended Operational Model (K=3)")).toBeInTheDocument();

    // Hero Card
    expect(screen.getAllByText("Unleveraged Value Buyers").length).toBeGreaterThan(0);
    expect(screen.getByText("100% unleveraged cash purchasers acquiring moderate-value residential assets.")).toBeInTheDocument();
    expect(screen.getByText("S = 0.183")).toBeInTheDocument();

    // Evidence Panel
    expect(screen.getByText(/Supporting Empirical Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Mortgage Loan Reliance: 0.0%/i)).toBeInTheDocument();
    expect(screen.getByText(/Counter-Evidence & Analytical Guardrails/i)).toBeInTheDocument();
    expect(screen.getByText(/Institutional Corporate/i)).toBeInTheDocument();

    // Numerical Distributions
    expect(screen.getByText(/Numerical Feature Distributions vs Population Baseline/i)).toBeInTheDocument();
    expect(screen.getByText("Total Portfolio Spend")).toBeInTheDocument();

    // Categorical Breakdown
    expect(screen.getByText(/Categorical Attribute Proportions vs Population Baseline/i)).toBeInTheDocument();

    // Buyer Table
    expect(screen.getByText(/Segment Buyer Registry/i)).toBeInTheDocument();
    expect(screen.getByText("C0001")).toBeInTheDocument();
    expect(screen.getByText("California, USA")).toBeInTheDocument();
  });

  it("supports analyst presentation nickname workflow: edit, save, reset without mutating generated name", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InsightsStudioPage />
      </QueryClientProvider>
    );

    // Wait for async query loading to complete
    const editBtn = await screen.findByText("Set Custom Nickname");
    fireEvent.click(editBtn);

    // Enter draft nickname
    const input = screen.getByPlaceholderText(/e.g./i);
    fireEvent.change(input, { target: { value: "Cash Conservative Buyers" } });

    // Save
    const saveBtn = screen.getByText("Save Nickname");
    fireEvent.click(saveBtn);

    // Verify Nickname is rendered as main title and in tabs
    expect(screen.getAllByText("Cash Conservative Buyers").length).toBeGreaterThan(0);
    // Verify Generated Archetype remains visible in subtitle
    expect(screen.getAllByText("Unleveraged Value Buyers").length).toBeGreaterThan(0);

    // Click Reset
    const resetBtn = screen.getByText("(Reset)");
    fireEvent.click(resetBtn);

    // Verify restored
    expect(screen.queryByText("Cash Conservative Buyers")).not.toBeInTheDocument();
    expect(screen.getAllByText("Unleveraged Value Buyers").length).toBeGreaterThan(0);
  });
});
