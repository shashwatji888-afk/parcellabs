from datetime import date
from typing import Any, Dict
import pytest
from pydantic import ValidationError

from parcllabs.models.raw import RawClient, RawProperty
from parcllabs.models.analytical import CustomerPortfolioProfile, EnrichedProperty
from parcllabs.models.ml import (
    MLFeatureMetadata,
    MLFeatureVector,
    ClusterProfileContract,
    ClusteringEvaluationContract,
)

# --- RAW MODEL TESTS ---

def test_raw_client_valid(valid_raw_client_dict: Dict[str, Any]) -> None:
    client = RawClient.model_validate(valid_raw_client_dict)
    assert client.client_id == "C0001"
    assert client.client_type == "Individual"
    assert client.satisfaction_score == 4

def test_raw_client_invalid_satisfaction_score(valid_raw_client_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_client_dict.copy()
    invalid_data["satisfaction_score"] = 6
    with pytest.raises(ValidationError):
        RawClient.model_validate(invalid_data)

def test_raw_client_invalid_empty_id(valid_raw_client_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_client_dict.copy()
    invalid_data["client_id"] = "   "
    with pytest.raises(ValidationError):
        RawClient.model_validate(invalid_data)

def test_raw_client_invalid_client_type(valid_raw_client_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_client_dict.copy()
    invalid_data["client_type"] = "NonProfit"
    with pytest.raises(ValidationError) as exc:
        RawClient.model_validate(invalid_data)
    assert "Invalid client_type" in str(exc.value)

def test_raw_client_invalid_acquisition_purpose(valid_raw_client_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_client_dict.copy()
    invalid_data["acquisition_purpose"] = "Speculation"
    with pytest.raises(ValidationError) as exc:
        RawClient.model_validate(invalid_data)
    assert "Invalid acquisition_purpose" in str(exc.value)

def test_raw_client_invalid_loan_applied(valid_raw_client_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_client_dict.copy()
    invalid_data["loan_applied"] = "Maybe"
    with pytest.raises(ValidationError) as exc:
        RawClient.model_validate(invalid_data)
    assert "Invalid loan_applied" in str(exc.value)

def test_raw_property_sold_valid(valid_raw_property_dict: Dict[str, Any]) -> None:
    prop = RawProperty.model_validate(valid_raw_property_dict)
    assert prop.listing_id == 1012
    assert prop.listing_status == "Sold"
    assert prop.client_ref == "C0027"

def test_raw_property_available_valid(valid_raw_property_dict: Dict[str, Any]) -> None:
    avail_data = valid_raw_property_dict.copy()
    avail_data["listing_status"] = "Available"
    avail_data["client_ref"] = None
    prop = RawProperty.model_validate(avail_data)
    assert prop.listing_status == "Available"
    assert prop.client_ref is None

def test_raw_property_invalid_negative_sqft(valid_raw_property_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_property_dict.copy()
    invalid_data["floor_area_sqft"] = -50.0
    with pytest.raises(ValidationError):
        RawProperty.model_validate(invalid_data)

def test_raw_property_invalid_listing_status(valid_raw_property_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_property_dict.copy()
    invalid_data["listing_status"] = "Pending"
    with pytest.raises(ValidationError) as exc:
        RawProperty.model_validate(invalid_data)
    assert "Invalid listing_status" in str(exc.value)

def test_raw_property_invalid_unit_category(valid_raw_property_dict: Dict[str, Any]) -> None:
    invalid_data = valid_raw_property_dict.copy()
    invalid_data["unit_category"] = "Warehouse"
    with pytest.raises(ValidationError) as exc:
        RawProperty.model_validate(invalid_data)
    assert "Invalid unit_category" in str(exc.value)

# --- ANALYTICAL DOMAIN MODEL TESTS ---

def test_customer_portfolio_profile_valid(valid_analytical_profile_dict: Dict[str, Any]) -> None:
    profile = CustomerPortfolioProfile.model_validate(valid_analytical_profile_dict)
    assert profile.client_id == "C0001"
    assert profile.age == 55
    assert profile.total_properties == 4
    assert profile.total_spend == 1246764.72
    assert profile.country == "USA"
    assert profile.region == "California"
    assert profile.loan_applied_binary == 1

def test_customer_portfolio_profile_invalid_ratio_sum(valid_analytical_profile_dict: Dict[str, Any]) -> None:
    invalid_data = valid_analytical_profile_dict.copy()
    invalid_data["office_ratio"] = 0.6
    invalid_data["apartment_ratio"] = 0.6  # Sum > 1.05
    with pytest.raises(ValidationError):
        CustomerPortfolioProfile.model_validate(invalid_data)

def test_enriched_property_valid() -> None:
    enriched = EnrichedProperty(
        listing_id=1012,
        tower_number=1,
        transaction_date=date(2024, 1, 1),
        unit_category="Apartment",
        unit_number=12,
        floor_area_sqft=1160.36,
        sale_price=300385.62,
        listing_status="Sold",
        client_ref="C0027",
    )
    assert enriched.sale_price == 300385.62
    assert enriched.is_sold is True

def test_enriched_property_available() -> None:
    enriched = EnrichedProperty(
        listing_id=4039,
        tower_number=4,
        transaction_date=date(2024, 1, 1),
        unit_category="Apartment",
        unit_number=39,
        floor_area_sqft=785.48,
        sale_price=216826.0,
        listing_status="Available",
        client_ref=None,
    )
    assert enriched.is_sold is False

# --- ML FEATURE CONTRACT TESTS ---

def test_ml_feature_vector_valid() -> None:
    feature_meta = [
        MLFeatureMetadata(name="age_scaled", tier="ml_feature", dtype="float64", description="Standardized age"),
        MLFeatureMetadata(name="total_spend_scaled", tier="ml_feature", dtype="float64", description="Standardized spend"),
    ]
    vector = MLFeatureVector(
        client_id="C0001",
        feature_names=["age_scaled", "total_spend_scaled"],
        values=[0.12, 1.45],
    )
    assert len(vector.values) == len(vector.feature_names)
    assert vector.client_id == "C0001"
    assert feature_meta[0].tier == "ml_feature"

def test_ml_feature_vector_dimension_mismatch() -> None:
    with pytest.raises(ValidationError) as exc:
        MLFeatureVector(
            client_id="C0001",
            feature_names=["age_scaled", "total_spend_scaled"],
            values=[0.12],
        )
    assert "Dimension mismatch" in str(exc.value)

def test_cluster_profile_contract() -> None:
    cluster = ClusterProfileContract(
        cluster_id=0,
        auto_archetype_name="High-Capital Corporate Acquirers",
        analyst_nickname=None,
        member_count=420,
        population_percentage=21.0,
        mean_spend=2450000.0,
        mean_age=58.4,
        mean_properties=8.2,
        loan_reliance_rate=0.12,
        satisfaction_score_mean=4.6,
        dominant_country="USA",
        office_ratio_mean=0.45,
        radar_signature={
            "spend_norm": 0.92,
            "properties_norm": 0.85,
            "age_norm": 0.65,
            "loan_norm": 0.12,
            "satisfaction_norm": 0.92,
        },
    )
    assert cluster.cluster_id == 0
    assert cluster.analyst_nickname is None
    assert cluster.population_percentage == 21.0

def test_clustering_evaluation_contract() -> None:
    eval_metric = ClusteringEvaluationContract(
        k=4,
        inertia=12400.5,
        silhouette_score=0.48,
        calinski_harabasz=320.4,
        davies_bouldin=0.85,
    )
    assert eval_metric.k == 4
    assert eval_metric.silhouette_score == 0.48
