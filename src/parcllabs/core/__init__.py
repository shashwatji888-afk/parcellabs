"""Core configuration, constants, and exceptions for Parcl Labs."""

from parcllabs.core.config import (
    DomainConfig,
    ClientType,
    AcquisitionPurpose,
    ListingStatus,
    ReferralChannel,
    UnitCategory,
    calculate_age,
)
from parcllabs.core.exceptions import (
    ParclLabsError,
    InvalidDateOfBirthError,
    DataValidationError,
    MissingPropertyReferenceError,
)

__all__ = [
    "DomainConfig",
    "ClientType",
    "AcquisitionPurpose",
    "ListingStatus",
    "ReferralChannel",
    "UnitCategory",
    "calculate_age",
    "ParclLabsError",
    "InvalidDateOfBirthError",
    "DataValidationError",
    "MissingPropertyReferenceError",
]
