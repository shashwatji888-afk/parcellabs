"""Domain configuration, constants, enums, and utility functions."""

from datetime import date
from enum import Enum
from pathlib import Path
from typing import Final
from pydantic import BaseModel, Field

from parcllabs.core.exceptions import InvalidDateOfBirthError

DEFAULT_REFERENCE_DATE: Final[date] = date(2024, 1, 1)
DEFAULT_RANDOM_STATE: Final[int] = 42

class ClientType(str, Enum):
    INDIVIDUAL = "Individual"
    COMPANY = "Company"

class AcquisitionPurpose(str, Enum):
    HOME = "Home"
    INVESTMENT = "Investment"

class ListingStatus(str, Enum):
    SOLD = "Sold"
    AVAILABLE = "Available"

class ReferralChannel(str, Enum):
    WEBSITE = "Website"
    AGENCY = "Agency"
    CLIENT = "Client"

class UnitCategory(str, Enum):
    APARTMENT = "Apartment"
    OFFICE = "Office"

class DomainConfig(BaseModel):
    """Configuration settings for the Parcl Labs domain pipeline."""
    reference_date: date = Field(default=DEFAULT_REFERENCE_DATE, description="Anchor date for age and recency calculations.")
    min_valid_age: int = Field(default=18, description="Minimum expected buyer age for sanity logging.")
    max_valid_age: int = Field(default=115, description="Maximum expected buyer age for sanity logging.")
    random_state: int = Field(default=DEFAULT_RANDOM_STATE, description="Deterministic seed for clustering and projections.")
    data_dir: Path = Field(default=Path("data"), description="Directory holding raw dataset CSVs.")

def calculate_age(dob: date, reference_date: date = DEFAULT_REFERENCE_DATE) -> int:
    """
    Calculate exact completed age in years from date of birth relative to a reference date.

    Args:
        dob: Date of birth.
        reference_date: Configurable baseline reference date (defaults to 2024-01-01).

    Returns:
        Exact completed years of age.

    Raises:
        InvalidDateOfBirthError: If dob is strictly after reference_date.
    """
    if dob > reference_date:
        raise InvalidDateOfBirthError(
            f"Date of birth {dob.isoformat()} cannot be in the future relative to reference date {reference_date.isoformat()}."
        )
    return reference_date.year - dob.year - ((reference_date.month, reference_date.day) < (dob.month, dob.day))
