# Parcl Labs — Real Estate Buyer Intelligence Platform

Machine Learning Based Buyer Segmentation and Investment Profiling for Real Estate Market Intelligence.

## Architecture

The platform is structured using Clean Architecture:
* **`src/parcllabs/models/raw.py`**: Raw data models mirroring incoming CSV structures.
* **`src/parcllabs/models/analytical.py`**: Cleaned, typed, and enriched domain entities.
* **`src/parcllabs/models/ml.py`**: Machine learning feature contracts and cluster profile contracts.
* **`src/parcllabs/core/config.py`**: Domain configuration, baseline reference date (`2024-01-01`), and exact age arithmetic rules.
* **`src/parcllabs/core/exceptions.py`**: Domain-specific exception hierarchy.

## Development Setup

```bash
# Initialize virtual environment
python -m venv .venv

# Install development dependencies
.\.venv\Scripts\pip.exe install -r requirements-dev.txt

# Install package in editable mode
.\.venv\Scripts\pip.exe install -e .

# Run test suite
.\.venv\Scripts\pytest.exe

# Run static type checking
.\.venv\Scripts\mypy.exe src tests
```
