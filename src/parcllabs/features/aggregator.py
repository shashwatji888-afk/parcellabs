"""Portfolio aggregation engine transforming client records and property transactions into CustomerPortfolioProfile entities."""

from collections import defaultdict
from typing import Dict, List, Optional, Set
from pydantic import BaseModel

from parcllabs.core.exceptions import MissingPropertyReferenceError
from parcllabs.models.analytical import CustomerPortfolioProfile, EnrichedProperty, SanitizedClientRecord

class _AggregatedStats:
    """Internal container for client property portfolio aggregations."""
    def __init__(self) -> None:
        self.count: int = 0
        self.total_spend: float = 0.0
        self.total_sqft: float = 0.0
        self.office_count: int = 0
        self.apartment_count: int = 0

def aggregate_customer_portfolios(
    clients: List[SanitizedClientRecord],
    properties: List[EnrichedProperty],
    strict: bool = True,
) -> List[CustomerPortfolioProfile]:
    """
    Join sold properties to sanitized client records and derive portfolio-level analytical features.

    Derives:
    - total_properties (count of sold properties)
    - total_spend (sum of sale_price)
    - avg_price_per_unit (total_spend / total_properties)
    - avg_floor_area_sqft (mean floor_area_sqft)
    - office_units_count, office_ratio
    - apartment_units_count, apartment_ratio

    Args:
        clients: List of SanitizedClientRecord instances.
        properties: List of EnrichedProperty instances.
        strict: If True, raises MissingPropertyReferenceError if sold properties link to unknown clients.

    Returns:
        List of CustomerPortfolioProfile analytical entities.

    Raises:
        MissingPropertyReferenceError: If a sold property references an unknown client ID and strict=True.
    """
    if not clients:
        return []

    client_id_map: Dict[str, SanitizedClientRecord] = {c.client_id: c for c in clients}
    client_stats: Dict[str, _AggregatedStats] = defaultdict(_AggregatedStats)
    orphan_refs: Set[str] = set()

    for prop in properties:
        # Only sold properties belong to a buyer's portfolio
        if not prop.is_sold:
            continue

        client_ref = prop.client_ref
        if not client_ref or client_ref not in client_id_map:
            orphan_refs.add(str(client_ref))
            if strict:
                raise MissingPropertyReferenceError(
                    f"Sold property (listing_id={prop.listing_id}) references unknown client_ref '{client_ref}'."
                )
            continue

        stats = client_stats[client_ref]
        stats.count += 1
        stats.total_spend += prop.sale_price
        stats.total_sqft += prop.floor_area_sqft

        cat = prop.unit_category.capitalize()
        if cat == "Office":
            stats.office_count += 1
        elif cat == "Apartment":
            stats.apartment_count += 1

    profiles: List[CustomerPortfolioProfile] = []
    for client in clients:
        c_stats: Optional[_AggregatedStats] = client_stats.get(client.client_id)
        if c_stats is not None and c_stats.count > 0:
            total_props = c_stats.count
            total_spend = c_stats.total_spend
            avg_price = total_spend / total_props
            avg_sqft = c_stats.total_sqft / total_props
            office_count = c_stats.office_count
            office_ratio = office_count / total_props
            apt_count = c_stats.apartment_count
            apt_ratio = apt_count / total_props
        else:
            total_props = 0
            total_spend = 0.0
            avg_price = 0.0
            avg_sqft = 0.0
            office_count = 0
            office_ratio = 0.0
            apt_count = 0
            apt_ratio = 0.0

        profile = CustomerPortfolioProfile(
            client_id=client.client_id,
            client_type=client.client_type,
            first_name=client.first_name,
            last_name=client.last_name,
            gender=client.gender,
            country=client.country,
            region=client.region,
            date_of_birth_parsed=client.date_of_birth_parsed,
            age=client.age,
            acquisition_purpose=client.acquisition_purpose,
            satisfaction_score=client.satisfaction_score,
            loan_applied=client.loan_applied,
            loan_applied_binary=client.loan_applied_binary,
            referral_channel=client.referral_channel,
            total_properties=total_props,
            total_spend=round(total_spend, 2),
            avg_price_per_unit=round(avg_price, 2),
            avg_floor_area_sqft=round(avg_sqft, 2),
            office_units_count=office_count,
            office_ratio=round(office_ratio, 6),
            apartment_units_count=apt_count,
            apartment_ratio=round(apt_ratio, 6),
        )
        profiles.append(profile)

    return profiles
