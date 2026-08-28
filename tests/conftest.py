from datetime import date
from typing import Any, Dict
import pytest

@pytest.fixture
def valid_raw_client_dict() -> Dict[str, Any]:
    return {
        "client_id": "C0001",
        "client_type": "Individual",
        "first_name": "Kareem",
        "last_name": "Liu",
        "date_of_birth": "05-11-1968",
        "gender": "F",
        "country": "USA",
        "region": "California",
        "acquisition_purpose": "Home",
        "satisfaction_score": 4,
        "loan_applied": "Yes",
        "referral_channel": "Website",
    }

@pytest.fixture
def valid_raw_property_dict() -> Dict[str, Any]:
    return {
        "listing_id": 1012,
        "tower_number": 1,
        "transaction_date": "01-01-2024",
        "unit_category": "Apartment",
        "unit_number": 12,
        "floor_area_sqft": 1160.36,
        "sale_price": "$300,385.62",
        "listing_status": "Sold",
        "client_ref": "C0027",
    }

@pytest.fixture
def valid_analytical_profile_dict() -> Dict[str, Any]:
    return {
        "client_id": "C0001",
        "client_type": "Individual",
        "first_name": "Kareem",
        "last_name": "Liu",
        "gender": "F",
        "country": "USA",
        "region": "California",
        "date_of_birth_parsed": date(1968, 5, 11),
        "age": 55,
        "acquisition_purpose": "Home",
        "satisfaction_score": 4,
        "loan_applied": "Yes",
        "loan_applied_binary": 1,
        "referral_channel": "Website",
        "total_properties": 4,
        "total_spend": 1246764.72,
        "avg_price_per_unit": 311691.18,
        "avg_floor_area_sqft": 1024.5,
        "office_units_count": 0,
        "office_ratio": 0.0,
        "apartment_units_count": 4,
        "apartment_ratio": 1.0,
    }
