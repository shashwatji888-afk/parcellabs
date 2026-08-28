import time
from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.models.analytical import CustomerPortfolioProfile

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_portfolio_aggregation_and_invariants() -> None:
    config = DomainConfig(reference_date=date(2024, 1, 1))

    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)

    start_time = time.perf_counter()
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # 1. Row count invariant
    assert len(profiles) == 2000

    # 2. Total properties sold sum invariant
    sold_props_count = sum(1 for p in properties if p.is_sold)
    total_agg_units = sum(p.total_properties for p in profiles)
    assert total_agg_units == sold_props_count == 7305

    # 3. Total capital sum invariant
    total_sold_spend = sum(p.sale_price for p in properties if p.is_sold)
    total_agg_spend = sum(p.total_spend for p in profiles)
    assert pytest.approx(total_agg_spend, rel=1e-5) == total_sold_spend

    # 4. Ratios and bounds invariants for every client
    for p in profiles:
        assert p.total_properties >= 1
        assert p.total_spend > 0.0
        assert p.avg_price_per_unit > 0.0
        assert p.avg_floor_area_sqft > 0.0
        assert 0.0 <= p.office_ratio <= 1.0
        assert 0.0 <= p.apartment_ratio <= 1.0
        assert pytest.approx(p.office_ratio + p.apartment_ratio, rel=1e-4) == 1.0
        assert p.office_units_count + p.apartment_units_count == p.total_properties

    # 5. Asset class distribution invariants
    total_offices = sum(p.office_units_count for p in profiles)
    total_apartments = sum(p.apartment_units_count for p in profiles)
    actual_sold_offices = sum(1 for p in properties if p.is_sold and p.unit_category == "Office")
    actual_sold_apartments = sum(1 for p in properties if p.is_sold and p.unit_category == "Apartment")
    assert total_offices == actual_sold_offices
    assert total_apartments == actual_sold_apartments

    print(f"\nBaseline Portfolio Aggregation completed in {elapsed_ms:.2f} ms")
