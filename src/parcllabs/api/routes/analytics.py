"""Market analytics, investor behavior, geography, and PCA projection endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from parcllabs.api.schemas import (
    GeographicIntelligenceResponse,
    InvestorBehaviorResponse,
    MultiPropertyAnalyticsResponse,
    OverviewAnalyticsResponse,
)
from parcllabs.ml.pca import PCAProjectionResult
from parcllabs.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Market Analytics & Projections"])

def get_service(request: Request) -> AnalyticsService:
    return request.app.state.service  # type: ignore[no-any-return]

@router.get("/overview", response_model=OverviewAnalyticsResponse, summary="Get Market Overview KPIs")
def get_overview_analytics(service: AnalyticsService = Depends(get_service)) -> OverviewAnalyticsResponse:
    """Compute and return high-level summary KPIs (total buyers, capital deployed, loan usage, satisfaction)."""
    return service.get_overview_analytics()

@router.get("/projection", response_model=PCAProjectionResult, summary="Get 2D/3D PCA Scatter Coordinates")
def get_pca_projection(service: AnalyticsService = Depends(get_service)) -> PCAProjectionResult:
    """Return 2D/3D PCA coordinates linked to client IDs and active cluster assignments."""
    return service.get_pca_projection()

@router.get("/investor-behavior", response_model=InvestorBehaviorResponse, summary="Get Investor Behavior Analytics")
def get_investor_behavior(
    country: Optional[str] = Query(default=None, description="Filter by origin country"),
    region: Optional[str] = Query(default=None, description="Filter by region/state"),
    client_type: Optional[str] = Query(default=None, description="Filter by client type (Individual, Company)"),
    acquisition_purpose: Optional[str] = Query(default=None, description="Filter by purpose (Home, Investment)"),
    loan_status: Optional[str] = Query(default=None, description="Filter by loan financing status (Yes, No)"),
    cluster_id: Optional[int] = Query(default=None, description="Filter by cluster ID"),
    service: AnalyticsService = Depends(get_service),
) -> InvestorBehaviorResponse:
    """Return comprehensive descriptive analytics across financing, portfolio scale, and behavioral cohorts."""
    return service.get_investor_behavior(
        country=country,
        region=region,
        client_type=client_type,
        acquisition_purpose=acquisition_purpose,
        loan_status=loan_status,
        cluster_id=cluster_id,
    )

@router.get("/multi-property", response_model=MultiPropertyAnalyticsResponse, summary="Get Multi-Property Accumulator Analytics")
def get_multi_property_analytics(
    threshold: int = Query(default=5, ge=1, le=20, description="Minimum total property count threshold (N)"),
    country: Optional[str] = Query(default=None, description="Filter by country"),
    cluster_id: Optional[int] = Query(default=None, description="Filter by cluster ID"),
    service: AnalyticsService = Depends(get_service),
) -> MultiPropertyAnalyticsResponse:
    """Return statistics, capital deployment, and distribution for multi-property accumulator buyers."""
    return service.get_multi_property_analytics(
        threshold=threshold,
        country=country,
        cluster_id=cluster_id,
    )

@router.get("/geography", response_model=GeographicIntelligenceResponse, summary="Get Geographic Intelligence")
def get_geographic_intelligence(
    selected_country: Optional[str] = Query(default=None, description="Filter by specific country"),
    acquisition_purpose: Optional[str] = Query(default=None, description="Filter by purpose"),
    loan_status: Optional[str] = Query(default=None, description="Filter by loan status"),
    cluster_id: Optional[int] = Query(default=None, description="Filter by cluster ID"),
    service: AnalyticsService = Depends(get_service),
) -> GeographicIntelligenceResponse:
    """Return country distributions, sub-national region statistics, and the Geographic x Behavioral cross-matrix."""
    return service.get_geographic_intelligence(
        selected_country=selected_country,
        acquisition_purpose=acquisition_purpose,
        loan_status=loan_status,
        cluster_id=cluster_id,
    )

