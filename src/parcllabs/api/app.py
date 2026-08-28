"""FastAPI application factory with structured error handling and CORS middleware."""

from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from parcllabs.api.routes import analytics, data, export, health, ml
from parcllabs.core.exceptions import (
    ClusteringConfigurationError,
    DataValidationError,
    ParclLabsError,
)
from parcllabs.services.analytics_service import AnalyticsService

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def create_app(
    service: Optional[AnalyticsService] = None,
    allowed_origins: Optional[List[str]] = None,
) -> FastAPI:
    """
    Instantiate and configure the FastAPI application.

    Args:
        service: Optional pre-initialized AnalyticsService instance.
        allowed_origins: List of allowed CORS origins for Next.js frontend.

    Returns:
        Configured FastAPI application instance.
    """
    app = FastAPI(
        title="Real Estate Buyer Intelligence Platform API",
        description="REST API providing unsupervised buyer segmentation, portfolio analytics, and ML diagnostics.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Attach or initialize service layer
    if service is None:
        service = AnalyticsService()
        service.initialize()
    app.state.service = service

    # Configure CORS
    origins = allowed_origins or DEFAULT_ALLOWED_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # Register Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                }
            },
        )

    @app.exception_handler(ClusteringConfigurationError)
    async def clustering_config_exception_handler(
        request: Request, exc: ClusteringConfigurationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "INVALID_CLUSTERING_CONFIGURATION",
                    "message": str(exc),
                }
            },
        )

    @app.exception_handler(DataValidationError)
    async def data_validation_exception_handler(
        request: Request, exc: DataValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "DATA_VALIDATION_ERROR",
                    "message": str(exc),
                }
            },
        )

    @app.exception_handler(ParclLabsError)
    async def parcllabs_generic_exception_handler(
        request: Request, exc: ParclLabsError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_DOMAIN_ERROR",
                    "message": str(exc),
                }
            },
        )

    # Mount API routers under /api
    app.include_router(health.router, prefix="/api")
    app.include_router(data.router, prefix="/api")
    app.include_router(analytics.router, prefix="/api")
    app.include_router(ml.router, prefix="/api")
    app.include_router(export.router, prefix="/api")

    return app

app = create_app()