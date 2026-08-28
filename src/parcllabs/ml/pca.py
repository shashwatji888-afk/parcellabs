"""Principal Component Analysis (PCA) projection engine for 2D and 3D dimensionality reduction."""

from typing import Dict, List, Optional
import numpy as np
from pydantic import BaseModel, ConfigDict, Field
from sklearn.decomposition import PCA

from parcllabs.ml.contracts import ProcessedMLMatrix

class PCAProjectionPoint(BaseModel):
    """Coordinates of a single client data point in 2D/3D latent PCA space."""
    model_config = ConfigDict(frozen=True)

    client_id: str = Field(..., description="Unique client identifier")
    cluster_id: int = Field(..., description="Assigned cluster integer identifier")
    x: float = Field(..., description="First Principal Component (PC1) coordinate")
    y: float = Field(..., description="Second Principal Component (PC2) coordinate")
    z: float = Field(..., description="Third Principal Component (PC3) coordinate")

class PCAProjectionResult(BaseModel):
    """Complete PCA projection payload for interactive 2D and 3D scatter visualizations."""
    model_config = ConfigDict(frozen=True)

    points: List[PCAProjectionPoint] = Field(..., description="Projected coordinate points for all clients")
    explained_variance_ratio: List[float] = Field(
        ..., description="Variance ratio explained by each principal component [PC1, PC2, PC3]"
    )
    total_explained_variance: float = Field(
        ..., description="Cumulative variance explained by top 3 components"
    )
    feature_count: int = Field(..., description="Original dimensionality D before projection")
    sample_count: int = Field(..., description="Number of projected points N")

class PCAProjector:
    """Computes deterministic PCA projections from preprocessed feature matrices."""

    def __init__(self, random_state: int = 42) -> None:
        self.random_state: int = random_state

    def project(
        self,
        matrix: ProcessedMLMatrix,
        cluster_assignments: Dict[str, int],
    ) -> PCAProjectionResult:
        """
        Fit PCA (3 components) on the standardized feature matrix and transform.

        Args:
            matrix: Standardized ProcessedMLMatrix.
            cluster_assignments: Mapping of client_id to assigned cluster integer ID.

        Returns:
            PCAProjectionResult with 3D coordinates, explained variance, and client mapping.
        """
        n_samples = matrix.sample_count
        if n_samples < 3:
            raise ValueError("PCA projection requires at least 3 samples.")

        n_components = min(3, matrix.feature_count, n_samples)
        pca = PCA(n_components=n_components, random_state=self.random_state)
        coords = pca.fit_transform(matrix.data)

        exp_var = [round(float(v), 4) for v in pca.explained_variance_ratio_]
        total_var = round(float(np.sum(exp_var)), 4)

        points: List[PCAProjectionPoint] = []
        for i in range(n_samples):
            cid = matrix.client_ids[i]
            c_id = cluster_assignments.get(cid, 0)
            x = round(float(coords[i, 0]), 4)
            y = round(float(coords[i, 1]), 4) if n_components > 1 else 0.0
            z = round(float(coords[i, 2]), 4) if n_components > 2 else 0.0

            points.append(
                PCAProjectionPoint(
                    client_id=cid,
                    cluster_id=c_id,
                    x=x,
                    y=y,
                    z=z,
                )
            )

        return PCAProjectionResult(
            points=points,
            explained_variance_ratio=exp_var,
            total_explained_variance=total_var,
            feature_count=matrix.feature_count,
            sample_count=n_samples,
        )
