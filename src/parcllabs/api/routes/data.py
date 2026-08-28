from typing import List
from fastapi import APIRouter, Depends, Request
from parcllabs.api.schemas import DatasetStatusResponse
from parcllabs.models.analytical import CustomerPortfolioProfile, DataQualityReport
from parcllabs.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/data", tags=["Dataset & Quality"])

def get_service(request: Request) -> AnalyticsService:
    return request.app.state.service  # type: ignore[no-any-return]

@router.get("/status", response_model=DatasetStatusResponse, summary="Get Dataset Ingestion Status")
def get_dataset_status(service: AnalyticsService = Depends(get_service)) -> DatasetStatusResponse:
    """Return dataset inventory, record counts, and loaded status."""
    return service.get_dataset_status()

@router.get("/quality", response_model=DataQualityReport, summary="Get Data Quality Audit Report")
def get_data_quality(service: AnalyticsService = Depends(get_service)) -> DataQualityReport:
    """Return referential integrity audit, anomalous records, and validation metrics."""
    return service.get_data_quality()

@router.get("/buyers", response_model=List[CustomerPortfolioProfile], summary="Get Customer Portfolio Profiles")
def get_buyers(service: AnalyticsService = Depends(get_service)) -> List[CustomerPortfolioProfile]:
    """Return all 2,000 sanitized customer portfolio profiles."""
    return service.get_buyers()
