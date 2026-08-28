"""Machine Learning clustering, diagnostic evaluation, and hierarchical endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Request
from parcllabs.api.schemas import (
    ClusterStabilityResponse,
    FeatureMetadataResponse,
    SegmentDetailResponse,
    SegmentationRequest,
    SegmentationResponse,
)
from parcllabs.ml.contracts import (
    CandidateKEvaluation,
    HierarchicalLinkageResult,
)
from parcllabs.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/ml", tags=["Machine Learning Segmentation"])

def get_service(request: Request) -> AnalyticsService:
    return request.app.state.service  # type: ignore[no-any-return]

@router.get("/evaluation", response_model=CandidateKEvaluation, summary="Get Candidate K Evaluations (K=2..10)")
def get_candidate_k_evaluation(service: AnalyticsService = Depends(get_service)) -> CandidateKEvaluation:
    """Return multi-metric diagnostic evaluation across candidate K values with automated recommendation."""
    return service.get_candidate_k_evaluation()

@router.post("/segments", response_model=SegmentationResponse, summary="Execute / Reconfigure Segmentation Run")
def run_segmentation(
    request_data: SegmentationRequest,
    service: AnalyticsService = Depends(get_service),
) -> SegmentationResponse:
    """Trigger or reconfigure a K-Means clustering run with custom K, seed, and preprocessing options."""
    return service.run_segmentation(request_data)

@router.get("/segments/{cluster_id}", response_model=SegmentDetailResponse, summary="Get Single Segment Detail")
def get_segment_detail(
    cluster_id: int,
    service: AnalyticsService = Depends(get_service),
) -> SegmentDetailResponse:
    """Return empirical profile and evidence-grounded archetype interpretation for a single cluster ID."""
    try:
        return service.get_segment_detail(cluster_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.get("/hierarchical", response_model=HierarchicalLinkageResult, summary="Get Hierarchical Dendrogram Linkage")
def get_hierarchical_clustering(
    sample_size: int = 150,
    service: AnalyticsService = Depends(get_service),
) -> HierarchicalLinkageResult:
    """Return Ward linkage matrix and leaf node labels for interactive dendrogram exploration."""
    return service.get_hierarchical_clustering(sample_size=sample_size)

@router.get("/stability", response_model=ClusterStabilityResponse, summary="Get Multi-Seed Cluster Stability Analysis")
def get_cluster_stability(
    k: int = 3,
    service: AnalyticsService = Depends(get_service),
) -> ClusterStabilityResponse:
    """Return pairwise seed agreement metrics (ARI/NMI) across multiple centroid initializations."""
    return service.get_cluster_stability(k=k)

@router.get("/feature-metadata", response_model=FeatureMetadataResponse, summary="Get ML Feature Matrix Metadata")
def get_feature_metadata(
    service: AnalyticsService = Depends(get_service),
) -> FeatureMetadataResponse:
    """Return dynamic metadata of the 24 input feature dimensions, transformations, and excluded features."""
    return service.get_feature_metadata()

