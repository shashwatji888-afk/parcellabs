from datetime import date
from typing import List
import pytest

from parcllabs.core.exceptions import DataValidationError, MissingPropertyReferenceError
from parcllabs.models.analytical import EnrichedProperty, SanitizedClientRecord, CustomerPortfolioProfile
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.features.lineage import FEATURE_LINEAGE_REGISTRY

@pytest.fixture
def sample_clients() -> List[SanitizedClientRecord]:
    return [
        SanitizedClientRecord(
            client_id="C0001",
            client_type="Individual",
            first_name="Alice",
            last_name="Smith",
            gender="F",
            country="USA",
            region="California",
            date_of_birth_parsed=date(1980, 5, 15),
            age=43,
            acquisition_purpose="Home",
            satisfaction_score=4,
            loan_applied="Yes",
            loan_applied_binary=1,
            referral_channel="Website",
        ),
        SanitizedClientRecord(
            client_id="C0002",
            client_type="Company",
            first_name="Bob",
            last_name="Corp",
            gender="M",
            country="Canada",
            region="Quebec",
            date_of_birth_parsed=date(1975, 2, 20),
            age=48,
            acquisition_purpose="Investment",
            satisfaction_score=5,
            loan_applied="No",
            loan_applied_binary=0,
            referral_channel="Agency",
        ),
        SanitizedClientRecord(
            client_id="C0003",
            client_type="Individual",
            first_name="Charlie",
            last_name="Brown",
            gender="M",
            country="UK",
            region="London",
            date_of_birth_parsed=date(1990, 8, 10),
            age=33,
            acquisition_purpose="Home",
            satisfaction_score=3,
            loan_applied="Yes",
            loan_applied_binary=1,
            referral_channel="Client",
        ),
    ]

@pytest.fixture
def sample_properties() -> List[EnrichedProperty]:
    return [
        # C0001 has 1 apartment ($200,000, 800 sqft)
        EnrichedProperty(
            listing_id=101,
            tower_number=1,
            transaction_date=date(2024, 1, 15),
            unit_category="Apartment",
            unit_number=10,
            floor_area_sqft=800.0,
            sale_price=200000.0,
            listing_status="Sold",
            client_ref="C0001",
        ),
        # C0002 has 2 properties: 1 Apartment ($300,000, 1000 sqft), 1 Office ($500,000, 1400 sqft)
        EnrichedProperty(
            listing_id=102,
            tower_number=1,
            transaction_date=date(2024, 2, 1),
            unit_category="Apartment",
            unit_number=11,
            floor_area_sqft=1000.0,
            sale_price=300000.0,
            listing_status="Sold",
            client_ref="C0002",
        ),
        EnrichedProperty(
            listing_id=103,
            tower_number=2,
            transaction_date=date(2024, 2, 10),
            unit_category="Office",
            unit_number=12,
            floor_area_sqft=1400.0,
            sale_price=500000.0,
            listing_status="Sold",
            client_ref="C0002",
        ),
        # Available property (not linked to anyone)
        EnrichedProperty(
            listing_id=104,
            tower_number=2,
            transaction_date=date(2024, 3, 1),
            unit_category="Apartment",
            unit_number=14,
            floor_area_sqft=900.0,
            sale_price=250000.0,
            listing_status="Available",
            client_ref=None,
        ),
        # C0003 has 0 properties (testing zero-portfolio client)
    ]

def test_aggregation_single_client_single_property(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    profiles = aggregate_customer_portfolios(sample_clients, sample_properties)
    p_c1 = next(p for p in profiles if p.client_id == "C0001")

    assert p_c1.total_properties == 1
    assert p_c1.total_spend == 200000.0
    assert p_c1.avg_price_per_unit == 200000.0
    assert p_c1.avg_floor_area_sqft == 800.0
    assert p_c1.apartment_units_count == 1
    assert p_c1.apartment_ratio == 1.0
    assert p_c1.office_units_count == 0
    assert p_c1.office_ratio == 0.0

def test_aggregation_mixed_portfolio_multiple_properties(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    profiles = aggregate_customer_portfolios(sample_clients, sample_properties)
    p_c2 = next(p for p in profiles if p.client_id == "C0002")

    assert p_c2.total_properties == 2
    assert p_c2.total_spend == 800000.0
    assert p_c2.avg_price_per_unit == 400000.0
    assert p_c2.avg_floor_area_sqft == 1200.0
    assert p_c2.apartment_units_count == 1
    assert p_c2.apartment_ratio == 0.5
    assert p_c2.office_units_count == 1
    assert p_c2.office_ratio == 0.5
    assert pytest.approx(p_c2.apartment_ratio + p_c2.office_ratio) == 1.0

def test_aggregation_client_with_zero_properties(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    profiles = aggregate_customer_portfolios(sample_clients, sample_properties)
    p_c3 = next(p for p in profiles if p.client_id == "C0003")

    assert p_c3.total_properties == 0
    assert p_c3.total_spend == 0.0
    assert p_c3.avg_price_per_unit == 0.0
    assert p_c3.avg_floor_area_sqft == 0.0
    assert p_c3.office_units_count == 0
    assert p_c3.office_ratio == 0.0
    assert p_c3.apartment_units_count == 0
    assert p_c3.apartment_ratio == 0.0

def test_aggregation_available_properties_ignored(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    profiles = aggregate_customer_portfolios(sample_clients, sample_properties)
    total_spend_all = sum(p.total_spend for p in profiles)
    # Available listing 104 ($250,000) should NOT be counted
    assert total_spend_all == 1000000.0  # 200k + 800k

def test_aggregation_orphan_sold_property_strict_raises(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    orphan_prop = EnrichedProperty(
        listing_id=999,
        tower_number=1,
        transaction_date=date(2024, 1, 1),
        unit_category="Apartment",
        unit_number=99,
        floor_area_sqft=1000.0,
        sale_price=300000.0,
        listing_status="Sold",
        client_ref="C9999",  # Non-existent client
    )
    props = list(sample_properties) + [orphan_prop]

    with pytest.raises(MissingPropertyReferenceError) as exc:
        aggregate_customer_portfolios(sample_clients, props, strict=True)
    assert "C9999" in str(exc.value)

def test_aggregation_orphan_sold_property_non_strict_skips(
    sample_clients: List[SanitizedClientRecord],
    sample_properties: List[EnrichedProperty],
) -> None:
    orphan_prop = EnrichedProperty(
        listing_id=999,
        tower_number=1,
        transaction_date=date(2024, 1, 1),
        unit_category="Apartment",
        unit_number=99,
        floor_area_sqft=1000.0,
        sale_price=300000.0,
        listing_status="Sold",
        client_ref="C9999",
    )
    props = list(sample_properties) + [orphan_prop]
    profiles = aggregate_customer_portfolios(sample_clients, props, strict=False)
    assert len(profiles) == len(sample_clients)

def test_aggregation_empty_inputs() -> None:
    assert aggregate_customer_portfolios([], []) == []

def test_feature_lineage_registry_integrity() -> None:
    expected_derived = [
        "total_properties",
        "total_spend",
        "avg_price_per_unit",
        "avg_floor_area_sqft",
        "office_units_count",
        "office_ratio",
        "apartment_units_count",
        "apartment_ratio",
    ]
    for feat in expected_derived:
        assert feat in FEATURE_LINEAGE_REGISTRY
        item = FEATURE_LINEAGE_REGISTRY[feat]
        assert item.source_fields
        assert item.calculation
        assert item.business_meaning
