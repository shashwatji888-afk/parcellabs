from datetime import date, datetime
import pytest

from parcllabs.core.exceptions import InvalidDateOfBirthError, DataValidationError
from parcllabs.data.parsers import parse_date, parse_date_of_birth, parse_currency

# --- GENERIC DATE PARSING TESTS ---

def test_parse_date_objects() -> None:
    d = date(2024, 5, 1)
    assert parse_date(d) == d

    dt = datetime(2024, 5, 1, 14, 30)
    assert parse_date(dt) == date(2024, 5, 1)

def test_parse_date_nan_handling() -> None:
    assert parse_date(float("nan"), allow_none=True) is None
    with pytest.raises(DataValidationError):
        parse_date(float("nan"), allow_none=False)

def test_parse_date_year_boundary_validation() -> None:
    with pytest.raises(DataValidationError) as exc:
        parse_date("01-01-1850", min_year=1900)
    assert "outside valid range" in str(exc.value)

    with pytest.raises(DataValidationError) as exc:
        parse_date(date(1850, 1, 1), min_year=1900)
    assert "outside valid range" in str(exc.value)

    with pytest.raises(DataValidationError) as exc:
        parse_date(datetime(1850, 1, 1, 0, 0), min_year=1900)
    assert "outside valid range" in str(exc.value)

# --- DATE OF BIRTH PARSING TESTS ---

def test_parse_date_of_birth_dash_format() -> None:
    ref_date = date(2024, 1, 1)
    res = parse_date_of_birth("05-11-1968", reference_date=ref_date)
    assert res == date(1968, 5, 11)

def test_parse_date_of_birth_slash_format() -> None:
    ref_date = date(2024, 1, 1)
    res = parse_date_of_birth("11/26/1962", reference_date=ref_date)
    assert res == date(1962, 11, 26)

def test_parse_date_of_birth_single_digit_month_day() -> None:
    ref_date = date(2024, 1, 1)
    assert parse_date_of_birth("2/28/1976", reference_date=ref_date) == date(1976, 2, 28)
    assert parse_date_of_birth("9/14/1966", reference_date=ref_date) == date(1966, 9, 14)
    assert parse_date_of_birth("1/20/1937", reference_date=ref_date) == date(1937, 1, 20)

def test_parse_date_of_birth_iso_format() -> None:
    ref_date = date(2024, 1, 1)
    assert parse_date_of_birth("1975-10-05", reference_date=ref_date) == date(1975, 10, 5)

def test_parse_date_of_birth_whitespace_padding() -> None:
    ref_date = date(2024, 1, 1)
    assert parse_date_of_birth("   05-11-1968   ", reference_date=ref_date) == date(1968, 5, 11)

def test_parse_date_of_birth_future_date_raises() -> None:
    ref_date = date(2024, 1, 1)
    with pytest.raises(InvalidDateOfBirthError) as exc:
        parse_date_of_birth("02-15-2024", reference_date=ref_date)
    assert "future" in str(exc.value).lower()

def test_parse_date_of_birth_invalid_string_raises() -> None:
    ref_date = date(2024, 1, 1)
    with pytest.raises(InvalidDateOfBirthError):
        parse_date_of_birth("invalid-date-string", reference_date=ref_date)
    with pytest.raises(InvalidDateOfBirthError):
        parse_date_of_birth("99-99-9999", reference_date=ref_date)
    with pytest.raises(InvalidDateOfBirthError):
        parse_date_of_birth("02-30-1990", reference_date=ref_date)

def test_parse_date_of_birth_missing_allowed() -> None:
    ref_date = date(2024, 1, 1)
    assert parse_date_of_birth(None, reference_date=ref_date, allow_none=True) is None
    assert parse_date_of_birth("", reference_date=ref_date, allow_none=True) is None
    assert parse_date_of_birth("   ", reference_date=ref_date, allow_none=True) is None

def test_parse_date_of_birth_missing_disallowed_raises() -> None:
    ref_date = date(2024, 1, 1)
    with pytest.raises(InvalidDateOfBirthError):
        parse_date_of_birth(None, reference_date=ref_date, allow_none=False)
    with pytest.raises(InvalidDateOfBirthError):
        parse_date_of_birth("", reference_date=ref_date, allow_none=False)

# --- CURRENCY PARSING TESTS ---

def test_parse_currency_standard_dollar_with_commas() -> None:
    assert parse_currency("$300,385.62") == 300385.62

def test_parse_currency_no_dollar_symbol() -> None:
    assert parse_currency("208930.81") == 208930.81

def test_parse_currency_commas_only() -> None:
    assert parse_currency("1,250,000.00") == 1250000.0

def test_parse_currency_whitespace_padding() -> None:
    assert parse_currency("  $  407,214.29  ") == 407214.29

def test_parse_currency_numeric_input() -> None:
    assert parse_currency(300385.62) == 300385.62
    assert parse_currency(500000) == 500000.0

def test_parse_currency_nan_handling() -> None:
    assert parse_currency(float("nan"), allow_none=True) is None
    with pytest.raises(DataValidationError):
        parse_currency(float("nan"), allow_none=False)

def test_parse_currency_negative_raises() -> None:
    with pytest.raises(DataValidationError) as exc:
        parse_currency("-$100.00")
    assert "negative" in str(exc.value).lower()

    with pytest.raises(DataValidationError) as exc:
        parse_currency(-50.0)
    assert "negative" in str(exc.value).lower()

def test_parse_currency_malformed_string_raises() -> None:
    with pytest.raises(DataValidationError):
        parse_currency("N/A")
    with pytest.raises(DataValidationError):
        parse_currency("unknown")
    with pytest.raises(DataValidationError):
        parse_currency("$12.34.56")

def test_parse_currency_missing_allowed() -> None:
    assert parse_currency(None, allow_none=True) is None
    assert parse_currency("", allow_none=True) is None

def test_parse_currency_missing_disallowed_raises() -> None:
    with pytest.raises(DataValidationError):
        parse_currency(None, allow_none=False)
    with pytest.raises(DataValidationError):
        parse_currency("", allow_none=False)
