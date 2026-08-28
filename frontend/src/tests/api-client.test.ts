import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClientError } from "@/lib/api";

describe("apiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("successfully parses getHealth response", async () => {
    const mockData = { status: "ok", version: "0.1.0", app_name: "Test App" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const data = await apiClient.getHealth();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("0.1.0");
  });

  it("successfully parses getOverviewAnalytics response", async () => {
    const mockData = {
      total_buyers: 2000,
      total_properties: 10000,
      total_sold_properties: 7305,
      total_portfolio_spend: 2520750960.84,
      avg_satisfaction: 3.03,
      investment_purpose_pct: 30.75,
      loan_usage_pct: 36.8,
      unique_countries_count: 10,
      active_cluster_count: 3,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const data = await apiClient.getOverviewAnalytics();
    expect(data.total_buyers).toBe(2000);
    expect(data.total_sold_properties).toBe(7305);
    expect(data.total_portfolio_spend).toBe(2520750960.84);
  });

  it("throws structured ApiClientError on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({
        error: {
          code: "CLUSTER_NOT_FOUND",
          message: "Cluster ID 99 not found",
        },
      }),
    } as Response);

    await expect(apiClient.getSegmentDetail(99)).rejects.toThrow(ApiClientError);
    try {
      await apiClient.getSegmentDetail(99);
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.code).toBe("CLUSTER_NOT_FOUND");
      expect(apiErr.status).toBe(404);
      expect(apiErr.message).toBe("Cluster ID 99 not found");
    }
  });
});
