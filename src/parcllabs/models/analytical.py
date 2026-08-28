"""Analytical domain models representing cleaned, typed, and enriched business entities."""

from datetime import date
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

class SanitizedClientRecord(BaseModel):
    """Sanitized individual client record with parsed birthdate, computed age, and raw strings preserved."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    client_id: str = Field(..., min_length=1, description="Unique client identifier")
    client_type: str = Field(..., description="Client classification (Individual or Company)")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    gender: str = Field(..., description="Gender identifier")
    country: str = Field(..., description="Raw country of residence")
    region: str = Field(..., description="Raw state/province/city")
    date_of_birth_parsed: date = Field(..., description="Sanitized typed Date of Birth")
    age: int = Field(..., ge=0, description="Exact completed age calculated against reference date")
    acquisition_purpose: str = Field(..., description="Intent (Home or Investment)")
    satisfaction_score: int = Field(..., ge=1, le=5, description="Satisfaction score (1 to 5)")
    loan_applied: str = Field(..., description="Financing status string (Yes or No)")
    loan_applied_binary: int = Field(..., ge=0, le=1, description="Binary loan flag (1 for Yes, 0 for No)")
    referral_channel: str = Field(..., description="Customer referral source")

class CustomerPortfolioProfile(BaseModel):
    """Cleaned customer entity joined with aggregated property portfolio statistics."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    # Identifiers & Demographics
    client_id: str = Field(..., min_length=1, description="Unique client identifier")
    client_type: str = Field(..., description="Client entity classification (Individual or Company)")
    first_name: str = Field(..., description="Client first name")
    last_name: str = Field(..., description="Client last name")
    gender: str = Field(..., description="Gender identifier (M or F)")
    country: str = Field(..., description="Raw country string preserved for reporting & Geo maps")
    region: str = Field(..., description="Raw region string preserved for sub-national analysis")
    date_of_birth_parsed: date = Field(..., description="Sanitized and parsed Date of Birth")
    age: int = Field(..., ge=0, description="Exact completed age relative to reference date")

    # Intent, Financing & Sentiment
    acquisition_purpose: str = Field(..., description="Intent (Home or Investment)")
    satisfaction_score: int = Field(..., ge=1, le=5, description="Client satisfaction rating (1-5)")
    loan_applied: str = Field(..., description="Financing status (Yes or No)")
    loan_applied_binary: int = Field(..., ge=0, le=1, description="Binary encoding: 1 for Yes, 0 for No")
    referral_channel: str = Field(..., description="Referral channel source")

    # Portfolio Aggregations
    total_properties: int = Field(..., ge=0, description="Total units owned")
    total_spend: float = Field(..., ge=0.0, description="Total portfolio dollar value in USD")
    avg_price_per_unit: float = Field(..., ge=0.0, description="Average price per acquired unit")
    avg_floor_area_sqft: float = Field(..., ge=0.0, description="Average unit square footage")
    office_units_count: int = Field(..., ge=0, description="Number of commercial units owned")
    office_ratio: float = Field(..., ge=0.0, le=1.0, description="Commercial property proportion (0.0 to 1.0)")
    apartment_units_count: int = Field(..., ge=0, description="Number of residential units owned")
    apartment_ratio: float = Field(..., ge=0.0, le=1.0, description="Residential property proportion (0.0 to 1.0)")

    @model_validator(mode="after")
    def validate_ratios(self) -> "CustomerPortfolioProfile":
        if (self.office_ratio + self.apartment_ratio) > 1.0001:
            raise ValueError(
                f"Sum of office_ratio ({self.office_ratio}) and apartment_ratio ({self.apartment_ratio}) exceeds 1.0"
            )
        return self

class EnrichedProperty(BaseModel):
    """Cleaned property entity with parsed currency, typed date, and association."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    listing_id: int = Field(..., ge=1, description="Listing ID")
    tower_number: int = Field(..., ge=1, description="Building tower number")
    transaction_date: date = Field(..., description="Cleaned transaction date")
    unit_category: str = Field(..., description="Unit category (Apartment or Office)")
    unit_number: int = Field(..., ge=1, description="Unit index")
    floor_area_sqft: float = Field(..., gt=0.0, description="Floor area in square feet")
    sale_price: float = Field(..., ge=0.0, description="Sale price in USD")
    listing_status: str = Field(..., description="Listing status (Sold or Available)")
    client_ref: Optional[str] = Field(default=None, description="Linked client ID for sold units")

    @property
    def is_sold(self) -> bool:
        return self.listing_status.lower() == "sold"

class DataQualityReport(BaseModel):
    """Structured data quality audit summary for client and property datasets."""
    model_config = ConfigDict(frozen=True)

    total_clients_count: int = Field(..., ge=0)
    total_properties_count: int = Field(..., ge=0)
    sold_properties_count: int = Field(..., ge=0)
    available_properties_count: int = Field(..., ge=0)
    missing_values_by_column: Dict[str, int] = Field(default_factory=dict)
    invalid_date_records: List[Dict[str, str]] = Field(default_factory=list)
    invalid_currency_records: List[Dict[str, str]] = Field(default_factory=list)
    duplicate_client_ids: List[str] = Field(default_factory=list)
    duplicate_listing_ids: List[int] = Field(default_factory=list)
    unlinked_sold_properties: List[int] = Field(default_factory=list)
    orphan_client_refs: List[str] = Field(default_factory=list)
    available_properties_with_client_ref: List[int] = Field(default_factory=list)
    is_dataset_valid: bool = Field(...)
