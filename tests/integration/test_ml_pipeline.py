import time
from pathlib import Path
from datetime import date
import numpy as np
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.contracts import PreprocessingConfig, ProcessedMLMatrix
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_ml_preprocessing_pipeline() -> None:
    config = DomainConfig(reference_date=date(2024, 1, 1))
    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    start_time = time.perf_counter()
    preprocessor = CustomerFeaturePreprocessor(
        config=PreprocessingConfig(
            scaler_type="standard",
            include_country=True,
            include_gender=True,
        )
    )
    matrix = preprocessor.fit_transform(profiles)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # Assert shape
    assert matrix.data.shape[0] == 2000
    assert matrix.data.shape[1] > 10
    assert len(matrix.client_ids) == 2000
    assert len(matrix.feature_names) == matrix.data.shape[1]

    # Assert matrix quality
    assert not np.isnan(matrix.data).any()
    assert not np.isinf(matrix.data).any()

    # Assert 1-to-1 client mapping
    for i, profile in enumerate(profiles):
        assert matrix.client_ids[i] == profile.client_id

    # Check zero variance columns (every feature must have variance > 0)
    variances = np.var(matrix.data, axis=0)
    assert (variances > 1e-6).all(), f"Found zero-variance feature: {matrix.feature_names[np.argmin(variances)]}"

    print(f"\nBaseline ML Preprocessing completed in {elapsed_ms:.2f} ms")
    print(f"Resulting Matrix Dimensions: {matrix.data.shape}")
    print(f"Generated Feature Names: {matrix.feature_names}")
