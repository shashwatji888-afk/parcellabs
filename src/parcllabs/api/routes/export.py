"""CSV data export endpoints for buyer-level records and segment summaries."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, Response
from parcllabs.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/export", tags=["Data Export & Reporting"])

def get_service(request: Request) -> AnalyticsService:
    return request.app.state.service  # type: ignore[no-any-return]

@router.get("/buyers", summary="Export Buyer-Level Records as CSV")
def export_buyers_csv(
    k: int = Query(default=3, ge=2, le=10, description="Clustering model K partitions"),
    cluster_id: Optional[int] = Query(default=None, description="Optional cluster filter"),
    search: Optional[str] = Query(default=None, description="Optional search text filter"),
    service: AnalyticsService = Depends(get_service),
) -> Response:
    """Stream formatted CSV containing buyer portfolio profiles with cluster assignments and archetype metadata."""
    csv_data = service.export_buyers_csv(k=k, cluster_id=cluster_id, search=search)
    filename = f"parcllabs_buyers_k{k}"
    if cluster_id is not None:
        filename += f"_cluster{cluster_id}"
    filename += ".csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.get("/summary", summary="Export Segment Summaries as CSV")
def export_segment_summary_csv(
    k: int = Query(default=3, ge=2, le=10, description="Clustering model K partitions"),
    service: AnalyticsService = Depends(get_service),
) -> Response:
    """Stream formatted CSV containing aggregated segment statistics, financial averages, and differentiating features."""
    csv_data = service.export_segment_summary_csv(k=k)
    filename = f"parcllabs_segment_summary_k{k}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
