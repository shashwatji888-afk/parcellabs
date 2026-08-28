"""Contracts and schema models for the Machine Learning preprocessing, clustering, profiling, and archetype layer."""

import uuid
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel, ConfigDict, Field

from parcllabs.models.ml import MLFeatureMetadata

class PreprocessingConfig(BaseModel):
    """Configuration parameters for the customer feature preprocessor."""
    model_config = ConfigDict(frozen=True)

    scaler_type: str = Field(
        default="standard",
        description="Scaling algorithm for numerical features ('standard', 'robust', 'log_standard')",
    )
    include_country: bool = Field(
        default=True,
        description="Whether to include one-hot encoded country in clustering feature matrix",
    )
    include_gender: bool = Field(
        default=False,
        description="Whether to include one-hot encoded gender in clustering feature matrix (default False per domain audit)",
    )
    country_top_n: Optional[int] = Field(
        default=10,
        description="Number of top countries to encode; remainder mapped to 'Other'",
    )
    numerical_features: List[str] = Field(
        default_factory=lambda: [
            "age",
            "satisfaction_score",
            "total_properties",
            "total_spend",
            "avg_price_per_unit",
            "office_ratio",
            "loan_applied_binary",
        ],
        description="Numerical feature columns to be scaled and standardized",
    )
    categorical_features: List[str] = Field(
        default_factory=lambda: [
            "client_type",
            "acquisition_purpose",
            "referral_channel",
        ],
        description="Categorical feature columns to be one-hot encoded",
    )

class ProcessedMLMatrix(BaseModel):
    """Container holding the standardized numerical matrix and its metadata."""
    model_config = ConfigDict(arbitrary_types_allowed=True, frozen=True)

    data: np.ndarray = Field(..., description="Processed 2D NumPy array of shape (N, D)")
    feature_names: List[str] = Field(..., description="Ordered list of generated feature column names")
    client_ids: List[str] = Field(..., description="Ordered list of client identifiers matching matrix rows")
    scaler_type: str = Field(..., description="Scaler used for continuous features")
    metadata: Dict[str, MLFeatureMetadata] = Field(
        default_factory=dict, description="Metadata dictionary for each feature"
    )

    @property
    def sample_count(self) -> int:
        return int(self.data.shape[0])

    @property
    def feature_count(self) -> int:
        return int(self.data.shape[1])

    def to_dataframe(self) -> pd.DataFrame:
        """Convert matrix into a pandas DataFrame with client_id as index."""
        return pd.DataFrame(self.data, columns=self.feature_names, index=self.client_ids)

class ClusteringConfig(BaseModel):
    """Hyperparameter and execution configuration for clustering algorithms."""
    model_config = ConfigDict(frozen=True)

    algorithm: str = Field(default="kmeans", description="Clustering algorithm ('kmeans' | 'hierarchical')")
    k: int = Field(default=4, ge=2, description="Target number of clusters")
    random_state: int = Field(default=42, description="Deterministic random state seed")
    n_init: int = Field(default=20, ge=1, description="Number of initializations with different centroid seeds")
    min_cluster_pct_threshold: float = Field(
        default=4.0, ge=0.0, le=100.0, description="Minimum acceptable cluster population percentage"
    )
    preprocessing_config: PreprocessingConfig = Field(
        default_factory=PreprocessingConfig, description="Underlying feature preprocessing configuration"
    )

class CandidateKMetrics(BaseModel):
    """Statistical evaluation metrics for a single candidate K value."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(..., ge=2, description="Candidate cluster count")
    inertia: float = Field(..., ge=0.0, description="Within-cluster sum of squares (WCSS)")
    silhouette_score: float = Field(..., ge=-1.0, le=1.0, description="Mean Silhouette Coefficient")
    calinski_harabasz: float = Field(..., ge=0.0, description="Calinski-Harabasz variance ratio criterion")
    davies_bouldin: float = Field(..., ge=0.0, description="Davies-Bouldin cluster separation index")
    min_cluster_pct: float = Field(..., ge=0.0, le=100.0, description="Smallest cluster size as percentage of N")
    cluster_sizes: Dict[int, int] = Field(..., description="Map of cluster ID to sample count")

class CandidateKEvaluation(BaseModel):
    """Comprehensive diagnostic evaluation across candidate K values with explainable recommendation."""
    model_config = ConfigDict(frozen=True)

    evaluations: List[CandidateKMetrics] = Field(..., description="Metrics for each evaluated K in range")
    recommended_k: int = Field(..., ge=2, description="Algorithmic recommended optimal cluster count")
    recommendation_rationale: str = Field(..., description="Human-readable justification for recommendation")
    alternative_k_candidates: List[int] = Field(
        default_factory=list, description="Close candidate K values with competitive metrics"
    )
    min_cluster_pct_threshold: float = Field(
        default=4.0, description="Applied micro-cluster size threshold constraint"
    )

class ClusteringRunResult(BaseModel):
    """Complete mathematical output and metadata from a clustering execution."""
    model_config = ConfigDict(frozen=True)

    run_id: str = Field(default_factory=lambda: f"run_{uuid.uuid4().hex[:8]}", description="Unique execution run ID")
    algorithm: str = Field(..., description="Executed algorithm ('kmeans' | 'hierarchical')")
    k: int = Field(..., ge=2, description="Number of clusters")
    random_state: int = Field(..., description="Random seed used")
    cluster_assignments: Dict[str, int] = Field(..., description="Mapping of client_id to assigned cluster integer ID")
    cluster_sizes: Dict[int, int] = Field(..., description="Number of members in each cluster")
    cluster_percentages: Dict[int, float] = Field(..., description="Percentage share of total population in each cluster")
    metrics: CandidateKMetrics = Field(..., description="Performance evaluation metrics for this run")
    feature_names: List[str] = Field(..., description="Feature columns used in distance calculation")
    execution_time_ms: float = Field(..., ge=0.0, description="Execution time in milliseconds")
    preprocessing_config: PreprocessingConfig = Field(..., description="Preprocessing settings used")

class HierarchicalLinkageResult(BaseModel):
    """Linkage matrix and metadata for hierarchical cluster tree visualization (dendrogram)."""
    model_config = ConfigDict(frozen=True)

    linkage_matrix: List[List[float]] = Field(..., description="Ward linkage matrix of shape (N-1, 4)")
    leaf_labels: List[str] = Field(..., description="Labels for dendrogram leaf nodes")
    cophenetic_correlation: float = Field(..., description="Cophenetic correlation measuring tree fidelity")
    sample_size: int = Field(..., ge=2, description="Number of samples included in linkage tree")

class NumericalFeatureProfile(BaseModel):
    """Statistical summary and population deviation for a continuous feature within a cluster."""
    model_config = ConfigDict(frozen=True)

    feature_name: str = Field(..., description="Feature name")
    mean: float = Field(..., description="Cluster sample mean")
    median: float = Field(..., description="Cluster sample median")
    std: float = Field(..., description="Cluster sample standard deviation")
    iqr: float = Field(..., description="Cluster interquartile range (Q75 - Q25)")
    q25: float = Field(..., description="25th percentile value")
    q75: float = Field(..., description="75th percentile value")
    population_mean: float = Field(..., description="Overall baseline population mean")
    population_std: float = Field(..., description="Overall baseline population standard deviation")
    z_score_deviation: float = Field(
        ..., description="Standardized deviation from population mean ((mean - pop_mean) / pop_std)"
    )
    pct_difference: float = Field(..., description="Percentage difference from population mean")

class CategoricalFeatureProfile(BaseModel):
    """Categorical distribution breakdown and percentage point deviation within a cluster."""
    model_config = ConfigDict(frozen=True)

    feature_name: str = Field(..., description="Categorical feature name")
    category_distributions: Dict[str, float] = Field(
        ..., description="Proportion of each category in this cluster (0.0 to 1.0)"
    )
    category_counts: Dict[str, int] = Field(..., description="Absolute count of each category in this cluster")
    population_distributions: Dict[str, float] = Field(
        ..., description="Baseline population proportion for each category"
    )
    percentage_point_diff: Dict[str, float] = Field(
        ..., description="Percentage point difference relative to baseline (cluster_pct - pop_pct)"
    )

class ClusterProfile(BaseModel):
    """Comprehensive analytical profile of a cluster against the baseline population."""
    model_config = ConfigDict(frozen=True)

    cluster_id: int = Field(..., description="Cluster integer identifier")
    count: int = Field(..., ge=1, description="Sample count in this cluster")
    percentage: float = Field(..., ge=0.0, le=100.0, description="Share of total population")
    numerical_profiles: Dict[str, NumericalFeatureProfile] = Field(
        ..., description="Statistical profiles for numerical attributes"
    )
    categorical_profiles: Dict[str, CategoricalFeatureProfile] = Field(
        ..., description="Distribution profiles for categorical attributes"
    )
    differentiating_features: List[str] = Field(
        default_factory=list, description="Top features with largest standardized deviation (|Z| >= 0.35)"
    )
    negligible_features: List[str] = Field(
        default_factory=list, description="Features showing negligible deviation from population (|Z| < 0.15)"
    )

class DatasetProfilingResult(BaseModel):
    """Complete dataset profiling result containing all cluster profiles and population baselines."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(..., ge=2, description="Number of clusters evaluated")
    algorithm: str = Field(default="kmeans", description="Clustering algorithm used")
    population_size: int = Field(..., ge=1, description="Total sample size N")
    clusters: Dict[int, ClusterProfile] = Field(..., description="Profiles indexed by cluster ID")

class ArchetypeInterpretation(BaseModel):
    """Data-grounded semantic interpretation and business thesis for an empirical cluster."""
    model_config = ConfigDict(frozen=True)

    cluster_id: int = Field(..., description="Immutable cluster integer ID")
    cluster_key: str = Field(..., description="Stable cluster string key (e.g. 'cluster_0')")
    generated_name: str = Field(..., description="Deterministic evidence-grounded archetype name")
    user_nickname: Optional[str] = Field(
        default=None, description="Optional presentation nickname; does not alter ML results"
    )
    confidence: str = Field(
        ..., description="Strength of interpretation ('Strong Evidence' | 'Moderate Evidence' | 'Weak Evidence' | 'Exploratory Micro-Segment')"
    )
    is_micro_segment: bool = Field(default=False, description="Whether this cohort represents an exploratory micro-segment (<4%)")
    short_thesis: str = Field(..., description="Concise 1-2 sentence business thesis summarizing core driver")
    detailed_rationale: str = Field(..., description="In-depth explanation contrasting driving features vs non-drivers")
    supporting_evidence: List[str] = Field(..., description="Empirical bullet points with exact metrics and effect sizes")
    counter_evidence: List[str] = Field(
        default_factory=list, description="Explicit statements bounding the interpretation and preventing false claims"
    )
    rejection_reasons: Dict[str, str] = Field(
        default_factory=dict, description="Explanations for why unsupported labels (Corporate, Office, Luxury, etc.) were rejected"
    )
    key_metrics_summary: Dict[str, float] = Field(
        default_factory=dict, description="Key numerical averages for fast UI display"
    )
    count: int = Field(..., description="Number of clients in cluster")
    percentage: float = Field(..., description="Share of total buyer population")

    @property
    def display_name(self) -> str:
        """Returns the user nickname if set, otherwise the generated analytical archetype name."""
        return self.user_nickname if self.user_nickname is not None else self.generated_name

class DatasetArchetypesResult(BaseModel):
    """Complete container of generated archetypes across all clusters."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(..., ge=2, description="Cluster count")
    algorithm: str = Field(default="kmeans", description="Clustering algorithm used")
    population_size: int = Field(..., ge=1, description="Total sample size N")
    archetypes: Dict[int, ArchetypeInterpretation] = Field(..., description="Archetypes mapped by cluster ID")
