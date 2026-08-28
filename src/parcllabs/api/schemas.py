"""Pydantic request and response schemas for the FastAPI REST API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from parcllabs.models.analytical import DataQualityReport
from parcllabs.ml.contracts import (
    ArchetypeInterpretation,
    CandidateKEvaluation,
    CandidateKMetrics,
    ClusterProfile,
    HierarchicalLinkageResult,
    PreprocessingConfig,
)
from parcllabs.ml.pca import PCAProjectionResult

class HealthResponse(BaseModel):
    """Health check payload."""
    model_config = ConfigDict(frozen=True)

    status: str = Field(default="ok", description="Service status")
    version: str = Field(default="0.1.0", description="API version")
    app_name: str = Field(
        default="Real Estate Buyer Intelligence Platform", description="Application name"
    )

class DatasetStatusResponse(BaseModel):
    """Status and high-level inventory of loaded data."""
    model_config = ConfigDict(frozen=True)

    is_loaded: bool = Field(..., description="Whether baseline datasets are loaded")
    client_count: int = Field(..., description="Total clients loaded")
    property_count: int = Field(..., description="Total properties loaded")
    sold_property_count: int = Field(..., description="Count of sold properties")
    available_property_count: int = Field(..., description="Count of available properties")
    is_dataset_valid: bool = Field(..., description="Whether data passed referential audit")
    last_updated: str = Field(..., description="ISO 8601 timestamp of dataset load")

class OverviewAnalyticsResponse(BaseModel):
    """High-level real estate market and portfolio summary KPIs."""
    model_config = ConfigDict(frozen=True)

    total_buyers: int = Field(..., description="Total buyer records in dataset")
    total_properties: int = Field(..., description="Total property listings in dataset")
    total_sold_properties: int = Field(..., description="Total sold properties in portfolios")
    total_portfolio_spend: float = Field(..., description="Aggregate capital deployed (USD)")
    avg_satisfaction: float = Field(..., description="Mean buyer satisfaction score (1-5)")
    investment_purpose_pct: float = Field(..., description="Share of buyers with Investment acquisition intent")
    loan_usage_pct: float = Field(..., description="Share of buyers relying on mortgage financing")
    unique_countries_count: int = Field(..., description="Number of distinct buyer origin countries")
    active_cluster_count: int = Field(..., description="Current active segmentation cluster count K")

class SegmentationRequest(BaseModel):
    """Request payload to execute or reconfigure customer segmentation."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(default=3, ge=2, le=10, description="Target cluster count K (2 to 10)")
    random_state: int = Field(default=42, description="Random seed for reproducible k-means++")
    n_init: int = Field(default=20, ge=1, le=100, description="Number of centroid seed re-initializations")
    min_cluster_pct_threshold: float = Field(
        default=4.0, ge=0.0, le=100.0, description="Minimum acceptable cluster population percentage"
    )
    preprocessing_config: PreprocessingConfig = Field(
        default_factory=PreprocessingConfig, description="Feature selection and scaling configuration"
    )
    user_nicknames: Optional[Dict[int, str]] = Field(
        default=None, description="Optional presentation nicknames for clusters"
    )

class SegmentationResponse(BaseModel):
    """Comprehensive clustering execution result containing assignments, profiles, and archetypes."""
    model_config = ConfigDict(frozen=True)

    run_id: str = Field(..., description="Unique model run identifier")
    algorithm: str = Field(default="kmeans", description="Executed clustering algorithm")
    k: int = Field(..., description="Executed cluster count")
    random_state: int = Field(..., description="Random seed used")
    cluster_assignments: Dict[str, int] = Field(
        ..., description="Map of client_id to assigned cluster integer ID"
    )
    cluster_sizes: Dict[int, int] = Field(..., description="Sample count in each cluster")
    cluster_percentages: Dict[int, float] = Field(..., description="Population percentage in each cluster")
    metrics: CandidateKMetrics = Field(..., description="Clustering performance diagnostics")
    cluster_profiles: Dict[int, ClusterProfile] = Field(
        ..., description="Empirical numerical and categorical profiles"
    )
    archetypes: Dict[int, ArchetypeInterpretation] = Field(
        ..., description="Data-grounded archetype interpretations and theses"
    )
    feature_names: List[str] = Field(..., description="Features used in distance calculation")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")

class SegmentDetailResponse(BaseModel):
    """Detailed profile and archetype for a single cluster."""
    model_config = ConfigDict(frozen=True)

    cluster_id: int = Field(..., description="Cluster ID")
    profile: ClusterProfile = Field(..., description="Numerical and categorical statistical profile")
    archetype: ArchetypeInterpretation = Field(..., description="Evidence-backed semantic archetype")

class APIErrorDetail(BaseModel):
    """Structured error payload."""
    model_config = ConfigDict(frozen=True)

    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[Any] = Field(default=None, description="Additional context or validation details")

class APIErrorResponse(BaseModel):
    """Standardized top-level API error response."""
    model_config = ConfigDict(frozen=True)

    error: APIErrorDetail = Field(..., description="Error detail container")

# ---------------------------------------------------------------------------
# TICK-10: Investor Behavior & Geographic Intelligence Schemas
# ---------------------------------------------------------------------------

class InvestorSummaryKPIs(BaseModel):
    """Aggregate KPIs for the investor behavior cohort."""
    model_config = ConfigDict(frozen=True)

    total_buyers: int
    investment_buyers_count: int
    home_buyers_count: int
    investment_rate_pct: float
    loan_buyers_count: int
    cash_buyers_count: int
    loan_rate_pct: float
    individual_count: int
    company_count: int
    company_rate_pct: float
    avg_portfolio_size: float
    median_portfolio_size: float
    avg_spend: float
    median_spend: float
    spend_iqr: float
    avg_unit_price: float
    median_unit_price: float
    avg_satisfaction: float
    median_satisfaction: float

class FinancingByPurposeBreakdown(BaseModel):
    """Cross-tabulation breakdown of financing status by acquisition purpose."""
    model_config = ConfigDict(frozen=True)

    loan_home_count: int
    loan_home_pct: float
    loan_investment_count: int
    loan_investment_pct: float
    cash_home_count: int
    cash_home_pct: float
    cash_investment_count: int
    cash_investment_pct: float

class ClusterFinancingItem(BaseModel):
    """Financing breakdown for a single cluster."""
    model_config = ConfigDict(frozen=True)

    cluster_id: int
    archetype_name: str
    total_buyers: int
    loan_count: int
    cash_count: int
    loan_rate_pct: float
    cash_rate_pct: float

class PercentileDistribution(BaseModel):
    """Percentile distribution for a continuous variable."""
    model_config = ConfigDict(frozen=True)

    p5: float
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p95: float
    p99: float
    mean: float
    iqr: float

class BehavioralComparisonGroup(BaseModel):
    """Comparative behavioral metrics for a specific cohort."""
    model_config = ConfigDict(frozen=True)

    group_key: str
    group_label: str
    buyer_count: int
    share_pct: float
    avg_portfolio_size: float
    median_portfolio_size: float
    avg_spend: float
    median_spend: float
    avg_unit_price: float
    median_unit_price: float
    avg_satisfaction: float
    loan_rate_pct: float
    investment_rate_pct: float

class InvestorBehaviorResponse(BaseModel):
    """Comprehensive analytical response for the Investor Behavior dashboard."""
    model_config = ConfigDict(frozen=True)

    summary: InvestorSummaryKPIs
    financing_by_purpose: FinancingByPurposeBreakdown
    financing_by_cluster: List[ClusterFinancingItem]
    portfolio_size_distribution: Dict[int, int]
    spend_percentiles: PercentileDistribution
    price_percentiles: PercentileDistribution
    comparison_by_cluster: List[BehavioralComparisonGroup]
    comparison_by_purpose: List[BehavioralComparisonGroup]
    comparison_by_client_type: List[BehavioralComparisonGroup]

class MultiPropertyAnalyticsResponse(BaseModel):
    """Analytical response for multi-property accumulator buyers."""
    model_config = ConfigDict(frozen=True)

    threshold: int
    qualifying_buyers_count: int
    qualifying_percentage: float
    total_spend: float
    avg_spend: float
    median_spend: float
    avg_properties: float
    median_properties: float
    investment_purpose_count: int
    investment_rate_pct: float
    home_purpose_count: int
    loan_count: int
    loan_rate_pct: float
    cash_count: int
    corporate_count: int
    corporate_rate_pct: float
    individual_count: int
    distribution_by_properties: Dict[int, int]
    top_countries: Dict[str, int]
    qualifying_buyers: List[Any]

class CountryDistributionItem(BaseModel):
    """Detailed geographic and behavioral metrics for a single country."""
    model_config = ConfigDict(frozen=True)

    country: str
    buyer_count: int
    percentage: float
    investment_count: int
    investment_rate_pct: float
    loan_count: int
    loan_rate_pct: float
    corporate_count: int
    corporate_rate_pct: float
    avg_spend: float
    median_spend: float
    avg_properties: float
    avg_unit_price: float
    avg_satisfaction: float
    region_count: int
    top_regions: List[Dict[str, Any]]

class RegionDistributionItem(BaseModel):
    """Geographic metrics for a sub-national region."""
    model_config = ConfigDict(frozen=True)

    country: str
    region: str
    buyer_count: int
    percentage_of_country: float
    percentage_of_total: float
    investment_rate_pct: float
    loan_rate_pct: float
    corporate_rate_pct: float
    avg_spend: float
    median_spend: float
    avg_properties: float
    avg_satisfaction: float

class GeoBehaviorMatrixRow(BaseModel):
    """Row in the Geographic x Behavioral analytical matrix."""
    model_config = ConfigDict(frozen=True)

    country: str
    buyer_count: int
    share_pct: float
    investment_rate_pct: float
    loan_rate_pct: float
    corporate_rate_pct: float
    avg_portfolio_size: float
    avg_spend: float
    median_spend: float
    avg_unit_price: float
    avg_satisfaction: float

class GeographicIntelligenceResponse(BaseModel):
    """Comprehensive analytical response for Geographic Intelligence."""
    model_config = ConfigDict(frozen=True)

    total_buyers: int
    total_countries: int
    total_regions: int
    avg_spend_global: float
    top_country_name: str
    top_country_share_pct: float
    countries: List[CountryDistributionItem]
    regions: List[RegionDistributionItem]
    cross_matrix: List[GeoBehaviorMatrixRow]

class SeedAgreementPair(BaseModel):
    """Pairwise agreement metrics between two distinct random initialization seeds."""
    model_config = ConfigDict(frozen=True)

    seed_a: int = Field(..., description="First initialization random state seed")
    seed_b: int = Field(..., description="Second initialization random state seed")
    adjusted_rand_index: float = Field(..., description="Adjusted Rand Index (ARI) measure of cluster assignment agreement")
    normalized_mutual_info: float = Field(..., description="Normalized Mutual Information (NMI) score")

class ClusterStabilityResponse(BaseModel):
    """Statistical stability and convergence analysis across different initialization seeds."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(..., description="Number of clusters evaluated")
    seeds_evaluated: List[int] = Field(..., description="List of evaluated random seeds")
    mean_adjusted_rand_index: float = Field(..., description="Mean ARI across all pairwise seed comparisons")
    min_adjusted_rand_index: float = Field(..., description="Minimum pairwise ARI")
    max_adjusted_rand_index: float = Field(..., description="Maximum pairwise ARI")
    mean_normalized_mutual_info: float = Field(..., description="Mean NMI score across pairwise seed comparisons")
    pairwise_agreements: List[SeedAgreementPair] = Field(..., description="Detailed pairwise seed agreement metrics")
    stability_rating: str = Field(..., description="Qualitative convergence assessment")
    interpretation_caveat: str = Field(..., description="Explicit disclaimer distinguishing stability from cluster validity")

class FeatureMetadataResponse(BaseModel):
    """Authoritative baseline feature matrix metadata and preprocessing parameters."""
    model_config = ConfigDict(frozen=True)

    total_feature_dimensions: int = Field(..., description="Total input dimension count used in Euclidean distance calculations")
    numerical_features: List[str] = Field(..., description="Continuous numerical attributes transformed by scaler")
    categorical_features: List[str] = Field(..., description="Categorical attributes expanded via one-hot encoding")
    excluded_features: List[str] = Field(..., description="Features intentionally excluded from ML distance calculation")
    scaler_applied: str = Field(..., description="Applied continuous transformation scaler (StandardScaler)")
    top_n_countries_encoded: int = Field(..., description="Number of top countries included in one-hot matrix")
    feature_dimension_names: List[str] = Field(..., description="Exact ordered names of all 24 feature columns")

