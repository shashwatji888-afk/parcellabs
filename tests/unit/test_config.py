from datetime import date
import pytest

from parcllabs.core.config import (
    DomainConfig,
    ClientType,
    AcquisitionPurpose,
    ListingStatus,
    ReferralChannel,
    UnitCategory,
    calculate_age,
)
from parcllabs.core.exceptions import InvalidDateOfBirthError

def test_default_domain_config() -> None:
    config = DomainConfig()
    assert config.reference_date == date(2024, 1, 1)
    assert config.min_valid_age == 18
    assert config.max_valid_age == 115

def test_custom_domain_config_reference_date() -> None:
    custom_date = date(2025, 6, 15)
    config = DomainConfig(reference_date=custom_date)
    assert config.reference_date == custom_date

def test_domain_enums_and_constants() -> None:
    assert ClientType.INDIVIDUAL.value == "Individual"
    assert ClientType.COMPANY.value == "Company"
    assert AcquisitionPurpose.HOME.value == "Home"
    assert AcquisitionPurpose.INVESTMENT.value == "Investment"
    assert ListingStatus.SOLD.value == "Sold"
    assert ListingStatus.AVAILABLE.value == "Available"
    assert ReferralChannel.WEBSITE.value == "Website"
    assert ReferralChannel.AGENCY.value == "Agency"
    assert ReferralChannel.CLIENT.value == "Client"
    assert UnitCategory.APARTMENT.value == "Apartment"
    assert UnitCategory.OFFICE.value == "Office"

def test_calculate_age_exact_day_precision() -> None:
    ref_date = date(2024, 1, 1)
    dob = date(1968, 5, 11)
    age = calculate_age(dob=dob, reference_date=ref_date)
    assert age == 55

def test_calculate_age_boundary_cases() -> None:
    ref_date = date(2024, 1, 1)
    # Born 2000-01-01 -> exactly 24 on 2024-01-01
    assert calculate_age(date(2000, 1, 1), ref_date) == 24
    # Born 2000-01-02 -> still 23 on 2024-01-01
    assert calculate_age(date(2000, 1, 2), ref_date) == 23

def test_calculate_age_raises_on_future_dob() -> None:
    ref_date = date(2024, 1, 1)
    future_dob = date(2024, 2, 1)
    with pytest.raises(InvalidDateOfBirthError) as exc_info:
        calculate_age(dob=future_dob, reference_date=ref_date)
    assert "cannot be in the future" in str(exc_info.value)
