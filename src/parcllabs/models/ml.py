"""Machine Learning feature contracts, evaluation models, and cluster profile contracts."""

from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

class MLFeatureMetadata(BaseModel):
    """Metadata schema defining an individual ML feature."""
    model_config = ConfigDict(frozen=True)

    name: str = Field(..., description="Feature identifier name")
    tier: str = Field(default="ml_feature", description="Feature tier (ml_feature | analytical | raw)")
    dtype: str = Field(..., description="Feature data type (float64, int64, etc.)")
    description: str = Field(..., description="Feature business description and derivation")

class MLFeatureVector(BaseModel):
    """Represents a standardized, encoded mathematical feature vector for a single customer."""
    model_config = ConfigDict(frozen=True)

    client_id: str = Field(..., description="Client identifier")
    feature_names: List[str] = Field(..., description="List of feature column names in order")
    values: List[float] = Field(..., description="Standardized / encoded feature values")

    @model_validator(mode="after")
    def validate_dimensions(self) -> "MLFeatureVector":
        if len(self.feature_names) != len(self.values):
            raise ValueError(
                f"Dimension mismatch: {len(self.feature_names)} feature names but {len(self.values)} values provided."
            )
        return self

class ClusterProfileContract(BaseModel):
    """Immutable cluster statistical signature and dynamic archetype interpretation."""
    model_config = ConfigDict(frozen=True)

    cluster_id: int = Field(..., ge=0, description="Mathematical cluster identifier (source of truth)")
    auto_archetype_name: str = Field(..., description="Algorithmic descriptive persona label")
    analyst_nickname: Optional[str] = Field(default=None, description="Optional presentation override label")
    member_count: int = Field(..., ge=1, description="Number of customers assigned to this cluster")
    population_percentage: float = Field(..., ge=0.0, le=100.0, description="Percentage of total population")

    # Centroid summary metrics
    mean_spend: float = Field(..., ge=0.0, description="Average total spend in USD")
    mean_age: float = Field(..., ge=0.0, description="Average buyer age")
    mean_properties: float = Field(..., ge=0.0, description="Average units owned")
    loan_reliance_rate: float = Field(..., ge=0.0, le=1.0, description="Percentage of buyers applying for loans")
    satisfaction_score_mean: float = Field(..., ge=1.0, le=5.0, description="Mean satisfaction rating")
    dominant_country: str = Field(..., description="Most prevalent country of origin")
    office_ratio_mean: float = Field(..., ge=0.0, le=1.0, description="Mean commercial property allocation")

    # Normalized radar chart points (0.0 to 1.0)
    radar_signature: Dict[str, float] = Field(..., description="Normalized multidimensional radar metrics")

class ClusteringEvaluationContract(BaseModel):
    """Performance and diagnostic metrics for a candidate K clustering run."""
    model_config = ConfigDict(frozen=True)

    k: int = Field(..., ge=2, description="Candidate cluster count")
    inertia: float = Field(..., ge=0.0, description="Within-cluster sum of squares (WCSS)")
    silhouette_score: float = Field(..., ge=-1.0, le=1.0, description="Mean Silhouette coefficient")
    calinski_harabasz: float = Field(..., ge=0.0, description="Calinski-Harabasz variance ratio criterion")
    davies_bouldin: float = Field(..., ge=0.0, description="Davies-Bouldin cluster separation index")
