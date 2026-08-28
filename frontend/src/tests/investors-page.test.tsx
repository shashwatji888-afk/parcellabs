import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InvestorBehaviorPage from "@/app/investors/page";
import { apiClient } from "@/lib/api";
import {
  InvestorBehaviorResponse,
  MultiPropertyAnalyticsResponse,
} from "@/types/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getInvestorBehavior: vi.fn(),
    getMultiPropertyAnalytics: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/investors",
}));

const mockInvestorData: InvestorBehaviorResponse = {
  summary: {
    total_buyers: 2000,
    investment_buyers_count: 615,
    home_buyers_count: 1385,
    investment_rate_pct: 30.75,
    loan_buyers_count: 736,
    cash_buyers_count: 1264,
    loan_rate_pct: 36.8,
    individual_count: 1897,
    company_count: 103,
    company_rate_pct: 5.15,
    avg_portfolio_size: 3.65,
    median_portfolio_size: 4.0,
    avg_spend: 1260375.48,
    median_spend: 1220893.17,
    spend_iqr: 416735.88,
    avg_unit_price: 347089.96,
    median_unit_price: 341523.39,
    avg_satisfaction: 3.03,
    median_satisfaction: 3.0,
  },
  financing_by_purpose: {
    loan_home_count: 502,
    loan_home_pct: 25.1,
    loan_investment_count: 234,
    loan_investment_pct: 11.7,
    cash_home_count: 883,
    cash_home_pct: 44.15,
    cash_investment_count: 381,
    cash_investment_pct: 19.05,
  },
  financing_by_cluster: [
    {
      cluster_id: 0,
      archetype_name: "Unleveraged Value Buyers",
      total_buyers: 842,
      loan_count: 0,
      cash_count: 842,
      loan_rate_pct: 0.0,
      cash_rate_pct: 100.0,
    },
    {
      cluster_id: 1,
      archetype_name: "Premium Asset Buyers",
      total_buyers: 520,
      loan_count: 98,
      cash_count: 422,
      loan_rate_pct: 18.85,
      cash_rate_pct: 81.15,
    },
    {
      cluster_id: 2,
      archetype_name: "Leveraged Mid-Market Buyers",
      total_buyers: 638,
      loan_count: 638,
      cash_count: 0,
      loan_rate_pct: 100.0,
      cash_rate_pct: 0.0,
    },
  ],
  portfolio_size_distribution: {
    3: 932,
    4: 948,
    5: 69,
    6: 16,
    7: 17,
    8: 12,
  },
  spend_percentiles: {
    p5: 787485.55,
    p10: 867204.32,
    p25: 1025238.01,
    p50: 1220893.17,
    p75: 1441973.88,
    p90: 1654363.13,
    p95: 1823214.59,
    p99: 2583247.64,
    mean: 1260375.48,
    iqr: 416735.87,
  },
  price_percentiles: {
    p5: 236894.46,
    p10: 262338.45,
    p25: 299710.23,
    p50: 341523.39,
    p75: 388566.25,
    p90: 441094.04,
    p95: 472490.58,
    p99: 538965.78,
    mean: 347089.96,
    iqr: 88856.02,
  },
  comparison_by_cluster: [
    {
      group_key: "cluster_0",
      group_label: "Unleveraged Value Buyers",
      buyer_count: 842,
      share_pct: 42.1,
      avg_portfolio_size: 3.61,
      median_portfolio_size: 4.0,
      avg_spend: 1060938.83,
      median_spend: 1067209.52,
      avg_unit_price: 295058.26,
      median_unit_price: 297746.54,
      avg_satisfaction: 3.0,
      loan_rate_pct: 0.0,
      investment_rate_pct: 31.47,
    },
    {
      group_key: "cluster_1",
      group_label: "Premium Asset Buyers",
      buyer_count: 520,
      share_pct: 26.0,
      avg_portfolio_size: 3.73,
      median_portfolio_size: 4.0,
      avg_spend: 1686705.5,
      median_spend: 1664115.71,
      avg_unit_price: 454556.76,
      median_unit_price: 451433.87,
      avg_satisfaction: 3.09,
      loan_rate_pct: 18.85,
      investment_rate_pct: 30.58,
    },
    {
      group_key: "cluster_2",
      group_label: "Leveraged Mid-Market Buyers",
      buyer_count: 638,
      share_pct: 31.9,
      avg_portfolio_size: 3.63,
      median_portfolio_size: 4.0,
      avg_spend: 1176191.07,
      median_spend: 1150493.59,
      avg_unit_price: 328080.08,
      median_unit_price: 323215.11,
      avg_satisfaction: 3.02,
      loan_rate_pct: 100.0,
      investment_rate_pct: 29.94,
    },
  ],
  comparison_by_purpose: [
    {
      group_key: "home",
      group_label: "Home Buyers",
      buyer_count: 1385,
      share_pct: 69.25,
      avg_portfolio_size: 3.64,
      median_portfolio_size: 4.0,
      avg_spend: 1263586.85,
      median_spend: 1235094.73,
      avg_unit_price: 348086.94,
      median_unit_price: 341747.53,
      avg_satisfaction: 3.02,
      loan_rate_pct: 36.25,
      investment_rate_pct: 0.0,
    },
    {
      group_key: "investment",
      group_label: "Investment Buyers",
      buyer_count: 615,
      share_pct: 30.75,
      avg_portfolio_size: 3.65,
      median_portfolio_size: 4.0,
      avg_spend: 1253141.79,
      median_spend: 1206585.87,
      avg_unit_price: 344844.71,
      median_unit_price: 340889.78,
      avg_satisfaction: 3.04,
      loan_rate_pct: 38.05,
      investment_rate_pct: 100.0,
    },
  ],
  comparison_by_client_type: [
    {
      group_key: "individual",
      group_label: "Individual Buyers",
      buyer_count: 1897,
      share_pct: 94.85,
      avg_portfolio_size: 3.65,
      median_portfolio_size: 4.0,
      avg_spend: 1260192.07,
      median_spend: 1221529.77,
      avg_unit_price: 347211.31,
      median_unit_price: 341229.52,
      avg_satisfaction: 3.03,
      loan_rate_pct: 36.53,
      investment_rate_pct: 30.52,
    },
    {
      group_key: "company",
      group_label: "Corporate / Entity Buyers",
      buyer_count: 103,
      share_pct: 5.15,
      avg_portfolio_size: 3.7,
      median_portfolio_size: 4.0,
      avg_spend: 1263753.49,
      median_spend: 1205900.67,
      avg_unit_price: 344854.97,
      median_unit_price: 345874.46,
      avg_satisfaction: 3.07,
      loan_rate_pct: 41.75,
      investment_rate_pct: 34.95,
    },
  ],
};

const mockMultiPropertyData: MultiPropertyAnalyticsResponse = {
  threshold: 5,
  qualifying_buyers_count: 120,
  qualifying_percentage: 6.0,
  total_spend: 233215894.25,
  avg_spend: 1943465.79,
  median_spend: 1821045.5,
  avg_properties: 5.62,
  median_properties: 5.0,
  investment_purpose_count: 35,
  investment_rate_pct: 29.17,
  home_purpose_count: 85,
  loan_count: 44,
  loan_rate_pct: 36.67,
  cash_count: 76,
  corporate_count: 5,
  corporate_rate_pct: 4.17,
  individual_count: 115,
  distribution_by_properties: {
    5: 69,
    6: 16,
    7: 17,
    8: 12,
  },
  top_countries: {
    USA: 92,
    UK: 7,
    Canada: 6,
  },
  qualifying_buyers: [
    {
      client_id: "C0042",
      first_name: "Jane",
      last_name: "Doe",
      date_of_birth_parsed: "1978-04-12",
      total_properties: 7,
      total_spend: 2650000.0,
      avg_price_per_unit: 378571.43,
      avg_floor_area_sqft: 1240.0,
      office_units_count: 1,
      office_ratio: 0.143,
      apartment_units_count: 6,
      apartment_ratio: 0.857,
      client_type: "Individual",
      gender: "M",
      country: "USA",
      region: "California",
      age: 48,
      satisfaction_score: 4.0,
      loan_applied: "Yes",
      loan_applied_binary: 1,
      referral_channel: "Organic",
      acquisition_purpose: "Investment",
    },
  ],
};

describe("InvestorBehaviorPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
    vi.mocked(apiClient.getInvestorBehavior).mockResolvedValue(mockInvestorData);
    vi.mocked(apiClient.getMultiPropertyAnalytics).mockResolvedValue(mockMultiPropertyData);
  });

  it("renders investor KPIs, financing analysis, distributions, and multi-property accumulator module", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InvestorBehaviorPage />
      </QueryClientProvider>
    );

    // Title & Badges
    expect(screen.getByText("Investor Behavior & Portfolio Analytics")).toBeInTheDocument();
    expect(screen.getByText("Descriptive Intelligence")).toBeInTheDocument();

    // Summary KPIs
    expect(await screen.findByText("2,000")).toBeInTheDocument();
    expect(screen.getByText("30.8%")).toBeInTheDocument();
    expect(screen.getByText("36.8%")).toBeInTheDocument();
    expect(screen.getAllByText("$1,220,893").length).toBeGreaterThan(0);

    // Financing Analysis Section
    expect(screen.getByText("Financing Structure & Intent Cross-Tabulation")).toBeInTheDocument();
    expect(screen.getByText("Mortgage Financing Rate by Segment Cohort")).toBeInTheDocument();
    expect(screen.getAllByText("Unleveraged Value Buyers").length).toBeGreaterThan(0);

    // Multi-Property Accumulator Focus
    expect(screen.getByText("Multi-Property / High-Portfolio-Scale Accumulators")).toBeInTheDocument();
    expect(screen.getByText("N ≥ 5 Units")).toBeInTheDocument();
    expect(screen.getByText("C0042")).toBeInTheDocument();
  });

  it("allows switching multi-property threshold and refetches", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InvestorBehaviorPage />
      </QueryClientProvider>
    );

    await screen.findByText("Multi-Property / High-Portfolio-Scale Accumulators");

    const thresholdBtn = screen.getByText("≥ 6");
    fireEvent.click(thresholdBtn);

    expect(apiClient.getMultiPropertyAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 6 })
    );
  });
});
