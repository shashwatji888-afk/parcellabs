import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GeographicIntelligencePage from "@/app/geography/page";
import { apiClient } from "@/lib/api";
import { GeographicIntelligenceResponse } from "@/types/api";

vi.mock("@/lib/api", () => ({
  apiClient: {
    getGeographicIntelligence: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/geography",
}));

const mockGeoData: GeographicIntelligenceResponse = {
  total_buyers: 2000,
  total_countries: 10,
  total_regions: 57,
  avg_spend_global: 1260375.48,
  top_country_name: "USA",
  top_country_share_pct: 76.9,
  countries: [
    {
      country: "USA",
      buyer_count: 1538,
      percentage: 76.9,
      investment_count: 472,
      investment_rate_pct: 30.69,
      loan_count: 570,
      loan_rate_pct: 37.06,
      corporate_count: 81,
      corporate_rate_pct: 5.27,
      avg_spend: 1261450.2,
      median_spend: 1221000.0,
      avg_properties: 3.65,
      avg_unit_price: 347100.0,
      avg_satisfaction: 3.03,
      region_count: 35,
      top_regions: [
        { region: "California", buyer_count: 633, share_pct: 41.2 },
        { region: "Nevada", buyer_count: 143, share_pct: 9.3 },
      ],
    },
    {
      country: "UK",
      buyer_count: 95,
      percentage: 4.75,
      investment_count: 30,
      investment_rate_pct: 31.58,
      loan_count: 34,
      loan_rate_pct: 35.79,
      corporate_count: 5,
      corporate_rate_pct: 5.26,
      avg_spend: 1255000.0,
      median_spend: 1215000.0,
      avg_properties: 3.62,
      avg_unit_price: 346500.0,
      avg_satisfaction: 3.05,
      region_count: 4,
      top_regions: [
        { region: "England", buyer_count: 29, share_pct: 30.5 },
      ],
    },
  ],
  regions: [
    {
      country: "USA",
      region: "California",
      buyer_count: 633,
      percentage_of_country: 41.16,
      percentage_of_total: 31.65,
      investment_rate_pct: 30.5,
      loan_rate_pct: 36.8,
      corporate_rate_pct: 5.1,
      avg_spend: 1262000.0,
      median_spend: 1225000.0,
      avg_properties: 3.66,
      avg_satisfaction: 3.04,
    },
    {
      country: "UK",
      region: "England",
      buyer_count: 29,
      percentage_of_country: 30.53,
      percentage_of_total: 1.45,
      investment_rate_pct: 31.0,
      loan_rate_pct: 34.5,
      corporate_rate_pct: 3.4,
      avg_spend: 1250000.0,
      median_spend: 1210000.0,
      avg_properties: 3.6,
      avg_satisfaction: 3.02,
    },
  ],
  cross_matrix: [
    {
      country: "USA",
      buyer_count: 1538,
      share_pct: 76.9,
      investment_rate_pct: 30.69,
      loan_rate_pct: 37.06,
      corporate_rate_pct: 5.27,
      avg_portfolio_size: 3.65,
      avg_spend: 1261450.2,
      median_spend: 1221000.0,
      avg_unit_price: 347100.0,
      avg_satisfaction: 3.03,
    },
    {
      country: "UK",
      buyer_count: 95,
      share_pct: 4.75,
      investment_rate_pct: 31.58,
      loan_rate_pct: 35.79,
      corporate_rate_pct: 5.26,
      avg_portfolio_size: 3.62,
      avg_spend: 1255000.0,
      median_spend: 1215000.0,
      avg_unit_price: 346500.0,
      avg_satisfaction: 3.05,
    },
  ],
};

describe("GeographicIntelligencePage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.restoreAllMocks();
    vi.mocked(apiClient.getGeographicIntelligence).mockResolvedValue(mockGeoData);
  });

  it("renders geographic KPIs, country grid, matrix, and regional hierarchy table", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GeographicIntelligencePage />
      </QueryClientProvider>
    );

    // Title
    expect(screen.getByText("Geographic Intelligence & Regional Hierarchy")).toBeInTheDocument();
    expect(screen.getByText("Global Demographics")).toBeInTheDocument();

    // KPIs
    expect(await screen.findByText("2,000")).toBeInTheDocument();
    expect(screen.getAllByText("USA").length).toBeGreaterThan(0);
    expect(screen.getByText("nations")).toBeInTheDocument();
    expect(screen.getByText("regions")).toBeInTheDocument();

    // Country Grid
    expect(screen.getByText("Country-Level Distribution & Investment Profile")).toBeInTheDocument();

    // Matrix
    expect(screen.getByText("Geographic × Behavioral Cross-Tabulation Matrix")).toBeInTheDocument();

    // Hierarchy Table
    expect(screen.getByText(/Sub-National Regional Hierarchy/i)).toBeInTheDocument();
    expect(screen.getByText("California")).toBeInTheDocument();
  });

  it("allows selecting a country card for deep-dive panel drilldown", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GeographicIntelligencePage />
      </QueryClientProvider>
    );

    const countryCard = await screen.findByTestId("country-card-UK");
    fireEvent.click(countryCard);

    expect(await screen.findByText("UK Market Drill-Down")).toBeInTheDocument();
    expect(screen.getByText("Close Drill-Down")).toBeInTheDocument();
  });
});
