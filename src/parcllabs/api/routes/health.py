"""Health check endpoint route."""

from fastapi import APIRouter
from parcllabs.api.schemas import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
def get_health() -> HealthResponse:
    """Return API health status, service name, and version."""
    return HealthResponse(
        status="ok",
        version="0.1.0",
        app_name="Real Estate Buyer Intelligence Platform",
    )
