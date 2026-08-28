"""Scikit-Learn based feature preprocessing pipeline for customer portfolio profiles."""

from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler, StandardScaler

from parcllabs.ml.contracts import PreprocessingConfig, ProcessedMLMatrix
from parcllabs.models.analytical import CustomerPortfolioProfile
from parcllabs.models.ml import MLFeatureMetadata

class CustomerFeaturePreprocessor:
    """
    Transforms CustomerPortfolioProfile records into an ML-ready numerical feature matrix.

    Guarantees:
    - Zero data leakage between fit and transform stages.
    - Deterministic feature column ordering.
    - Clean generated feature names with metadata.
    - Explicit exclusion of raw PII identifiers and high-cardinality region strings.
    - Safe handling of unseen categories during inference.
    """

    def __init__(self, config: Optional[PreprocessingConfig] = None) -> None:
        self.config: PreprocessingConfig = config or PreprocessingConfig()
        self.pipeline: Optional[ColumnTransformer] = None
        self.feature_names: List[str] = []
        self.feature_metadata: Dict[str, MLFeatureMetadata] = {}
        self._is_fitted: bool = False
        self._numerical_means: Dict[str, float] = {}
        self._top_countries: Set[str] = set()

    def _prepare_dataframe(
        self,
        profiles: List[CustomerPortfolioProfile],
        is_fit: bool = False,
    ) -> Tuple[pd.DataFrame, List[str]]:
        """Extract relevant fields from profiles into a clean DataFrame."""
        client_ids = [p.client_id for p in profiles]
        records = [p.model_dump() for p in profiles]
        df = pd.DataFrame(records)

        # Handle log transformation of total_spend if configured
        if self.config.scaler_type == "log_standard" and "total_spend" in df.columns:
            df["total_spend"] = np.log1p(df["total_spend"].astype(float))

        # Handle country categorization with Top-N policy
        if self.config.include_country and "country" in df.columns:
            if is_fit:
                if self.config.country_top_n is not None:
                    top_c = df["country"].value_counts().head(self.config.country_top_n).index.tolist()
                    self._top_countries = set(top_c)
                else:
                    self._top_countries = set(df["country"].unique())

            # Map non-top countries to 'Other'
            df["country"] = df["country"].apply(
                lambda c: c if c in self._top_countries else "Other"
            )

        return df, client_ids

    def _get_scaler(self) -> Any:
        """Instantiate the configured numerical scaler."""
        if self.config.scaler_type == "robust":
            return RobustScaler()
        return StandardScaler()

    def fit(self, profiles: List[CustomerPortfolioProfile]) -> "CustomerFeaturePreprocessor":
        """
        Fit the transformer pipeline on customer profiles.

        Learns scaling statistics and categorical vocabularies.
        """
        if not profiles:
            raise ValueError("Cannot fit preprocessor on an empty list of customer profiles.")

        df, _ = self._prepare_dataframe(profiles, is_fit=True)

        num_cols = [c for c in self.config.numerical_features if c in df.columns]
        cat_cols = [c for c in self.config.categorical_features if c in df.columns]

        if self.config.include_country and "country" in df.columns and "country" not in cat_cols:
            cat_cols.append("country")
        if self.config.include_gender and "gender" in df.columns and "gender" not in cat_cols:
            cat_cols.append("gender")

        # Record baseline numerical means for diagnostic and leakage tests
        self._numerical_means = {col: float(df[col].mean()) for col in num_cols}

        num_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", self._get_scaler()),
            ]
        )

        cat_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="constant", fill_value="Missing")),
                ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
            ]
        )

        self.pipeline = ColumnTransformer(
            transformers=[
                ("num", num_pipeline, num_cols),
                ("cat", cat_pipeline, cat_cols),
            ],
            remainder="drop",
        )

        self.pipeline.fit(df)

        # Extract and clean feature names
        raw_feature_names = self.pipeline.get_feature_names_out()
        self.feature_names = [name.replace("__", "_") for name in raw_feature_names]

        # Construct metadata for each generated feature
        self.feature_metadata = {}
        for feat in self.feature_names:
            if feat.startswith("num_"):
                orig_col = feat.replace("num_", "")
                self.feature_metadata[feat] = MLFeatureMetadata(
                    name=feat,
                    tier="ml_feature",
                    dtype="float64",
                    description=f"Scaled numerical feature derived from {orig_col} ({self.config.scaler_type})",
                )
            elif feat.startswith("cat_"):
                orig_col = feat.replace("cat_", "")
                self.feature_metadata[feat] = MLFeatureMetadata(
                    name=feat,
                    tier="ml_feature",
                    dtype="float64",
                    description=f"One-hot encoded binary indicator for category {orig_col}",
                )

        self._is_fitted = True
        return self

    def transform(self, profiles: List[CustomerPortfolioProfile]) -> ProcessedMLMatrix:
        """
        Transform customer profiles using the already fitted preprocessing pipeline.

        Does NOT recalculate scalers or expand categorical vocabularies.
        """
        if not self._is_fitted or self.pipeline is None:
            raise ValueError("CustomerFeaturePreprocessor must be fitted before calling transform().")

        if not profiles:
            return ProcessedMLMatrix(
                data=np.empty((0, len(self.feature_names))),
                feature_names=self.feature_names,
                client_ids=[],
                scaler_type=self.config.scaler_type,
                metadata=self.feature_metadata,
            )

        df, client_ids = self._prepare_dataframe(profiles, is_fit=False)
        transformed_data = self.pipeline.transform(df)

        return ProcessedMLMatrix(
            data=np.asarray(transformed_data, dtype=np.float64),
            feature_names=self.feature_names,
            client_ids=client_ids,
            scaler_type=self.config.scaler_type,
            metadata=self.feature_metadata,
        )

    def fit_transform(self, profiles: List[CustomerPortfolioProfile]) -> ProcessedMLMatrix:
        """Fit preprocessing pipeline and transform in a single call."""
        return self.fit(profiles).transform(profiles)

    def get_numerical_means(self) -> Dict[str, float]:
        """Return the training set means for numerical features."""
        return dict(self._numerical_means)
