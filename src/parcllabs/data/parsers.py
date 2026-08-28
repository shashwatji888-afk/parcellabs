"""Parsing and sanitization routines for dates and currency."""

from datetime import date, datetime
import math
from typing import Any, Optional, Union
from dateutil import parser as date_parser

from parcllabs.core.config import DEFAULT_REFERENCE_DATE
from parcllabs.core.exceptions import InvalidDateOfBirthError, DataValidationError

def parse_date(
    date_input: Any,
    allow_none: bool = False,
    min_year: int = 1900,
    max_year: int = 2100,
) -> Optional[date]:
    """
    Parse a generic date string or object into a typed datetime.date.

    Args:
        date_input: Raw date string, date, or datetime.
        allow_none: If True, missing values return None; otherwise raises DataValidationError.
        min_year: Minimum acceptable calendar year.
        max_year: Maximum acceptable calendar year.

    Returns:
        Cleaned datetime.date or None.

    Raises:
        DataValidationError: If unparseable or out of valid year range.
    """
    if date_input is None:
        if allow_none:
            return None
        raise DataValidationError("Date value cannot be None/missing.")

    if isinstance(date_input, float) and math.isnan(date_input):
        if allow_none:
            return None
        raise DataValidationError("Date value cannot be NaN.")

    if isinstance(date_input, date) and not isinstance(date_input, datetime):
        if date_input.year < min_year or date_input.year > max_year:
            raise DataValidationError(f"Year {date_input.year} is outside valid range [{min_year}, {max_year}].")
        return date_input

    if isinstance(date_input, datetime):
        d = date_input.date()
        if d.year < min_year or d.year > max_year:
            raise DataValidationError(f"Year {d.year} is outside valid range [{min_year}, {max_year}].")
        return d

    str_val = str(date_input).strip()
    if not str_val:
        if allow_none:
            return None
        raise DataValidationError("Date value cannot be empty or whitespace.")

    # Formats to attempt
    formats = [
        "%m-%d-%Y",
        "%m/%d/%Y",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
    ]
    parsed_date: Optional[date] = None
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(str_val, fmt).date()
            break
        except ValueError:
            continue

    if parsed_date is None:
        try:
            dt = date_parser.parse(str_val, dayfirst=False)
            parsed_date = dt.date()
        except (ValueError, OverflowError, TypeError) as err:
            raise DataValidationError(f"Cannot parse date string: '{str_val}'.") from err

    if parsed_date.year < min_year or parsed_date.year > max_year:
        raise DataValidationError(f"Year {parsed_date.year} is outside valid range [{min_year}, {max_year}].")

    return parsed_date

def parse_date_of_birth(
    date_input: Any,
    reference_date: date = DEFAULT_REFERENCE_DATE,
    allow_none: bool = False,
) -> Optional[date]:
    """
    Sanitize and parse a date of birth string into a strongly-typed datetime.date.

    Enforces that birthdate cannot be in the future relative to the reference date.

    Args:
        date_input: Raw date string (e.g. '05-11-1968', '11/26/1962', '2/28/1976').
        reference_date: Reference anchor date for future-date validation (default 2024-01-01).
        allow_none: If True, missing or empty dates return None; otherwise raises InvalidDateOfBirthError.

    Returns:
        Cleaned datetime.date or None.

    Raises:
        InvalidDateOfBirthError: If unparseable, out of realistic range, or in the future.
    """
    try:
        parsed = parse_date(date_input, allow_none=allow_none, min_year=1900, max_year=2100)
    except DataValidationError as err:
        raise InvalidDateOfBirthError(str(err)) from err

    if parsed is None:
        return None

    if parsed > reference_date:
        raise InvalidDateOfBirthError(
            f"Date of birth {parsed.isoformat()} cannot be in the future relative to reference date {reference_date.isoformat()}."
        )

    return parsed

def parse_currency(
    currency_input: Any,
    allow_none: bool = False,
) -> Optional[float]:
    """
    Sanitize and parse a currency string into a clean float.

    Handles values such as '$300,385.62', '208930.81', '  $  407,214.29  '.

    Args:
        currency_input: Raw currency string or numeric.
        allow_none: If True, missing values return None; otherwise raises DataValidationError.

    Returns:
        Cleaned positive float in USD or None.

    Raises:
        DataValidationError: If string is malformed, missing when not allowed, or negative.
    """
    if currency_input is None:
        if allow_none:
            return None
        raise DataValidationError("Currency value cannot be None/missing.")

    if isinstance(currency_input, (int, float)):
        if isinstance(currency_input, float) and math.isnan(currency_input):
            if allow_none:
                return None
            raise DataValidationError("Currency value cannot be NaN.")
        val = float(currency_input)
        if val < 0.0:
            raise DataValidationError(f"Currency value cannot be negative: {val}")
        return val

    str_val = str(currency_input).strip()
    if not str_val:
        if allow_none:
            return None
        raise DataValidationError("Currency value cannot be empty or whitespace.")

    # Check for negative indicators
    if "-" in str_val or "(" in str_val:
        raise DataValidationError(f"Currency value cannot be negative: '{str_val}'.")

    # Remove currency symbol, commas, and whitespace
    cleaned = str_val.replace("$", "").replace(",", "").strip()

    try:
        val = float(cleaned)
    except ValueError as err:
        raise DataValidationError(
            f"Malformed currency format: '{str_val}'."
        ) from err

    if val < 0.0:
        raise DataValidationError(f"Currency value cannot be negative: {val}.")

    return val
