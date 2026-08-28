"""Data quality auditing engine for detecting anomalies, unlinked records, and invalid values."""

from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Set, Union
import pandas as pd

from parcllabs.core.config import DomainConfig
from parcllabs.data.parsers import parse_currency, parse_date, parse_date_of_birth
from parcllabs.models.analytical import DataQualityReport

def audit_datasets(
    clients_path: Union[str, Path],
    properties_path: Union[str, Path],
    config: Optional[DomainConfig] = None,
) -> DataQualityReport:
    """
    Perform a comprehensive data quality audit across client and property datasets.

    Identifies:
    - Missing values by column
    - Unparseable or invalid dates
    - Malformed currency values
    - Duplicate IDs
    - Sold units with missing client references
    - Available units with unexpected client references
    - Orphan client references (referencing client_id not in clients dataset)

    Args:
        clients_path: Path to clients.csv.
        properties_path: Path to properties.csv.
        config: Domain configuration.

    Returns:
        Structured DataQualityReport instance.
    """
    active_config = config or DomainConfig()
    c_path = Path(clients_path)
    p_path = Path(properties_path)

    df_clients = pd.read_csv(c_path, dtype=str)
    df_props = pd.read_csv(p_path, dtype=str)

    # 1. Missing values count
    missing_by_col: Dict[str, int] = {}
    for col in df_clients.columns:
        missing_by_col[f"clients.{col}"] = int(df_clients[col].isna().sum() + (df_clients[col] == "").sum())
    for col in df_props.columns:
        if col == "client_ref":
            sold_mask = df_props["listing_status"].str.strip().str.capitalize() == "Sold"
            missing_by_col["properties.client_ref_on_sold"] = int(
                (df_props.loc[sold_mask, "client_ref"].isna() | (df_props.loc[sold_mask, "client_ref"] == "")).sum()
            )
        else:
            missing_by_col[f"properties.{col}"] = int(df_props[col].isna().sum() + (df_props[col] == "").sum())

    # 2. Date validation
    invalid_dates: List[Dict[str, str]] = []
    client_records = df_clients.to_dict("records")
    for idx, row in enumerate(client_records):
        try:
            parse_date_of_birth(row.get("date_of_birth"), reference_date=active_config.reference_date)
        except Exception as err:
            invalid_dates.append({
                "source": "clients.csv",
                "row_index": str(idx),
                "client_id": str(row.get("client_id", "")),
                "raw_value": str(row.get("date_of_birth", "")),
                "error": str(err),
            })

    prop_records = df_props.to_dict("records")
    for idx, row in enumerate(prop_records):
        try:
            parse_date(row.get("transaction_date"))
        except Exception as err:
            invalid_dates.append({
                "source": "properties.csv",
                "row_index": str(idx),
                "listing_id": str(row.get("listing_id", "")),
                "raw_value": str(row.get("transaction_date", "")),
                "error": str(err),
            })

    # 3. Currency validation
    invalid_currencies: List[Dict[str, str]] = []
    for idx, row in enumerate(prop_records):
        try:
            parse_currency(row.get("sale_price"))
        except Exception as err:
            invalid_currencies.append({
                "source": "properties.csv",
                "row_index": str(idx),
                "listing_id": str(row.get("listing_id", "")),
                "raw_value": str(row.get("sale_price", "")),
                "error": str(err),
            })

    # 4. Duplicate ID checks
    client_id_counts = Counter(df_clients["client_id"].dropna().str.strip())
    dup_clients = [cid for cid, count in client_id_counts.items() if count > 1]

    listing_id_counts = Counter(df_props["listing_id"].dropna().str.strip())
    dup_listings = [int(lid) for lid, count in listing_id_counts.items() if count > 1 and lid.isdigit()]

    # 5. Referential integrity
    valid_client_ids: Set[str] = set(df_clients["client_id"].dropna().str.strip())

    unlinked_sold: List[int] = []
    orphan_refs: List[str] = []
    avail_with_client: List[int] = []

    sold_count = 0
    avail_count = 0

    for row in prop_records:
        status = str(row.get("listing_status", "")).strip().capitalize()
        client_ref = row.get("client_ref")
        has_client = pd.notna(client_ref) and str(client_ref).strip() != ""
        listing_id_str = str(row.get("listing_id", "")).strip()
        listing_id = int(listing_id_str) if listing_id_str.isdigit() else -1

        if status == "Sold":
            sold_count += 1
            if not has_client:
                unlinked_sold.append(listing_id)
            else:
                cid = str(client_ref).strip()
                if cid not in valid_client_ids:
                    orphan_refs.append(cid)
        elif status == "Available":
            avail_count += 1
            if has_client:
                avail_with_client.append(listing_id)

    is_valid = (
        len(dup_clients) == 0
        and len(dup_listings) == 0
        and len(unlinked_sold) == 0
        and len(orphan_refs) == 0
        and len(avail_with_client) == 0
        and len(invalid_dates) == 0
        and len(invalid_currencies) == 0
    )

    return DataQualityReport(
        total_clients_count=len(df_clients),
        total_properties_count=len(df_props),
        sold_properties_count=sold_count,
        available_properties_count=avail_count,
        missing_values_by_column=missing_by_col,
        invalid_date_records=invalid_dates,
        invalid_currency_records=invalid_currencies,
        duplicate_client_ids=dup_clients,
        duplicate_listing_ids=dup_listings,
        unlinked_sold_properties=unlinked_sold,
        orphan_client_refs=orphan_refs,
        available_properties_with_client_ref=avail_with_client,
        is_dataset_valid=is_valid,
    )
