"""Raw source models representing uncleaned data directly from CSV files."""

from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

class RawClient(BaseModel):
    """Represents a single raw client row from clients.csv."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    client_id: str = Field(..., min_length=1, description="Unique client identifier (e.g. C0001)")
    client_type: str = Field(..., description="Client entity type (Individual or Company)")
    first_name: str = Field(..., description="Client first name")
    last_name: str = Field(..., description="Client last name")
    date_of_birth: str = Field(..., min_length=1, description="Raw birthdate string (e.g. 05-11-1968 or 11/26/1962)")
    gender: str = Field(..., min_length=1, description="Raw gender indicator (M or F)")
    country: str = Field(..., min_length=1, description="Country of residence")
    region: str = Field(..., min_length=1, description="Sub-national state/province/city")
    acquisition_purpose: str = Field(..., description="Acquisition intent (Home or Investment)")
    satisfaction_score: int = Field(..., ge=1, le=5, description="Satisfaction score (1 to 5)")
    loan_applied: str = Field(..., description="Financing status (Yes or No)")
    referral_channel: str = Field(..., description="Customer acquisition referral source (Website, Agency, Client)")

    @field_validator("client_type")
    @classmethod
    def validate_client_type(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in {"Individual", "Company"}:
            raise ValueError(f"Invalid client_type: {v}. Must be 'Individual' or 'Company'.")
        return normalized

    @field_validator("acquisition_purpose")
    @classmethod
    def validate_acquisition_purpose(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in {"Home", "Investment"}:
            raise ValueError(f"Invalid acquisition_purpose: {v}. Must be 'Home' or 'Investment'.")
        return normalized

    @field_validator("loan_applied")
    @classmethod
    def validate_loan_applied(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in {"Yes", "No"}:
            raise ValueError(f"Invalid loan_applied: {v}. Must be 'Yes' or 'No'.")
        return normalized

class RawProperty(BaseModel):
    """Represents a single raw property row from properties.csv."""
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    listing_id: int = Field(..., ge=1, description="Unique listing identifier")
    tower_number: int = Field(..., ge=1, description="Building tower number (1-5)")
    transaction_date: str = Field(..., min_length=1, description="Raw transaction date string")
    unit_category: str = Field(..., description="Property unit category (Apartment or Office)")
    unit_number: int = Field(..., ge=1, description="Unit index")
    floor_area_sqft: float = Field(..., gt=0.0, description="Floor area in square feet")
    sale_price: str = Field(..., min_length=1, description="Raw currency string (e.g. $300,385.62)")
    listing_status: str = Field(..., description="Listing status (Sold or Available)")
    client_ref: Optional[str] = Field(default=None, description="Client ID reference for sold units")

    @field_validator("listing_status")
    @classmethod
    def validate_listing_status(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in {"Sold", "Available"}:
            raise ValueError(f"Invalid listing_status: {v}. Must be 'Sold' or 'Available'.")
        return normalized

    @field_validator("unit_category")
    @classmethod
    def validate_unit_category(cls, v: str) -> str:
        normalized = v.strip().capitalize()
        if normalized not in {"Apartment", "Office"}:
            raise ValueError(f"Invalid unit_category: {v}. Must be 'Apartment' or 'Office'.")
        return normalized
