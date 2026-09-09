import {
  APIErrorResponse,
  CandidateKEvaluation,
  ClusterStabilityResponse,
  CustomerPortfolioProfile,
  DataQualityReport,
  DatasetStatusResponse,
  FeatureMetadataResponse,
  GeographicIntelligenceResponse,
  HealthResponse,
  HierarchicalLinkageResult,
  InvestorBehaviorResponse,
  MultiPropertyAnalyticsResponse,
  OverviewAnalyticsResponse,
  PCAProjectionResult,
  SegmentDetailResponse,
  SegmentationRequest,
  SegmentationResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiClientError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: APIErrorResponse | null = null;
    try {
      errorData = (await response.json()) as APIErrorResponse;
    } catch {
      // Fallback if response is not JSON
    }

    const code = errorData?.error?.code || `HTTP_${response.status}`;
    const message =
      errorData?.error?.message ||
      `Request failed with status ${response.status}: ${response.statusText}`;

    throw new ApiClientError(message, code, response.status, errorData?.error?.details);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  /**
   * Health Check
   */
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<HealthResponse>(res);
  },

  /**
   * Dataset Ingestion & Record Counts
   */
  async getDatasetStatus(): Promise<DatasetStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/data/status`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<DatasetStatusResponse>(res);
  },

  /**
   * Data Quality Audit Report
   */
  async getDataQuality(): Promise<DataQualityReport> {
    const res = await fetch(`${API_BASE_URL}/api/data/quality`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<DataQualityReport>(res);
  },

  /**
   * Customer Portfolio Profiles (2,000 buyers)
   */
  async getBuyers(): Promise<CustomerPortfolioProfile[]> {
    const res = await fetch(`${API_BASE_URL}/api/data/buyers`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<CustomerPortfolioProfile[]>(res);
  },

  /**
   * Market Overview KPIs
   */
  async getOverviewAnalytics(): Promise<OverviewAnalyticsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<OverviewAnalyticsResponse>(res);
  },

  /**
   * Candidate K Evaluations (K=2..10)
   */
  async getCandidateKEvaluation(): Promise<CandidateKEvaluation> {
    const res = await fetch(`${API_BASE_URL}/api/ml/evaluation`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<CandidateKEvaluation>(res);
  },

  /**
   * Trigger or Reconfigure Segmentation Run
   */
  async runSegmentation(request: SegmentationRequest = {}): Promise<SegmentationResponse> {
    const res = await fetch(`${API_BASE_URL}/api/ml/segments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return handleResponse<SegmentationResponse>(res);
  },

  /**
   * Single Cluster Profile & Archetype Detail
   */
  async getSegmentDetail(clusterId: number): Promise<SegmentDetailResponse> {
    const res = await fetch(`${API_BASE_URL}/api/ml/segments/${clusterId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<SegmentDetailResponse>(res);
  },

  /**
   * Hierarchical Dendrogram Linkage
   */
  async getHierarchicalClustering(sampleSize = 150): Promise<HierarchicalLinkageResult> {
    const res = await fetch(`${API_BASE_URL}/api/ml/hierarchical?sample_size=${sampleSize}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<HierarchicalLinkageResult>(res);
  },

  /**
   * 2D/3D PCA Scatter Coordinates
   */
  async getPCAProjection(): Promise<PCAProjectionResult> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/projection`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<PCAProjectionResult>(res);
  },

  /**
   * Investor Behavior Analytics
   */
  async getInvestorBehavior(params: {
    country?: string;
    region?: string;
    client_type?: string;
    acquisition_purpose?: string;
    loan_status?: string;
    cluster_id?: number;
  } = {}): Promise<InvestorBehaviorResponse> {
    const query = new URLSearchParams();
    if (params.country) query.append("country", params.country);
    if (params.region) query.append("region", params.region);
    if (params.client_type) query.append("client_type", params.client_type);
    if (params.acquisition_purpose) query.append("acquisition_purpose", params.acquisition_purpose);
    if (params.loan_status) query.append("loan_status", params.loan_status);
    if (params.cluster_id !== undefined && params.cluster_id !== null) {
      query.append("cluster_id", params.cluster_id.toString());
    }

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/analytics/investor-behavior${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<InvestorBehaviorResponse>(res);
  },

  /**
   * Multi-Property Accumulator Analytics
   */
  async getMultiPropertyAnalytics(params: {
    threshold?: number;
    country?: string;
    cluster_id?: number;
  } = {}): Promise<MultiPropertyAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params.threshold !== undefined) query.append("threshold", params.threshold.toString());
    if (params.country) query.append("country", params.country);
    if (params.cluster_id !== undefined && params.cluster_id !== null) {
      query.append("cluster_id", params.cluster_id.toString());
    }

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/analytics/multi-property${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<MultiPropertyAnalyticsResponse>(res);
  },

  /**
   * Geographic Intelligence Analytics
   */
  async getGeographicIntelligence(params: {
    selected_country?: string;
    acquisition_purpose?: string;
    loan_status?: string;
    cluster_id?: number;
  } = {}): Promise<GeographicIntelligenceResponse> {
    const query = new URLSearchParams();
    if (params.selected_country) query.append("selected_country", params.selected_country);
    if (params.acquisition_purpose) query.append("acquisition_purpose", params.acquisition_purpose);
    if (params.loan_status) query.append("loan_status", params.loan_status);
    if (params.cluster_id !== undefined && params.cluster_id !== null) {
      query.append("cluster_id", params.cluster_id.toString());
    }

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/analytics/geography${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<GeographicIntelligenceResponse>(res);
  },

  /**
   * Multi-Seed Cluster Stability Evaluation
   */
  async getClusterStability(k: number = 3): Promise<ClusterStabilityResponse> {
    const res = await fetch(`${API_BASE_URL}/api/ml/stability?k=${k}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<ClusterStabilityResponse>(res);
  },

  /**
   * ML Feature Matrix Metadata
   */
  async getFeatureMetadata(): Promise<FeatureMetadataResponse> {
    const res = await fetch(`${API_BASE_URL}/api/ml/feature-metadata`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<FeatureMetadataResponse>(res);
  },

  /**
   * Buyer-Level CSV Export URL
   */
  getExportBuyersUrl(params: {
    k?: number;
    cluster_id?: number | null;
    search?: string;
  } = {}): string {
    const query = new URLSearchParams();
    if (params.k !== undefined) query.append("k", params.k.toString());
    if (params.cluster_id !== undefined && params.cluster_id !== null) {
      query.append("cluster_id", params.cluster_id.toString());
    }
    if (params.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return `${API_BASE_URL}/api/export/buyers${qs}`;
  },

  /**
   * Segment Summary CSV Export URL
   */
  getExportSummaryUrl(k: number = 3): string {
    return `${API_BASE_URL}/api/export/summary?k=${k}`;
  },
};
