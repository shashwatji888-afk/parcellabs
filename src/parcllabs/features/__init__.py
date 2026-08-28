"""Feature engineering, lineage, and portfolio aggregation layer."""

from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.features.lineage import FeatureLineage, FEATURE_LINEAGE_REGISTRY

__all__ = [
    "aggregate_customer_portfolios",
    "FeatureLineage",
    "FEATURE_LINEAGE_REGISTRY",
]
