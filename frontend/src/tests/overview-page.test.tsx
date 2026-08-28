import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OverviewPage from "@/app/page";
import { apiClient } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getOverviewAnalytics: vi.fn(),
    getDatasetStatus: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("OverviewPage", () => {
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
  });

  it("renders live KPI metrics from API response", async () => {
    vi.mocked(apiClient.getOverviewAnalytics).mockResolvedValue({
      total_buyers: 2000,
      total_properties: 10000,
      total_sold_properties: 7305,
      total_portfolio_spend: 2520750960.84,
      avg_satisfaction: 3.03,
      investment_purpose_pct: 30.75,
      loan_usage_pct: 36.8,
      unique_countries_count: 10,
      active_cluster_count: 3,
    });

    vi.mocked(apiClient.getDatasetStatus).mockResolvedValue({
      is_loaded: true,
      client_count: 2000,
      property_count: 10000,
      sold_property_count: 7305,
      available_property_count: 2695,
      is_dataset_valid: true,
      last_updated: "2026-08-28T01:00:00Z",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OverviewPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("2,000")).toBeInTheDocument();
    expect(await screen.findByText("$2,520,750,961")).toBeInTheDocument();
    expect(await screen.findByText("7,305")).toBeInTheDocument();
    expect(await screen.findByText("K = 3")).toBeInTheDocument();
    expect(await screen.findByText("36.8%")).toBeInTheDocument();
    expect(await screen.findByText("30.8%")).toBeInTheDocument();
    expect(await screen.findByText("3.03 / 5.0")).toBeInTheDocument();
  });

  it("renders error banner when API call fails", async () => {
    vi.mocked(apiClient.getOverviewAnalytics).mockRejectedValue(
      new Error("Network connection timeout")
    );
    vi.mocked(apiClient.getDatasetStatus).mockResolvedValue({
      is_loaded: true,
      client_count: 2000,
      property_count: 10000,
      sold_property_count: 7305,
      available_property_count: 2695,
      is_dataset_valid: true,
      last_updated: "2026-08-28T01:00:00Z",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <OverviewPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText("Backend Synchronization Error")).toBeInTheDocument();
    expect(await screen.findByText("Network connection timeout")).toBeInTheDocument();
  });
});
