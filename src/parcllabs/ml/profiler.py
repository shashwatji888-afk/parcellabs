"""Cluster profiling engine computing statistical distributions, baseline deviations, and differentiating drivers."""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from parcllabs.ml.contracts import (
    CategoricalFeatureProfile,
    ClusterProfile,
    DatasetProfilingResult,
    NumericalFeatureProfile,
)
from parcllabs.models.analytical import CustomerPortfolioProfile

DEFAULT_NUMERICAL_PROFILING_COLS = [
    "age",
    "satisfaction_score",
    "total_properties",
    "total_spend",
    "avg_price_per_unit",
    "avg_floor_area_sqft",
    "office_ratio",
    "loan_applied_binary",
]

DEFAULT_CATEGORICAL_PROFILING_COLS = [
    "client_type",
    "acquisition_purpose",
    "referral_channel",
    "country",
    "gender",
]

class ClusterProfiler:
    """Computes empirical cluster profiles and population deviations."""

    def __init__(
        self,
        numerical_features: Optional[List[str]] = None,
        categorical_features: Optional[List[str]] = None,
    ) -> None:
        self.numerical_features = numerical_features or list(DEFAULT_NUMERICAL_PROFILING_COLS)
        self.categorical_features = categorical_features or list(DEFAULT_CATEGORICAL_PROFILING_COLS)

    def profile(
        self,
        profiles: List[CustomerPortfolioProfile],
        cluster_assignments: Dict[str, int],
        algorithm: str = "kmeans",
    ) -> DatasetProfilingResult:
        """
        Generate statistical and distribution profiles for each cluster compared against population baselines.

        Args:
            profiles: List of CustomerPortfolioProfile analytical entities.
            cluster_assignments: Map of client_id to assigned cluster integer ID.
            algorithm: Algorithm name for metadata.

        Returns:
            DatasetProfilingResult with individual ClusterProfile objects and differentiating features.
        """
        if not profiles:
            raise ValueError("Cannot profile an empty list of customer profiles.")

        df = pd.DataFrame([p.model_dump() for p in profiles])
        df["cluster_id"] = [cluster_assignments[cid] for cid in df["client_id"]]
        pop_size = len(df)

        # 1. Compute overall population baselines
        pop_num_stats: Dict[str, Dict[str, float]] = {}
        for col in self.numerical_features:
            if col in df.columns:
                pop_num_stats[col] = {
                    "mean": float(df[col].mean()),
                    "std": float(df[col].std()) if float(df[col].std()) > 0 else 1.0,
                }

        pop_cat_dists: Dict[str, Dict[str, float]] = {}
        for col in self.categorical_features:
            if col in df.columns:
                vc = df[col].value_counts(normalize=True)
                pop_cat_dists[col] = {str(k): round(float(v), 4) for k, v in vc.items()}

        unique_clusters = sorted(df["cluster_id"].unique())
        cluster_profiles: Dict[int, ClusterProfile] = {}

        for c_id in unique_clusters:
            c_df = df[df["cluster_id"] == c_id]
            c_size = len(c_df)
            c_pct = round((c_size / pop_size) * 100.0, 3)

            # A. Numerical Profiles
            num_profiles: Dict[str, NumericalFeatureProfile] = {}
            for col in self.numerical_features:
                if col in c_df.columns:
                    c_mean = float(c_df[col].mean())
                    c_med = float(c_df[col].median())
                    c_std = float(c_df[col].std()) if len(c_df) > 1 else 0.0
                    q25 = float(c_df[col].quantile(0.25))
                    q75 = float(c_df[col].quantile(0.75))
                    iqr = q75 - q25

                    pop_mean = pop_num_stats[col]["mean"]
                    pop_std = pop_num_stats[col]["std"]
                    z_score = (c_mean - pop_mean) / pop_std
                    pct_diff = ((c_mean - pop_mean) / pop_mean) * 100.0 if pop_mean != 0 else 0.0

                    num_profiles[col] = NumericalFeatureProfile(
                        feature_name=col,
                        mean=round(c_mean, 4),
                        median=round(c_med, 4),
                        std=round(c_std, 4),
                        iqr=round(iqr, 4),
                        q25=round(q25, 4),
                        q75=round(q75, 4),
                        population_mean=round(pop_mean, 4),
                        population_std=round(pop_std, 4),
                        z_score_deviation=round(z_score, 4),
                        pct_difference=round(pct_diff, 2),
                    )

            # B. Categorical Profiles
            cat_profiles: Dict[str, CategoricalFeatureProfile] = {}
            for col in self.categorical_features:
                if col in c_df.columns:
                    raw_counts = c_df[col].value_counts().to_dict()
                    counts = {str(k): int(v) for k, v in raw_counts.items()}
                    dists = {k: round(v / c_size, 4) for k, v in counts.items()}
                    pop_dist = pop_cat_dists.get(col, {})

                    all_cats = set(pop_dist.keys()) | set(dists.keys())
                    pp_diff = {
                        k: round((dists.get(k, 0.0) - pop_dist.get(k, 0.0)) * 100.0, 2)
                        for k in all_cats
                    }

                    cat_profiles[col] = CategoricalFeatureProfile(
                        feature_name=col,
                        category_distributions=dists,
                        category_counts=counts,
                        population_distributions=pop_dist,
                        percentage_point_diff=pp_diff,
                    )

            # C. Detect Differentiating & Negligible Features
            differentiating: List[str] = []
            negligible: List[str] = []

            # Check numerical features
            for col, n_prof in num_profiles.items():
                if abs(n_prof.z_score_deviation) >= 0.35:
                    differentiating.append(f"{col} (Z={n_prof.z_score_deviation:+.2f})")
                elif abs(n_prof.z_score_deviation) < 0.15:
                    negligible.append(f"{col} (Z={n_prof.z_score_deviation:+.2f})")

            # Check categorical features
            for col, c_prof in cat_profiles.items():
                max_diff = max((abs(v) for v in c_prof.percentage_point_diff.values()), default=0.0)
                if max_diff >= 15.0:
                    top_cat = max(c_prof.percentage_point_diff, key=lambda k: abs(c_prof.percentage_point_diff[k]))
                    differentiating.append(f"{col}:{top_cat} (diff={c_prof.percentage_point_diff[top_cat]:+.1f}%)")
                elif max_diff < 5.0:
                    negligible.append(f"{col} (max_diff<5%)")

            cluster_profiles[int(c_id)] = ClusterProfile(
                cluster_id=int(c_id),
                count=c_size,
                percentage=c_pct,
                numerical_profiles=num_profiles,
                categorical_profiles=cat_profiles,
                differentiating_features=differentiating,
                negligible_features=negligible,
            )

        return DatasetProfilingResult(
            k=len(unique_clusters),
            algorithm=algorithm,
            population_size=pop_size,
            clusters=cluster_profiles,
        )
