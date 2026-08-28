from datetime import date
from typing import List
import numpy as np
import pytest

from parcllabs.models.analytical import CustomerPortfolioProfile
from parcllabs.ml.contracts import PreprocessingConfig, ProcessedMLMatrix
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor

@pytest.fixture
def sample_profiles() -> List[CustomerPortfolioProfile]:
    return [
        CustomerPortfolioProfile(
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
            total_properties=4,
            total_spend=1200000.0,
            avg_price_per_unit=300000.0,
            avg_floor_area_sqft=1000.0,
            office_units_count=1,
            office_ratio=0.25,
            apartment_units_count=3,
            apartment_ratio=0.75,
        ),
        CustomerPortfolioProfile(
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
            total_properties=10,
            total_spend=3500000.0,
            avg_price_per_unit=350000.0,
            avg_floor_area_sqft=1200.0,
            office_units_count=4,
            office_ratio=0.4,
            apartment_units_count=6,
            apartment_ratio=0.6,
        ),
        CustomerPortfolioProfile(
            client_id="C0003",
            client_type="Individual",
            first_name="Charlie",
            last_name="Brown",
            gender="M",
            country="UK",
            region="London",
            date_of_birth_parsed=date(1995, 8, 10),
            age=28,
            acquisition_purpose="Home",
            satisfaction_score=3,
            loan_applied="Yes",
            loan_applied_binary=1,
            referral_channel="Client",
            total_properties=3,
            total_spend=900000.0,
            avg_price_per_unit=300000.0,
            avg_floor_area_sqft=900.0,
            office_units_count=0,
            office_ratio=0.0,
            apartment_units_count=3,
            apartment_ratio=1.0,
        ),
    ]

def test_preprocessor_fit_transform_shapes(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor(config=PreprocessingConfig(scaler_type="standard"))
    matrix = preprocessor.fit_transform(sample_profiles)

    assert isinstance(matrix, ProcessedMLMatrix)
    assert matrix.data.shape[0] == 3
    assert matrix.data.shape[1] > 0
    assert matrix.client_ids == ["C0001", "C0002", "C0003"]
    assert len(matrix.feature_names) == matrix.data.shape[1]

def test_preprocessor_excludes_identifiers_and_region(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor()
    matrix = preprocessor.fit_transform(sample_profiles)

    feature_names_lower = [f.lower() for f in matrix.feature_names]
    # Check that identifiers and raw names are NOT features in the matrix
    assert not any("client_id" in f for f in feature_names_lower)
    assert not any("first_name" in f for f in feature_names_lower)
    assert not any("last_name" in f for f in feature_names_lower)
    assert not any("region" in f for f in feature_names_lower)

def test_preprocessor_excludes_redundant_apartment_ratio(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    preprocessor = CustomerFeaturePreprocessor()
    matrix = preprocessor.fit_transform(sample_profiles)

    feature_names_lower = [f.lower() for f in matrix.feature_names]
    assert any("office_ratio" in f for f in feature_names_lower)
    assert not any("apartment_ratio" in f for f in feature_names_lower)

def test_preprocessor_fit_transform_data_leakage(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    train_profiles = sample_profiles[:2]
    test_profiles = sample_profiles[2:]

    preprocessor = CustomerFeaturePreprocessor(config=PreprocessingConfig(scaler_type="standard"))
    train_matrix = preprocessor.fit_transform(train_profiles)

    # State before transform
    fitted_means = preprocessor.get_numerical_means()

    # Transform test set without refitting
    test_matrix = preprocessor.transform(test_profiles)

    # Assert means have NOT changed
    assert preprocessor.get_numerical_means() == fitted_means
    assert test_matrix.data.shape[0] == 1
    assert test_matrix.data.shape[1] == train_matrix.data.shape[1]

def test_preprocessor_handles_unseen_categories(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    train_profiles = sample_profiles[:2]
    # Test client has unseen country "Japan" and unseen referral_channel "TikTok"
    unseen_profile = CustomerPortfolioProfile(
        client_id="C9999",
        client_type="Individual",
        first_name="Ken",
        last_name="Takahashi",
        gender="M",
        country="Japan",  # Unseen in train
        region="Tokyo",
        date_of_birth_parsed=date(1985, 3, 15),
        age=38,
        acquisition_purpose="Investment",
        satisfaction_score=4,
        loan_applied="No",
        loan_applied_binary=0,
        referral_channel="TikTok",  # Unseen in train
        total_properties=5,
        total_spend=1500000.0,
        avg_price_per_unit=300000.0,
        avg_floor_area_sqft=1050.0,
        office_units_count=1,
        office_ratio=0.2,
        apartment_units_count=4,
        apartment_ratio=0.8,
    )

    preprocessor = CustomerFeaturePreprocessor()
    preprocessor.fit(train_profiles)
    matrix = preprocessor.transform([unseen_profile])

    assert matrix.data.shape[0] == 1
    assert not np.isnan(matrix.data).any()
    assert not np.isinf(matrix.data).any()

def test_preprocessor_scaler_variants(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    for scaler in ["standard", "robust", "log_standard"]:
        preprocessor = CustomerFeaturePreprocessor(config=PreprocessingConfig(scaler_type=scaler))
        matrix = preprocessor.fit_transform(sample_profiles)
        assert matrix.data.shape[0] == 3
        assert not np.isnan(matrix.data).any()
        assert not np.isinf(matrix.data).any()

def test_preprocessor_reproducibility(sample_profiles: List[CustomerPortfolioProfile]) -> None:
    prep1 = CustomerFeaturePreprocessor(config=PreprocessingConfig(scaler_type="standard"))
    m1 = prep1.fit_transform(sample_profiles)

    prep2 = CustomerFeaturePreprocessor(config=PreprocessingConfig(scaler_type="standard"))
    m2 = prep2.fit_transform(sample_profiles)

    assert m1.feature_names == m2.feature_names
    np.testing.assert_allclose(m1.data, m2.data)
