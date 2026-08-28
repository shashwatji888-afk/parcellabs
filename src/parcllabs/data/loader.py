"""CSV Loaders and sanitization loaders for client and property datasets."""

from pathlib import Path
from typing import List, Optional, Set, Union
import pandas as pd

from parcllabs.core.config import DomainConfig, calculate_age
from parcllabs.core.exceptions import DataValidationError
from parcllabs.data.parsers import parse_currency, parse_date, parse_date_of_birth
from parcllabs.models.analytical import EnrichedProperty, SanitizedClientRecord

REQUIRED_CLIENT_COLUMNS: Set[str] = {
    "client_id",
    "client_type",
    "first_name",
    "last_name",
    "date_of_birth",
    "gender",
    "country",
    "region",
    "acquisition_purpose",
    "satisfaction_score",
    "loan_applied",
    "referral_channel",
}

REQUIRED_PROPERTY_COLUMNS: Set[str] = {
    "listing_id",
    "tower_number",
    "transaction_date",
    "unit_category",
    "unit_number",
    "floor_area_sqft",
    "sale_price",
    "listing_status",
    "client_ref",
}

def load_clients_csv(
    file_path: Union[str, Path],
    config: Optional[DomainConfig] = None,
) -> List[SanitizedClientRecord]:
    """
    Load, validate, and sanitize clients.csv into typed SanitizedClientRecord instances.

    Args:
        file_path: Path to the clients CSV file.
        config: Domain configuration specifying reference date and age limits.

    Returns:
        List of typed, validated SanitizedClientRecord instances.

    Raises:
        DataValidationError: If required columns are missing or values are malformed.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Clients dataset file not found: {path}")

    active_config = config or DomainConfig()
    df = pd.read_csv(path, dtype=str)

    missing_cols = REQUIRED_CLIENT_COLUMNS - set(df.columns)
    if missing_cols:
        raise DataValidationError(f"Missing required columns in clients dataset: {sorted(missing_cols)}")

    sanitized_records: List[SanitizedClientRecord] = []
    records = df.to_dict("records")
    for idx, row in enumerate(records):
        try:
            parsed_dob = parse_date_of_birth(
                row["date_of_birth"],
                reference_date=active_config.reference_date,
                allow_none=False,
            )
            assert parsed_dob is not None

            age = calculate_age(parsed_dob, reference_date=active_config.reference_date)
            loan_str = str(row["loan_applied"]).strip().capitalize()
            loan_binary = 1 if loan_str == "Yes" else 0

            record = SanitizedClientRecord(
                client_id=str(row["client_id"]).strip(),
                client_type=str(row["client_type"]).strip().capitalize(),
                first_name=str(row["first_name"]).strip(),
                last_name=str(row["last_name"]).strip(),
                gender=str(row["gender"]).strip().upper(),
                country=str(row["country"]).strip(),
                region=str(row["region"]).strip(),
                date_of_birth_parsed=parsed_dob,
                age=age,
                acquisition_purpose=str(row["acquisition_purpose"]).strip().capitalize(),
                satisfaction_score=int(row["satisfaction_score"]),
                loan_applied=loan_str,
                loan_applied_binary=loan_binary,
                referral_channel=str(row["referral_channel"]).strip().capitalize(),
            )
            sanitized_records.append(record)
        except Exception as err:
            raise DataValidationError(f"Row {idx} in {path.name} failed sanitization: {err}") from err

    return sanitized_records

def load_properties_csv(
    file_path: Union[str, Path],
) -> List[EnrichedProperty]:
    """
    Load, validate, and sanitize properties.csv into typed EnrichedProperty instances.

    Args:
        file_path: Path to the properties CSV file.

    Returns:
        List of typed, validated EnrichedProperty instances.

    Raises:
        DataValidationError: If required columns are missing or property attributes are malformed.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Properties dataset file not found: {path}")

    df = pd.read_csv(path, dtype=str)

    missing_cols = REQUIRED_PROPERTY_COLUMNS - set(df.columns)
    if missing_cols:
        raise DataValidationError(f"Missing required columns in properties dataset: {sorted(missing_cols)}")

    enriched_properties: List[EnrichedProperty] = []
    records = df.to_dict("records")
    for idx, row in enumerate(records):
        try:
            parsed_price = parse_currency(row["sale_price"], allow_none=False)
            assert parsed_price is not None

            parsed_tx_date = parse_date(row["transaction_date"], allow_none=False)
            assert parsed_tx_date is not None

            raw_client_ref = row["client_ref"]
            client_ref_clean: Optional[str] = None
            if pd.notna(raw_client_ref) and str(raw_client_ref).strip() != "":
                client_ref_clean = str(raw_client_ref).strip()

            status_clean = str(row["listing_status"]).strip().capitalize()

            prop = EnrichedProperty(
                listing_id=int(row["listing_id"]),
                tower_number=int(row["tower_number"]),
                transaction_date=parsed_tx_date,
                unit_category=str(row["unit_category"]).strip().capitalize(),
                unit_number=int(row["unit_number"]),
                floor_area_sqft=float(row["floor_area_sqft"]),
                sale_price=parsed_price,
                listing_status=status_clean,
                client_ref=client_ref_clean,
            )
            enriched_properties.append(prop)
        except Exception as err:
            raise DataValidationError(f"Row {idx} in {path.name} failed sanitization: {err}") from err

    return enriched_properties
