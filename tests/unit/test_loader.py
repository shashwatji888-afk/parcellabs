import tempfile
from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.core.exceptions import DataValidationError
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.data.auditor import audit_datasets

def test_load_clients_csv_missing_file() -> None:
    with pytest.raises(FileNotFoundError):
        load_clients_csv("nonexistent_clients.csv")

def test_load_properties_csv_missing_file() -> None:
    with pytest.raises(FileNotFoundError):
        load_properties_csv("nonexistent_properties.csv")

def test_load_clients_csv_missing_required_column() -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("client_id,client_type,date_of_birth\nC0001,Individual,05-11-1968\n")
        temp_path = Path(f.name)

    try:
        with pytest.raises(DataValidationError) as exc:
            load_clients_csv(temp_path)
        assert "Missing required columns" in str(exc.value)
    finally:
        temp_path.unlink(missing_ok=True)

def test_load_properties_csv_missing_required_column() -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("listing_id,tower_number,sale_price\n1012,1,$300,000\n")
        temp_path = Path(f.name)

    try:
        with pytest.raises(DataValidationError) as exc:
            load_properties_csv(temp_path)
        assert "Missing required columns" in str(exc.value)
    finally:
        temp_path.unlink(missing_ok=True)

def test_load_clients_csv_sanitizes_records() -> None:
    csv_content = (
        "client_id,client_type,first_name,last_name,date_of_birth,gender,country,region,acquisition_purpose,satisfaction_score,loan_applied,referral_channel\n"
        "C0001,Individual,Kareem,Liu,05-11-1968,F,USA,California,Home,4,Yes,Website\n"
        "C0002,Company,Marleez,Co,2/28/1976,M,USA,California,Investment,5,No,Agency\n"
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write(csv_content)
        temp_path = Path(f.name)

    try:
        config = DomainConfig(reference_date=date(2024, 1, 1))
        clients = load_clients_csv(temp_path, config=config)
        assert len(clients) == 2
        assert clients[0].client_id == "C0001"
        assert clients[0].date_of_birth_parsed == date(1968, 5, 11)
        assert clients[0].age == 55
        assert clients[0].loan_applied_binary == 1
        assert clients[0].country == "USA"
        assert clients[0].region == "California"

        assert clients[1].client_id == "C0002"
        assert clients[1].date_of_birth_parsed == date(1976, 2, 28)
        assert clients[1].age == 47
        assert clients[1].loan_applied_binary == 0
    finally:
        temp_path.unlink(missing_ok=True)

def test_load_clients_csv_row_sanitization_failure() -> None:
    csv_content = (
        "client_id,client_type,first_name,last_name,date_of_birth,gender,country,region,acquisition_purpose,satisfaction_score,loan_applied,referral_channel\n"
        "C0001,Individual,Kareem,Liu,invalid-dob,F,USA,California,Home,4,Yes,Website\n"
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write(csv_content)
        temp_path = Path(f.name)

    try:
        with pytest.raises(DataValidationError) as exc:
            load_clients_csv(temp_path)
        assert "failed sanitization" in str(exc.value)
    finally:
        temp_path.unlink(missing_ok=True)

def test_load_properties_csv_distinguishes_sold_and_available() -> None:
    csv_content = (
        "listing_id,tower_number,transaction_date,unit_category,unit_number,floor_area_sqft,sale_price,listing_status,client_ref\n"
        "1012,1,01-01-2024,Apartment,12,1160.36,\"$300,385.62\",Sold,C0027\n"
        "4039,4,01-01-2024,Apartment,39,785.48,\"$216,826.00\",Available,\n"
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write(csv_content)
        temp_path = Path(f.name)

    try:
        properties = load_properties_csv(temp_path)
        assert len(properties) == 2
        sold_prop = properties[0]
        assert sold_prop.listing_id == 1012
        assert sold_prop.sale_price == 300385.62
        assert sold_prop.listing_status == "Sold"
        assert sold_prop.is_sold is True
        assert sold_prop.client_ref == "C0027"

        avail_prop = properties[1]
        assert avail_prop.listing_id == 4039
        assert avail_prop.sale_price == 216826.0
        assert avail_prop.listing_status == "Available"
        assert avail_prop.is_sold is False
        assert avail_prop.client_ref is None
    finally:
        temp_path.unlink(missing_ok=True)

def test_load_properties_csv_row_sanitization_failure() -> None:
    csv_content = (
        "listing_id,tower_number,transaction_date,unit_category,unit_number,floor_area_sqft,sale_price,listing_status,client_ref\n"
        "1012,1,01-01-2024,Apartment,12,1160.36,\"invalid-price\",Sold,C0027\n"
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write(csv_content)
        temp_path = Path(f.name)

    try:
        with pytest.raises(DataValidationError) as exc:
            load_properties_csv(temp_path)
        assert "failed sanitization" in str(exc.value)
    finally:
        temp_path.unlink(missing_ok=True)

def test_auditor_detects_data_quality_issues() -> None:
    clients_csv = (
        "client_id,client_type,first_name,last_name,date_of_birth,gender,country,region,acquisition_purpose,satisfaction_score,loan_applied,referral_channel\n"
        "C0001,Individual,Kareem,Liu,05-11-1968,F,USA,California,Home,4,Yes,Website\n"
        "C0001,Company,Duplicate,Co,2/28/1976,M,USA,California,Investment,5,No,Agency\n"
        "C0002,Individual,InvalidDate,User,invalid-dob,M,USA,California,Home,3,No,Website\n"
    )
    props_csv = (
        "listing_id,tower_number,transaction_date,unit_category,unit_number,floor_area_sqft,sale_price,listing_status,client_ref\n"
        "1012,1,01-01-2024,Apartment,12,1160.36,\"$300,385.62\",Sold,C0001\n"
        "1013,1,01-01-2024,Apartment,13,750.00,\"$200,000.00\",Sold,C9999\n"  # Orphan client_ref
        "1014,1,01-01-2024,Apartment,14,800.00,\"$250,000.00\",Sold,\n"        # Sold without client_ref
        "1015,1,01-01-2024,Apartment,15,850.00,\"$260,000.00\",Available,C0001\n"  # Available with client_ref
        "1016,1,01-01-2024,Apartment,16,850.00,\"invalid-price\",Sold,C0001\n"  # Invalid price
        "1017,1,invalid-tx-date,Apartment,17,850.00,\"$260,000.00\",Sold,C0001\n"  # Invalid tx date
    )
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as fc, \
         tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as fp:
        fc.write(clients_csv)
        fp.write(props_csv)
        path_c = Path(fc.name)
        path_p = Path(fp.name)

    try:
        report = audit_datasets(path_c, path_p)
        assert report.total_clients_count == 3
        assert "C0001" in report.duplicate_client_ids
        assert len(report.invalid_date_records) == 2  # 1 in clients, 1 in properties
        assert len(report.invalid_currency_records) == 1
        assert 1014 in report.unlinked_sold_properties
        assert "C9999" in report.orphan_client_refs
        assert 1015 in report.available_properties_with_client_ref
        assert report.is_dataset_valid is False
    finally:
        path_c.unlink(missing_ok=True)
        path_p.unlink(missing_ok=True)
