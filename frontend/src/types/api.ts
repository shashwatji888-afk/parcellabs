/**
 * Type-safe frontend domain models matching FastAPI REST contracts.
 */

export interface HealthResponse {
  status: string;
  version: string;
  app_name: string;
}

export interface DatasetStatusResponse {
  is_loaded: boolean;
  client_count: number;
  property_count: number;
  sold_property_count: number;
  available_property_count: number;
  is_dataset_valid: boolean;
  last_updated: string;
}

export interface DataQualityIssue {
  record_id: string;
  field_name: string;
  issue_type: string;
  raw_value: string | null;
  message: string;
}

export interface DataQualityReport {
  total_clients_audited: number;
  total_properties_audited: number;
  duplicate_client_ids: string[];
  duplicate_property_ids: string[];
  orphan_client_refs: string[];
  missing_dates_of_birth_count: number;
  missing_country_count: number;
  missing_loan_status_count: number;
  future_dates_count: number;
  unparseable_records: DataQualityIssue[];
  is_dataset_valid: boolean;
}

export interface CustomerPortfolioProfile {
  client_id: string;
  client_type: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  country: string;
  region: string;
  date_of_birth_parsed: string | null;
  age: number | null;
  acquisition_purpose: string;
  satisfaction_score: number;
  loan_applied: string;
  loan_applied_binary: number;
  referral_channel: string;
  total_properties: number;
  total_spend: number;
  avg_price_per_unit: number;
  avg_floor_area_sqft: number;
  office_units_count: number;
  office_ratio: number;
  apartment_units_count: number;
  apartment_ratio: number;
}

export interface OverviewAnalyticsResponse {
  total_buyers: number;
  total_properties: number;
  total_sold_properties: number;
  total_portfolio_spend: number;
  avg_satisfaction: number;
  investment_purpose_pct: number;
  loan_usage_pct: number;
  unique_countries_count: number;
  active_cluster_count: number;
}

export interface PreprocessingConfig {
  scaler_type?: "standard" | "robust" | "log_standard";
  include_country?: boolean;
  include_gender?: boolean;
  country_top_n?: number;
  numerical_features?: string[];
  categorical_features?: string[];
}

export interface CandidateKMetrics {
  k: number;
  inertia: number;
  silhouette_score: number;
  calinski_harabasz: number;
  davies_bouldin: number;
  min_cluster_pct: number;
  cluster_sizes: Record<number, number>;
}

export interface CandidateKEvaluation {
  evaluations: CandidateKMetrics[];
  recommended_k: number;
  recommendation_rationale: string;
  alternative_k_candidates: number[];
  min_cluster_pct_threshold: number;
}

export interface NumericalFeatureProfile {
  feature_name: string;
  mean: number;
  median: number;
  std: number;
  iqr: number;
  q25: number;
  q75: number;
  population_mean: number;
  population_std: number;
  z_score_deviation: number;
  pct_difference: number;
}

export interface CategoricalFeatureProfile {
  feature_name: string;
  category_distributions: Record<string, number>;
  category_counts: Record<string, number>;
  population_distributions: Record<string, number>;
  percentage_point_diff: Record<string, number>;
}

export interface ClusterProfile {
  cluster_id: number;
  count: number;
  percentage: number;
  numerical_profiles: Record<string, NumericalFeatureProfile>;
  categorical_profiles: Record<string, CategoricalFeatureProfile>;
  differentiating_features: string[];
  negligible_features: string[];
}

export interface ArchetypeInterpretation {
  cluster_id: number;
  cluster_key: string;
  generated_name: string;
  user_nickname?: string | null;
  display_name?: string;
  confidence: "Strong Evidence" | "Moderate Evidence" | "Weak Evidence" | "Exploratory Micro-Segment";
  is_micro_segment: boolean;
  short_thesis: string;
  detailed_rationale: string;
  supporting_evidence: string[];
  counter_evidence: string[];
  rejection_reasons: Record<string, string>;
  key_metrics_summary: Record<string, number>;
  count: number;
  percentage: number;
}

export interface SegmentationRequest {
  k?: number;
  random_state?: number;
  n_init?: number;
  min_cluster_pct_threshold?: number;
  preprocessing_config?: PreprocessingConfig;
  user_nicknames?: Record<number, string>;
}

export interface SegmentationResponse {
  run_id: string;
  algorithm: string;
  k: number;
  random_state: number;
  cluster_assignments: Record<string, number>;
  cluster_sizes: Record<number, number>;
  cluster_percentages: Record<number, number>;
  metrics: CandidateKMetrics;
  cluster_profiles: Record<number, ClusterProfile>;
  archetypes: Record<number, ArchetypeInterpretation>;
  feature_names: string[];
  execution_time_ms: number;
}

export interface SegmentDetailResponse {
  cluster_id: number;
  profile: ClusterProfile;
  archetype: ArchetypeInterpretation;
}

export interface HierarchicalLinkageResult {
  linkage_matrix: number[][];
  leaf_labels: string[];
  cophenetic_correlation: number;
  sample_size: number;
}

export interface PCAProjectionPoint {
  client_id: string;
  cluster_id: number;
  x: number;
  y: number;
  z: number;
}

export interface PCAProjectionResult {
  points: PCAProjectionPoint[];
  explained_variance_ratio: number[];
  total_explained_variance: number;
  feature_count: number;
  sample_count: number;
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// TICK-10: Investor Behavior & Geographic Intelligence TypeScript Interfaces
// ---------------------------------------------------------------------------

export interface InvestorSummaryKPIs {
  total_buyers: number;
  investment_buyers_count: number;
  home_buyers_count: number;
  investment_rate_pct: number;
  loan_buyers_count: number;
  cash_buyers_count: number;
  loan_rate_pct: number;
  individual_count: number;
  company_count: number;
  company_rate_pct: number;
  avg_portfolio_size: number;
  median_portfolio_size: number;
  avg_spend: number;
  median_spend: number;
  spend_iqr: number;
  avg_unit_price: number;
  median_unit_price: number;
  avg_satisfaction: number;
  median_satisfaction: number;
}

export interface FinancingByPurposeBreakdown {
  loan_home_count: number;
  loan_home_pct: number;
  loan_investment_count: number;
  loan_investment_pct: number;
  cash_home_count: number;
  cash_home_pct: number;
  cash_investment_count: number;
  cash_investment_pct: number;
}

export interface ClusterFinancingItem {
  cluster_id: number;
  archetype_name: string;
  total_buyers: number;
  loan_count: number;
  cash_count: number;
  loan_rate_pct: number;
  cash_rate_pct: number;
}

export interface PercentileDistribution {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  iqr: number;
}

export interface BehavioralComparisonGroup {
  group_key: string;
  group_label: string;
  buyer_count: number;
  share_pct: number;
  avg_portfolio_size: number;
  median_portfolio_size: number;
  avg_spend: number;
  median_spend: number;
  avg_unit_price: number;
  median_unit_price: number;
  avg_satisfaction: number;
  loan_rate_pct: number;
  investment_rate_pct: number;
}

export interface InvestorBehaviorResponse {
  summary: InvestorSummaryKPIs;
  financing_by_purpose: FinancingByPurposeBreakdown;
  financing_by_cluster: ClusterFinancingItem[];
  portfolio_size_distribution: Record<number, number>;
  spend_percentiles: PercentileDistribution;
  price_percentiles: PercentileDistribution;
  comparison_by_cluster: BehavioralComparisonGroup[];
  comparison_by_purpose: BehavioralComparisonGroup[];
  comparison_by_client_type: BehavioralComparisonGroup[];
}

export interface MultiPropertyAnalyticsResponse {
  threshold: number;
  qualifying_buyers_count: number;
  qualifying_percentage: number;
  total_spend: number;
  avg_spend: number;
  median_spend: number;
  avg_properties: number;
  median_properties: number;
  investment_purpose_count: number;
  investment_rate_pct: number;
  home_purpose_count: number;
  loan_count: number;
  loan_rate_pct: number;
  cash_count: number;
  corporate_count: number;
  corporate_rate_pct: number;
  individual_count: number;
  distribution_by_properties: Record<number, number>;
  top_countries: Record<string, number>;
  qualifying_buyers: CustomerPortfolioProfile[];
}

export interface TopRegionSummary {
  region: string;
  buyer_count: number;
  share_pct: number;
}

export interface CountryDistributionItem {
  country: string;
  buyer_count: number;
  percentage: number;
  investment_count: number;
  investment_rate_pct: number;
  loan_count: number;
  loan_rate_pct: number;
  corporate_count: number;
  corporate_rate_pct: number;
  avg_spend: number;
  median_spend: number;
  avg_properties: number;
  avg_unit_price: number;
  avg_satisfaction: number;
  region_count: number;
  top_regions: TopRegionSummary[];
}

export interface RegionDistributionItem {
  country: string;
  region: string;
  buyer_count: number;
  percentage_of_country: number;
  percentage_of_total: number;
  investment_rate_pct: number;
  loan_rate_pct: number;
  corporate_rate_pct: number;
  avg_spend: number;
  median_spend: number;
  avg_properties: number;
  avg_satisfaction: number;
}

export interface GeoBehaviorMatrixRow {
  country: string;
  buyer_count: number;
  share_pct: number;
  investment_rate_pct: number;
  loan_rate_pct: number;
  corporate_rate_pct: number;
  avg_portfolio_size: number;
  avg_spend: number;
  median_spend: number;
  avg_unit_price: number;
  avg_satisfaction: number;
}

export interface GeographicIntelligenceResponse {
  total_buyers: number;
  total_countries: number;
  total_regions: number;
  avg_spend_global: number;
  top_country_name: string;
  top_country_share_pct: number;
  countries: CountryDistributionItem[];
  regions: RegionDistributionItem[];
  cross_matrix: GeoBehaviorMatrixRow[];
}

export interface SeedAgreementPair {
  seed_a: number;
  seed_b: number;
  adjusted_rand_index: number;
  normalized_mutual_info: number;
}

export interface ClusterStabilityResponse {
  k: number;
  seeds_evaluated: number[];
  mean_adjusted_rand_index: number;
  min_adjusted_rand_index: number;
  max_adjusted_rand_index: number;
  mean_normalized_mutual_info: number;
  pairwise_agreements: SeedAgreementPair[];
  stability_rating: string;
  interpretation_caveat: string;
}

export interface FeatureMetadataResponse {
  total_feature_dimensions: number;
  numerical_features: string[];
  categorical_features: string[];
  excluded_features: string[];
  scaler_applied: string;
  top_n_countries_encoded: number;
  feature_dimension_names: string[];
}

