"""Feature lineage definitions documenting data provenance, formulas, and domain rationale."""

from typing import Dict, List
from pydantic import BaseModel, ConfigDict, Field

class FeatureLineage(BaseModel):
    """Metadata detailing the origin, derivation formula, and business semantics of a feature."""
    model_config = ConfigDict(frozen=True)

    name: str = Field(..., description="Feature identifier name")
    tier: str = Field(..., description="Feature classification (raw | analytical | ml_feature)")
    data_type: str = Field(..., description="Resulting data type")
    source_fields: List[str] = Field(..., description="Raw column inputs used in derivation")
    calculation: str = Field(..., description="Mathematical formula or derivation logic")
    business_meaning: str = Field(..., description="Real estate domain interpretation and business value")

FEATURE_LINEAGE_REGISTRY: Dict[str, FeatureLineage] = {
    "total_properties": FeatureLineage(
        name="total_properties",
        tier="analytical",
        data_type="int",
        source_fields=["properties.listing_status", "properties.client_ref"],
        calculation="count(listing_id) where listing_status == 'Sold' grouped by client_ref",
        business_meaning="Total count of acquired real estate units per client; indicates portfolio scale.",
    ),
    "total_spend": FeatureLineage(
        name="total_spend",
        tier="analytical",
        data_type="float",
        source_fields=["properties.sale_price", "properties.listing_status", "properties.client_ref"],
        calculation="sum(sale_price) where listing_status == 'Sold' grouped by client_ref",
        business_meaning="Total dollar volume (USD) deployed in sold properties; captures capital capacity.",
    ),
    "avg_price_per_unit": FeatureLineage(
        name="avg_price_per_unit",
        tier="analytical",
        data_type="float",
        source_fields=["total_spend", "total_properties"],
        calculation="total_spend / total_properties (0.0 if total_properties == 0)",
        business_meaning="Average price paid per property unit; distinguishes luxury vs mid-market asset preference.",
    ),
    "avg_floor_area_sqft": FeatureLineage(
        name="avg_floor_area_sqft",
        tier="analytical",
        data_type="float",
        source_fields=["properties.floor_area_sqft", "properties.listing_status", "properties.client_ref"],
        calculation="mean(floor_area_sqft) where listing_status == 'Sold' grouped by client_ref (0.0 if zero properties)",
        business_meaning="Average square footage across client portfolio; indicates spatial scale preference.",
    ),
    "office_units_count": FeatureLineage(
        name="office_units_count",
        tier="analytical",
        data_type="int",
        source_fields=["properties.unit_category", "properties.listing_status", "properties.client_ref"],
        calculation="count(listing_id) where listing_status == 'Sold' and unit_category == 'Office' grouped by client_ref",
        business_meaning="Count of commercial office units owned; quantifies commercial footprint.",
    ),
    "office_ratio": FeatureLineage(
        name="office_ratio",
        tier="analytical",
        data_type="float",
        source_fields=["office_units_count", "total_properties"],
        calculation="office_units_count / total_properties (0.0 if total_properties == 0)",
        business_meaning="Proportion of client's portfolio dedicated to commercial assets (0.0 to 1.0).",
    ),
    "apartment_units_count": FeatureLineage(
        name="apartment_units_count",
        tier="analytical",
        data_type="int",
        source_fields=["properties.unit_category", "properties.listing_status", "properties.client_ref"],
        calculation="count(listing_id) where listing_status == 'Sold' and unit_category == 'Apartment' grouped by client_ref",
        business_meaning="Count of residential apartment units owned; quantifies residential footprint.",
    ),
    "apartment_ratio": FeatureLineage(
        name="apartment_ratio",
        tier="analytical",
        data_type="float",
        source_fields=["apartment_units_count", "total_properties"],
        calculation="apartment_units_count / total_properties (0.0 if total_properties == 0)",
        business_meaning="Proportion of client's portfolio dedicated to residential assets (0.0 to 1.0).",
    ),
    "age": FeatureLineage(
        name="age",
        tier="analytical",
        data_type="int",
        source_fields=["clients.date_of_birth"],
        calculation="floor((reference_date - date_of_birth) in completed calendar years)",
        business_meaning="Completed age of buyer as of baseline reference date; reflects demographic life-stage.",
    ),
    "loan_applied_binary": FeatureLineage(
        name="loan_applied_binary",
        tier="analytical",
        data_type="int",
        source_fields=["clients.loan_applied"],
        calculation="1 if loan_applied == 'Yes' else 0",
        business_meaning="Binary indicator of debt financing reliance vs cash-funded purchase.",
    ),
}
