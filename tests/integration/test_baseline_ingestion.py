import time
from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.data.auditor import audit_datasets

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_dataset_ingestion_and_audit() -> None:
    assert BASELINE_CLIENTS_PATH.exists(), "clients.csv must exist in project root"
    assert BASELINE_PROPERTIES_PATH.exists(), "properties.csv must exist in project root"

    start_time = time.perf_counter()
    config = DomainConfig(reference_date=date(2024, 1, 1))

    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)
    audit = audit_datasets(BASELINE_CLIENTS_PATH, BASELINE_PROPERTIES_PATH, config=config)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    # Assertions on clients
    assert len(clients) == 2000
    assert audit.total_clients_count == 2000
    assert len(audit.duplicate_client_ids) == 0
    assert len(audit.invalid_date_records) == 0

    # Assertions on properties
    assert len(properties) == 10000
    assert audit.total_properties_count == 10000
    assert audit.sold_properties_count == 7305
    assert audit.available_properties_count == 2695
    assert len(audit.duplicate_listing_ids) == 0
    assert len(audit.unlinked_sold_properties) == 0
    assert len(audit.orphan_client_refs) == 0
    assert len(audit.available_properties_with_client_ref) == 0
    assert audit.is_dataset_valid is True

    # Check age range
    ages = [c.age for c in clients]
    assert min(ages) >= 18
    assert max(ages) <= 115

    # Check that execution time is logged
    print(f"\nBaseline ingestion and audit completed in {elapsed_ms:.2f} ms")
