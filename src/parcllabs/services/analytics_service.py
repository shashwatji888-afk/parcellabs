import csv
import datetime
import io
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

from parcllabs.api.schemas import (
    BehavioralComparisonGroup,
    ClusterFinancingItem,
    ClusterStabilityResponse,
    CountryDistributionItem,
    DatasetStatusResponse,
    FeatureMetadataResponse,
    FinancingByPurposeBreakdown,
    GeoBehaviorMatrixRow,
    GeographicIntelligenceResponse,
    InvestorBehaviorResponse,
    InvestorSummaryKPIs,
    MultiPropertyAnalyticsResponse,
    OverviewAnalyticsResponse,
    PercentileDistribution,
    RegionDistributionItem,
    SeedAgreementPair,
    SegmentDetailResponse,
    SegmentationRequest,
    SegmentationResponse,
)
from parcllabs.core.config import DomainConfig
from parcllabs.core.exceptions import ClusteringConfigurationError, DataValidationError
from parcllabs.data.auditor import audit_datasets
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.archetypes import ArchetypeGenerator
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.contracts import (
    CandidateKEvaluation,
    ClusteringConfig,
    HierarchicalLinkageResult,
    PreprocessingConfig,
    ProcessedMLMatrix,
)
from parcllabs.ml.evaluator import ClusterEvaluator
from parcllabs.ml.hierarchical import HierarchicalClusterer
from parcllabs.ml.pca import PCAProjector, PCAProjectionResult
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.profiler import ClusterProfiler
from parcllabs.models.analytical import (
    CustomerPortfolioProfile,
    DataQualityReport,
    EnrichedProperty,
    SanitizedClientRecord,
)

DEFAULT_CLIENTS_PATH = Path("clients.csv")
DEFAULT_PROPERTIES_PATH = Path("properties.csv")

class AnalyticsService:
    """
    Central application service managing dataset ingestion, caching analysis runs,
    and delegating to domain engines.
    """

    def __init__(
        self,
        clients_path: Path = DEFAULT_CLIENTS_PATH,
        properties_path: Path = DEFAULT_PROPERTIES_PATH,
        config: Optional[DomainConfig] = None,
    ) -> None:
        self.clients_path: Path = clients_path
        self.properties_path: Path = properties_path
        self.config: DomainConfig = config or DomainConfig()

        self._clients: List[SanitizedClientRecord] = []
        self._properties: List[EnrichedProperty] = []
        self._profiles: List[CustomerPortfolioProfile] = []
        self._audit_report: Optional[DataQualityReport] = None
        self._last_loaded_at: Optional[str] = None

        # Preprocessing & ML caches
        self._preprocessor: Optional[CustomerFeaturePreprocessor] = None
        self._matrix: Optional[ProcessedMLMatrix] = None
        self._evaluation: Optional[CandidateKEvaluation] = None
        self._active_segmentation: Optional[SegmentationResponse] = None
        self._cached_pca: Optional[PCAProjectionResult] = None

        # Profiler and Archetype generator instances
        self._profiler: ClusterProfiler = ClusterProfiler()
        self._archetype_generator: ArchetypeGenerator = ArchetypeGenerator()
        self._pca_projector: PCAProjector = PCAProjector()

    def initialize(self) -> None:
        """Load and sanitize baseline data, compute aggregations, and cache default K=3 run."""
        if not self.clients_path.exists() or not self.properties_path.exists():
            raise FileNotFoundError("Baseline CSV datasets not found.")

        self._clients = load_clients_csv(self.clients_path, config=self.config)
        self._properties = load_properties_csv(self.properties_path)
        self._profiles = aggregate_customer_portfolios(self._clients, self._properties, strict=True)
        self._audit_report = audit_datasets(self.clients_path, self.properties_path, config=self.config)
        self._last_loaded_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Run default preprocessing (include_gender=False per domain audit)
        self._preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
        self._matrix = self._preprocessor.fit_transform(self._profiles)

        # Run default segmentation (K=3)
        self.run_segmentation(SegmentationRequest(k=3, random_state=42, n_init=20))

    def get_dataset_status(self) -> DatasetStatusResponse:
        """Return dataset status and inventory counts."""
        if not self._clients or not self._properties:
            return DatasetStatusResponse(
                is_loaded=False,
                client_count=0,
                property_count=0,
                sold_property_count=0,
                available_property_count=0,
                is_dataset_valid=False,
                last_updated="",
            )

        sold_count = sum(1 for p in self._properties if p.is_sold)
        avail_count = sum(1 for p in self._properties if not p.is_sold)
        is_valid = self._audit_report.is_dataset_valid if self._audit_report else False

        return DatasetStatusResponse(
            is_loaded=True,
            client_count=len(self._clients),
            property_count=len(self._properties),
            sold_property_count=sold_count,
            available_property_count=avail_count,
            is_dataset_valid=is_valid,
            last_updated=self._last_loaded_at or "",
        )

    def get_data_quality(self) -> DataQualityReport:
        """Return dataset quality audit report."""
        if not self._audit_report:
            self._audit_report = audit_datasets(self.clients_path, self.properties_path, config=self.config)
        return self._audit_report

    def get_buyers(self) -> List[CustomerPortfolioProfile]:
        """Return all sanitized and aggregated customer portfolio profiles."""
        if not self._profiles:
            raise DataValidationError("No customer profiles available.")
        return self._profiles

    def get_overview_analytics(self) -> OverviewAnalyticsResponse:
        """Compute high-level market KPI metrics from live data."""
        if not self._profiles:
            raise DataValidationError("No customer profiles available for analytics.")

        total_buyers = len(self._profiles)
        total_properties = len(self._properties)
        total_sold = sum(1 for p in self._properties if p.is_sold)
        total_spend = sum(p.total_spend for p in self._profiles)
        avg_sat = sum(p.satisfaction_score for p in self._profiles) / total_buyers
        invest_pct = (sum(1 for p in self._profiles if p.acquisition_purpose == "Investment") / total_buyers) * 100.0
        loan_pct = (sum(p.loan_applied_binary for p in self._profiles) / total_buyers) * 100.0
        unique_countries = len(set(p.country for p in self._profiles))
        active_k = self._active_segmentation.k if self._active_segmentation else 3

        return OverviewAnalyticsResponse(
            total_buyers=total_buyers,
            total_properties=total_properties,
            total_sold_properties=total_sold,
            total_portfolio_spend=round(total_spend, 2),
            avg_satisfaction=round(avg_sat, 2),
            investment_purpose_pct=round(invest_pct, 2),
            loan_usage_pct=round(loan_pct, 2),
            unique_countries_count=unique_countries,
            active_cluster_count=active_k,
        )

    def get_candidate_k_evaluation(self) -> CandidateKEvaluation:
        """Evaluate candidate K=2..10 models (cached)."""
        if self._evaluation is not None:
            return self._evaluation

        if self._matrix is None:
            self._preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
            self._matrix = self._preprocessor.fit_transform(self._profiles)

        evaluator = ClusterEvaluator(min_k=2, max_k=10, min_cluster_pct_threshold=4.0, random_state=42, n_init=20)
        self._evaluation = evaluator.evaluate(self._matrix)
        return self._evaluation

    def run_segmentation(self, request: SegmentationRequest) -> SegmentationResponse:
        """Execute K-Means clustering, generate empirical profiles and archetypes."""
        if not self._profiles:
            raise DataValidationError("No customer profiles loaded to segment.")

        # If preprocessing settings changed, refit matrix
        prep_config = request.preprocessing_config
        if self._matrix is None or self._preprocessor is None or self._preprocessor.config != prep_config:
            self._preprocessor = CustomerFeaturePreprocessor(prep_config)
            self._matrix = self._preprocessor.fit_transform(self._profiles)

        cluster_config = ClusteringConfig(
            algorithm="kmeans",
            k=request.k,
            random_state=request.random_state,
            n_init=request.n_init,
            min_cluster_pct_threshold=request.min_cluster_pct_threshold,
            preprocessing_config=prep_config,
        )

        clusterer = KMeansClusterer(cluster_config)
        run_res = clusterer.fit(self._matrix)

        # Profile clusters against population baseline
        profiling_res = self._profiler.profile(self._profiles, run_res.cluster_assignments)

        # Generate evidence-grounded archetypes
        archetypes_res = self._archetype_generator.generate_archetypes(
            profiling_result=profiling_res,
            user_nicknames=request.user_nicknames,
        )

        response = SegmentationResponse(
            run_id=run_res.run_id,
            algorithm=run_res.algorithm,
            k=run_res.k,
            random_state=run_res.random_state,
            cluster_assignments=run_res.cluster_assignments,
            cluster_sizes=run_res.cluster_sizes,
            cluster_percentages=run_res.cluster_percentages,
            metrics=run_res.metrics,
            cluster_profiles=profiling_res.clusters,
            archetypes=archetypes_res.archetypes,
            feature_names=run_res.feature_names,
            execution_time_ms=run_res.execution_time_ms,
        )

        # Update active caches
        self._active_segmentation = response
        self._cached_pca = self._pca_projector.project(self._matrix, run_res.cluster_assignments)
        return response

    def get_segment_detail(self, cluster_id: int) -> SegmentDetailResponse:
        """Return profile and archetype for a specific cluster."""
        if not self._active_segmentation:
            self.run_segmentation(SegmentationRequest(k=3))

        assert self._active_segmentation is not None
        if cluster_id not in self._active_segmentation.cluster_profiles:
            raise KeyError(f"Cluster ID {cluster_id} not found in active segmentation (K={self._active_segmentation.k}).")

        return SegmentDetailResponse(
            cluster_id=cluster_id,
            profile=self._active_segmentation.cluster_profiles[cluster_id],
            archetype=self._active_segmentation.archetypes[cluster_id],
        )

    def get_hierarchical_clustering(self, sample_size: int = 150) -> HierarchicalLinkageResult:
        """Compute dendrogram linkage matrix for hierarchical structure visualization."""
        if self._matrix is None:
            self._preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
            self._matrix = self._preprocessor.fit_transform(self._profiles)

        h_clusterer = HierarchicalClusterer(ClusteringConfig(k=3))
        return h_clusterer.compute_dendrogram_linkage(self._matrix, sample_size=sample_size)

    def get_pca_projection(self) -> PCAProjectionResult:
        """Return 2D and 3D PCA coordinates and explained variance."""
        if self._cached_pca is not None:
            return self._cached_pca

        if not self._active_segmentation or self._matrix is None:
            self.run_segmentation(SegmentationRequest(k=3))

        assert self._matrix is not None
        assert self._active_segmentation is not None
        self._cached_pca = self._pca_projector.project(
            self._matrix, self._active_segmentation.cluster_assignments
        )
        return self._cached_pca

    # -----------------------------------------------------------------------
    # TICK-10: Investor Behavior & Geographic Intelligence Analytics
    # -----------------------------------------------------------------------

    def _compute_percentiles(self, values: List[float]) -> PercentileDistribution:
        """Compute robust percentiles, median, mean, and IQR for continuous distributions."""
        if not values:
            return PercentileDistribution(
                p5=0.0, p10=0.0, p25=0.0, p50=0.0, p75=0.0, p90=0.0, p95=0.0, p99=0.0, mean=0.0, iqr=0.0
            )
        arr = np.array(values, dtype=float)
        p5, p10, p25, p50, p75, p90, p95, p99 = [
            round(float(v), 2) for v in np.percentile(arr, [5, 10, 25, 50, 75, 90, 95, 99])
        ]
        mean_val = round(float(np.mean(arr)), 2)
        iqr_val = round(float(p75 - p25), 2)
        return PercentileDistribution(
            p5=p5,
            p10=p10,
            p25=p25,
            p50=p50,
            p75=p75,
            p90=p90,
            p95=p95,
            p99=p99,
            mean=mean_val,
            iqr=iqr_val,
        )

    def get_investor_behavior(
        self,
        country: Optional[str] = None,
        region: Optional[str] = None,
        client_type: Optional[str] = None,
        acquisition_purpose: Optional[str] = None,
        loan_status: Optional[str] = None,
        cluster_id: Optional[int] = None,
    ) -> InvestorBehaviorResponse:
        """
        Compute descriptive investor behavior analytics across financing, portfolio scale,
        sentiment, and behavioral cohorts with optional analytical display filtering.
        """
        if not self._active_segmentation:
            self.run_segmentation(SegmentationRequest(k=3))

        assert self._active_segmentation is not None
        assignments = self._active_segmentation.cluster_assignments
        archetypes = self._active_segmentation.archetypes

        # Apply display filters
        filtered: List[CustomerPortfolioProfile] = []
        for p in self._profiles:
            if country and p.country.lower() != country.lower():
                continue
            if region and p.region.lower() != region.lower():
                continue
            if client_type and p.client_type.lower() != client_type.lower():
                continue
            if acquisition_purpose and p.acquisition_purpose.lower() != acquisition_purpose.lower():
                continue
            if loan_status:
                if loan_status.lower() in ("yes", "1", "true") and p.loan_applied_binary != 1:
                    continue
                if loan_status.lower() in ("no", "0", "false") and p.loan_applied_binary != 0:
                    continue
            if cluster_id is not None and assignments.get(p.client_id) != cluster_id:
                continue
            filtered.append(p)

        n_total = len(filtered)
        if n_total == 0:
            empty_summary = InvestorSummaryKPIs(
                total_buyers=0,
                investment_buyers_count=0,
                home_buyers_count=0,
                investment_rate_pct=0.0,
                loan_buyers_count=0,
                cash_buyers_count=0,
                loan_rate_pct=0.0,
                individual_count=0,
                company_count=0,
                company_rate_pct=0.0,
                avg_portfolio_size=0.0,
                median_portfolio_size=0.0,
                avg_spend=0.0,
                median_spend=0.0,
                spend_iqr=0.0,
                avg_unit_price=0.0,
                median_unit_price=0.0,
                avg_satisfaction=0.0,
                median_satisfaction=0.0,
            )
            empty_purpose = FinancingByPurposeBreakdown(
                loan_home_count=0, loan_home_pct=0.0,
                loan_investment_count=0, loan_investment_pct=0.0,
                cash_home_count=0, cash_home_pct=0.0,
                cash_investment_count=0, cash_investment_pct=0.0,
            )
            empty_pct = self._compute_percentiles([])
            return InvestorBehaviorResponse(
                summary=empty_summary,
                financing_by_purpose=empty_purpose,
                financing_by_cluster=[],
                portfolio_size_distribution={},
                spend_percentiles=empty_pct,
                price_percentiles=empty_pct,
                comparison_by_cluster=[],
                comparison_by_purpose=[],
                comparison_by_client_type=[],
            )

        # 1. Summary KPIs
        n_invest = sum(1 for p in filtered if p.acquisition_purpose == "Investment")
        n_home = sum(1 for p in filtered if p.acquisition_purpose == "Home")
        n_loan = sum(1 for p in filtered if p.loan_applied_binary == 1)
        n_cash = sum(1 for p in filtered if p.loan_applied_binary == 0)
        n_indiv = sum(1 for p in filtered if p.client_type == "Individual")
        n_comp = sum(1 for p in filtered if p.client_type == "Company")

        spends = [p.total_spend for p in filtered]
        prices = [p.avg_price_per_unit for p in filtered]
        props = [p.total_properties for p in filtered]
        sats = [p.satisfaction_score for p in filtered]

        summary = InvestorSummaryKPIs(
            total_buyers=n_total,
            investment_buyers_count=n_invest,
            home_buyers_count=n_home,
            investment_rate_pct=round(n_invest / n_total * 100.0, 2),
            loan_buyers_count=n_loan,
            cash_buyers_count=n_cash,
            loan_rate_pct=round(n_loan / n_total * 100.0, 2),
            individual_count=n_indiv,
            company_count=n_comp,
            company_rate_pct=round(n_comp / n_total * 100.0, 2),
            avg_portfolio_size=round(float(np.mean(props)), 2),
            median_portfolio_size=round(float(np.median(props)), 2),
            avg_spend=round(float(np.mean(spends)), 2),
            median_spend=round(float(np.median(spends)), 2),
            spend_iqr=round(float(np.percentile(spends, 75) - np.percentile(spends, 25)), 2),
            avg_unit_price=round(float(np.mean(prices)), 2),
            median_unit_price=round(float(np.median(prices)), 2),
            avg_satisfaction=round(float(np.mean(sats)), 2),
            median_satisfaction=round(float(np.median(sats)), 2),
        )

        # 2. Financing by Purpose Breakdown
        l_home = sum(1 for p in filtered if p.loan_applied_binary == 1 and p.acquisition_purpose == "Home")
        l_inv = sum(1 for p in filtered if p.loan_applied_binary == 1 and p.acquisition_purpose == "Investment")
        c_home = sum(1 for p in filtered if p.loan_applied_binary == 0 and p.acquisition_purpose == "Home")
        c_inv = sum(1 for p in filtered if p.loan_applied_binary == 0 and p.acquisition_purpose == "Investment")

        financing_by_purpose = FinancingByPurposeBreakdown(
            loan_home_count=l_home,
            loan_home_pct=round(l_home / n_total * 100.0, 2),
            loan_investment_count=l_inv,
            loan_investment_pct=round(l_inv / n_total * 100.0, 2),
            cash_home_count=c_home,
            cash_home_pct=round(c_home / n_total * 100.0, 2),
            cash_investment_count=c_inv,
            cash_investment_pct=round(c_inv / n_total * 100.0, 2),
        )

        # 3. Financing by Cluster
        financing_by_cluster: List[ClusterFinancingItem] = []
        for c_id, arch in sorted(archetypes.items()):
            c_buyers = [p for p in filtered if assignments.get(p.client_id) == c_id]
            c_tot = len(c_buyers)
            if c_tot == 0:
                financing_by_cluster.append(
                    ClusterFinancingItem(
                        cluster_id=c_id,
                        archetype_name=arch.display_name or arch.generated_name,
                        total_buyers=0,
                        loan_count=0,
                        cash_count=0,
                        loan_rate_pct=0.0,
                        cash_rate_pct=0.0,
                    )
                )
            else:
                c_loan = sum(1 for p in c_buyers if p.loan_applied_binary == 1)
                c_cash = sum(1 for p in c_buyers if p.loan_applied_binary == 0)
                financing_by_cluster.append(
                    ClusterFinancingItem(
                        cluster_id=c_id,
                        archetype_name=arch.display_name or arch.generated_name,
                        total_buyers=c_tot,
                        loan_count=c_loan,
                        cash_count=c_cash,
                        loan_rate_pct=round(c_loan / c_tot * 100.0, 2),
                        cash_rate_pct=round(c_cash / c_tot * 100.0, 2),
                    )
                )

        # 4. Portfolio Size Distribution
        ps_dist: Dict[int, int] = {}
        for p in filtered:
            ps_dist[p.total_properties] = ps_dist.get(p.total_properties, 0) + 1
        portfolio_size_distribution = dict(sorted(ps_dist.items()))

        # 5. Continuous Distributions
        spend_percentiles = self._compute_percentiles(spends)
        price_percentiles = self._compute_percentiles(prices)

        # 6. Comparative Groups Helper
        def _build_comp_group(label: str, key: str, cohort: List[CustomerPortfolioProfile]) -> BehavioralComparisonGroup:
            cnt = len(cohort)
            if cnt == 0:
                return BehavioralComparisonGroup(
                    group_key=key, group_label=label, buyer_count=0, share_pct=0.0,
                    avg_portfolio_size=0.0, median_portfolio_size=0.0, avg_spend=0.0,
                    median_spend=0.0, avg_unit_price=0.0, median_unit_price=0.0,
                    avg_satisfaction=0.0, loan_rate_pct=0.0, investment_rate_pct=0.0,
                )
            c_spends = [p.total_spend for p in cohort]
            c_prices = [p.avg_price_per_unit for p in cohort]
            c_props = [p.total_properties for p in cohort]
            c_sats = [p.satisfaction_score for p in cohort]
            c_loans = sum(1 for p in cohort if p.loan_applied_binary == 1)
            c_invs = sum(1 for p in cohort if p.acquisition_purpose == "Investment")

            return BehavioralComparisonGroup(
                group_key=key,
                group_label=label,
                buyer_count=cnt,
                share_pct=round(cnt / n_total * 100.0, 2),
                avg_portfolio_size=round(float(np.mean(c_props)), 2),
                median_portfolio_size=round(float(np.median(c_props)), 2),
                avg_spend=round(float(np.mean(c_spends)), 2),
                median_spend=round(float(np.median(c_spends)), 2),
                avg_unit_price=round(float(np.mean(c_prices)), 2),
                median_unit_price=round(float(np.median(c_prices)), 2),
                avg_satisfaction=round(float(np.mean(c_sats)), 2),
                loan_rate_pct=round(c_loans / cnt * 100.0, 2),
                investment_rate_pct=round(c_invs / cnt * 100.0, 2),
            )

        # Comparison by Cluster
        comp_by_cluster = [
            _build_comp_group(
                label=arch.display_name or arch.generated_name,
                key=f"cluster_{cid}",
                cohort=[p for p in filtered if assignments.get(p.client_id) == cid],
            )
            for cid, arch in sorted(archetypes.items())
        ]

        # Comparison by Purpose
        comp_by_purpose = [
            _build_comp_group("Home Buyers", "home", [p for p in filtered if p.acquisition_purpose == "Home"]),
            _build_comp_group("Investment Buyers", "investment", [p for p in filtered if p.acquisition_purpose == "Investment"]),
        ]

        # Comparison by Client Type
        comp_by_client_type = [
            _build_comp_group("Individual Buyers", "individual", [p for p in filtered if p.client_type == "Individual"]),
            _build_comp_group("Corporate / Entity Buyers", "company", [p for p in filtered if p.client_type == "Company"]),
        ]

        return InvestorBehaviorResponse(
            summary=summary,
            financing_by_purpose=financing_by_purpose,
            financing_by_cluster=financing_by_cluster,
            portfolio_size_distribution=portfolio_size_distribution,
            spend_percentiles=spend_percentiles,
            price_percentiles=price_percentiles,
            comparison_by_cluster=comp_by_cluster,
            comparison_by_purpose=comp_by_purpose,
            comparison_by_client_type=comp_by_client_type,
        )

    def get_multi_property_analytics(
        self,
        threshold: int = 5,
        country: Optional[str] = None,
        cluster_id: Optional[int] = None,
    ) -> MultiPropertyAnalyticsResponse:
        """
        Analyze high-portfolio-scale multi-unit accumulator buyers meeting total_properties >= threshold.
        """
        if not self._active_segmentation:
            self.run_segmentation(SegmentationRequest(k=3))

        assert self._active_segmentation is not None
        assignments = self._active_segmentation.cluster_assignments

        # Filter qualifying cohort
        qualifying: List[CustomerPortfolioProfile] = []
        for p in self._profiles:
            if p.total_properties < threshold:
                continue
            if country and p.country.lower() != country.lower():
                continue
            if cluster_id is not None and assignments.get(p.client_id) != cluster_id:
                continue
            qualifying.append(p)

        n_qual = len(qualifying)
        n_pop = len(self._profiles)
        pct_qual = round(n_qual / n_pop * 100.0, 2) if n_pop > 0 else 0.0

        if n_qual == 0:
            return MultiPropertyAnalyticsResponse(
                threshold=threshold,
                qualifying_buyers_count=0,
                qualifying_percentage=0.0,
                total_spend=0.0,
                avg_spend=0.0,
                median_spend=0.0,
                avg_properties=0.0,
                median_properties=0.0,
                investment_purpose_count=0,
                investment_rate_pct=0.0,
                home_purpose_count=0,
                loan_count=0,
                loan_rate_pct=0.0,
                cash_count=0,
                corporate_count=0,
                corporate_rate_pct=0.0,
                individual_count=0,
                distribution_by_properties={},
                top_countries={},
                qualifying_buyers=[],
            )

        spends = [p.total_spend for p in qualifying]
        props = [p.total_properties for p in qualifying]
        tot_spend = float(sum(spends))
        avg_spend = float(np.mean(spends))
        med_spend = float(np.median(spends))
        avg_props = float(np.mean(props))
        med_props = float(np.median(props))

        n_inv = sum(1 for p in qualifying if p.acquisition_purpose == "Investment")
        n_home = sum(1 for p in qualifying if p.acquisition_purpose == "Home")
        n_loan = sum(1 for p in qualifying if p.loan_applied_binary == 1)
        n_cash = sum(1 for p in qualifying if p.loan_applied_binary == 0)
        n_corp = sum(1 for p in qualifying if p.client_type == "Company")
        n_indiv = sum(1 for p in qualifying if p.client_type == "Individual")

        p_dist: Dict[int, int] = {}
        for p in qualifying:
            p_dist[p.total_properties] = p_dist.get(p.total_properties, 0) + 1

        c_dist: Dict[str, int] = {}
        for p in qualifying:
            c_dist[p.country] = c_dist.get(p.country, 0) + 1
        top_countries = dict(sorted(c_dist.items(), key=lambda item: item[1], reverse=True))

        # Sort qualifying buyers by total_spend descending
        sorted_buyers = sorted(qualifying, key=lambda p: p.total_spend, reverse=True)

        return MultiPropertyAnalyticsResponse(
            threshold=threshold,
            qualifying_buyers_count=n_qual,
            qualifying_percentage=pct_qual,
            total_spend=round(tot_spend, 2),
            avg_spend=round(avg_spend, 2),
            median_spend=round(med_spend, 2),
            avg_properties=round(avg_props, 2),
            median_properties=round(med_props, 2),
            investment_purpose_count=n_inv,
            investment_rate_pct=round(n_inv / n_qual * 100.0, 2),
            home_purpose_count=n_home,
            loan_count=n_loan,
            loan_rate_pct=round(n_loan / n_qual * 100.0, 2),
            cash_count=n_cash,
            corporate_count=n_corp,
            corporate_rate_pct=round(n_corp / n_qual * 100.0, 2),
            individual_count=n_indiv,
            distribution_by_properties=dict(sorted(p_dist.items())),
            top_countries=top_countries,
            qualifying_buyers=sorted_buyers,
        )

    def get_geographic_intelligence(
        self,
        selected_country: Optional[str] = None,
        acquisition_purpose: Optional[str] = None,
        loan_status: Optional[str] = None,
        cluster_id: Optional[int] = None,
    ) -> GeographicIntelligenceResponse:
        """
        Produce geographic intelligence across countries, sub-national regions, and
        the Geographic x Behavioral cross-tabulation matrix.
        """
        if not self._active_segmentation:
            self.run_segmentation(SegmentationRequest(k=3))

        assert self._active_segmentation is not None
        assignments = self._active_segmentation.cluster_assignments

        # Filter buyers
        filtered: List[CustomerPortfolioProfile] = []
        for p in self._profiles:
            if selected_country and p.country.lower() != selected_country.lower():
                continue
            if acquisition_purpose and p.acquisition_purpose.lower() != acquisition_purpose.lower():
                continue
            if loan_status:
                if loan_status.lower() in ("yes", "1", "true") and p.loan_applied_binary != 1:
                    continue
                if loan_status.lower() in ("no", "0", "false") and p.loan_applied_binary != 0:
                    continue
            if cluster_id is not None and assignments.get(p.client_id) != cluster_id:
                continue
            filtered.append(p)

        n_total = len(filtered)
        if n_total == 0:
            return GeographicIntelligenceResponse(
                total_buyers=0,
                total_countries=0,
                total_regions=0,
                avg_spend_global=0.0,
                top_country_name="None",
                top_country_share_pct=0.0,
                countries=[],
                regions=[],
                cross_matrix=[],
            )

        avg_spend_global = round(float(np.mean([p.total_spend for p in filtered])), 2)

        # 1. Group by Country
        country_groups: Dict[str, List[CustomerPortfolioProfile]] = {}
        for p in filtered:
            country_groups.setdefault(p.country, []).append(p)

        # Sort countries by count descending
        sorted_countries = sorted(country_groups.items(), key=lambda item: len(item[1]), reverse=True)
        top_country_name = sorted_countries[0][0] if sorted_countries else "None"
        top_country_share = round(len(sorted_countries[0][1]) / n_total * 100.0, 2) if sorted_countries else 0.0

        countries_list: List[CountryDistributionItem] = []
        cross_matrix_list: List[GeoBehaviorMatrixRow] = []

        for c_name, c_buyers in sorted_countries:
            c_cnt = len(c_buyers)
            c_pct = round(c_cnt / n_total * 100.0, 2)
            c_inv = sum(1 for p in c_buyers if p.acquisition_purpose == "Investment")
            c_loan = sum(1 for p in c_buyers if p.loan_applied_binary == 1)
            c_corp = sum(1 for p in c_buyers if p.client_type == "Company")

            c_spends = [p.total_spend for p in c_buyers]
            c_prices = [p.avg_price_per_unit for p in c_buyers]
            c_props = [p.total_properties for p in c_buyers]
            c_sats = [p.satisfaction_score for p in c_buyers]

            # Top regions in this country
            c_reg_counts: Dict[str, int] = {}
            for p in c_buyers:
                c_reg_counts[p.region] = c_reg_counts.get(p.region, 0) + 1
            top_regs = [
                {"region": r, "buyer_count": cnt, "share_pct": round(cnt / c_cnt * 100.0, 1)}
                for r, cnt in sorted(c_reg_counts.items(), key=lambda item: item[1], reverse=True)
            ]

            countries_list.append(
                CountryDistributionItem(
                    country=c_name,
                    buyer_count=c_cnt,
                    percentage=c_pct,
                    investment_count=c_inv,
                    investment_rate_pct=round(c_inv / c_cnt * 100.0, 2),
                    loan_count=c_loan,
                    loan_rate_pct=round(c_loan / c_cnt * 100.0, 2),
                    corporate_count=c_corp,
                    corporate_rate_pct=round(c_corp / c_cnt * 100.0, 2),
                    avg_spend=round(float(np.mean(c_spends)), 2),
                    median_spend=round(float(np.median(c_spends)), 2),
                    avg_properties=round(float(np.mean(c_props)), 2),
                    avg_unit_price=round(float(np.mean(c_prices)), 2),
                    avg_satisfaction=round(float(np.mean(c_sats)), 2),
                    region_count=len(c_reg_counts),
                    top_regions=top_regs,
                )
            )

            cross_matrix_list.append(
                GeoBehaviorMatrixRow(
                    country=c_name,
                    buyer_count=c_cnt,
                    share_pct=c_pct,
                    investment_rate_pct=round(c_inv / c_cnt * 100.0, 2),
                    loan_rate_pct=round(c_loan / c_cnt * 100.0, 2),
                    corporate_rate_pct=round(c_corp / c_cnt * 100.0, 2),
                    avg_portfolio_size=round(float(np.mean(c_props)), 2),
                    avg_spend=round(float(np.mean(c_spends)), 2),
                    median_spend=round(float(np.median(c_spends)), 2),
                    avg_unit_price=round(float(np.mean(c_prices)), 2),
                    avg_satisfaction=round(float(np.mean(c_sats)), 2),
                )
            )

        # 2. Group by Region
        region_groups: Dict[tuple[str, str], List[CustomerPortfolioProfile]] = {}
        for p in filtered:
            region_groups.setdefault((p.country, p.region), []).append(p)

        sorted_regions = sorted(region_groups.items(), key=lambda item: len(item[1]), reverse=True)
        regions_list: List[RegionDistributionItem] = []

        for (c_name, r_name), r_buyers in sorted_regions:
            r_cnt = len(r_buyers)
            c_total_buyers = len(country_groups.get(c_name, []))
            r_pct_country = round(r_cnt / c_total_buyers * 100.0, 2) if c_total_buyers > 0 else 0.0
            r_pct_total = round(r_cnt / n_total * 100.0, 2)

            r_inv = sum(1 for p in r_buyers if p.acquisition_purpose == "Investment")
            r_loan = sum(1 for p in r_buyers if p.loan_applied_binary == 1)
            r_corp = sum(1 for p in r_buyers if p.client_type == "Company")

            r_spends = [p.total_spend for p in r_buyers]
            r_props = [p.total_properties for p in r_buyers]
            r_sats = [p.satisfaction_score for p in r_buyers]

            regions_list.append(
                RegionDistributionItem(
                    country=c_name,
                    region=r_name,
                    buyer_count=r_cnt,
                    percentage_of_country=r_pct_country,
                    percentage_of_total=r_pct_total,
                    investment_rate_pct=round(r_inv / r_cnt * 100.0, 2),
                    loan_rate_pct=round(r_loan / r_cnt * 100.0, 2),
                    corporate_rate_pct=round(r_corp / r_cnt * 100.0, 2),
                    avg_spend=round(float(np.mean(r_spends)), 2),
                    median_spend=round(float(np.median(r_spends)), 2),
                    avg_properties=round(float(np.mean(r_props)), 2),
                    avg_satisfaction=round(float(np.mean(r_sats)), 2),
                )
            )

        return GeographicIntelligenceResponse(
            total_buyers=n_total,
            total_countries=len(countries_list),
            total_regions=len(regions_list),
            avg_spend_global=avg_spend_global,
            top_country_name=top_country_name,
            top_country_share_pct=top_country_share,
            countries=countries_list,
            regions=regions_list,
            cross_matrix=cross_matrix_list,
        )

    def get_cluster_stability(
        self, k: int = 3, seeds: Optional[List[int]] = None
    ) -> ClusterStabilityResponse:
        """
        Evaluate multi-seed clustering agreement metrics and stability convergence.

        Args:
            k: Target cluster count to test across seeds.
            seeds: List of random initialization seeds (defaults to [42, 100, 2024, 777, 999]).

        Returns:
            ClusterStabilityResponse with pairwise ARI, NMI, and convergence rating.
        """
        if self._matrix is None:
            self._preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
            self._matrix = self._preprocessor.fit_transform(self._profiles)

        eval_seeds = seeds or [42, 100, 2024, 777, 999]
        if len(eval_seeds) < 2:
            eval_seeds = [42, 100]

        # Fit model for each seed
        seed_labels: Dict[int, List[int]] = {}
        for seed in eval_seeds:
            cfg = ClusteringConfig(k=k, random_state=seed, n_init=10)
            clusterer = KMeansClusterer(cfg)
            res = clusterer.fit(self._matrix)
            seed_labels[seed] = [res.cluster_assignments[cid] for cid in self._matrix.client_ids]

        # Compute pairwise agreements
        pairwise: List[SeedAgreementPair] = []
        ari_scores: List[float] = []
        nmi_scores: List[float] = []

        for i in range(len(eval_seeds)):
            for j in range(i + 1, len(eval_seeds)):
                s_a = eval_seeds[i]
                s_b = eval_seeds[j]
                labels_a = seed_labels[s_a]
                labels_b = seed_labels[s_b]

                ari = float(adjusted_rand_score(labels_a, labels_b))
                nmi = float(normalized_mutual_info_score(labels_a, labels_b))

                ari_scores.append(ari)
                nmi_scores.append(nmi)
                pairwise.append(
                    SeedAgreementPair(
                        seed_a=s_a,
                        seed_b=s_b,
                        adjusted_rand_index=round(ari, 4),
                        normalized_mutual_info=round(nmi, 4),
                    )
                )

        mean_ari = float(np.mean(ari_scores)) if ari_scores else 1.0
        min_ari = float(np.min(ari_scores)) if ari_scores else 1.0
        max_ari = float(np.max(ari_scores)) if ari_scores else 1.0
        mean_nmi = float(np.mean(nmi_scores)) if nmi_scores else 1.0

        if mean_ari >= 0.85:
            rating = "High Multi-Seed Convergence (ARI ≥ 0.85)"
        elif mean_ari >= 0.70:
            rating = "Moderate Multi-Seed Stability (0.70 ≤ ARI < 0.85)"
        else:
            rating = "Sensitive / Lower Multi-Seed Agreement (ARI < 0.70)"

        caveat = (
            "Cluster stability measures algorithm reproducibility across centroid seed initializations, "
            "not cluster validity or the presence of natural separation in feature space."
        )

        return ClusterStabilityResponse(
            k=k,
            seeds_evaluated=eval_seeds,
            mean_adjusted_rand_index=round(mean_ari, 4),
            min_adjusted_rand_index=round(min_ari, 4),
            max_adjusted_rand_index=round(max_ari, 4),
            mean_normalized_mutual_info=round(mean_nmi, 4),
            pairwise_agreements=pairwise,
            stability_rating=rating,
            interpretation_caveat=caveat,
        )

    def get_feature_metadata(self) -> FeatureMetadataResponse:
        """Return authoritative metadata of all 24 ML features and preprocessing transformations."""
        if self._preprocessor is None or self._matrix is None:
            self._preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
            self._matrix = self._preprocessor.fit_transform(self._profiles)

        numerical = [
            "total_spend",
            "total_properties",
            "avg_price_per_unit",
            "avg_floor_area_sqft",
            "office_ratio",
            "age",
            "satisfaction_score",
            "loan_applied_binary",
        ]
        categorical = [
            "client_type",
            "acquisition_purpose",
            "referral_channel",
            "country",
        ]
        excluded = [
            "gender",
            "region",
            "apartment_ratio",
            "first_name",
            "last_name",
            "date_of_birth",
        ]

        return FeatureMetadataResponse(
            total_feature_dimensions=self._matrix.feature_count,
            numerical_features=numerical,
            categorical_features=categorical,
            excluded_features=excluded,
            scaler_applied="StandardScaler",
            top_n_countries_encoded=10,
            feature_dimension_names=self._matrix.feature_names,
        )

    def export_buyers_csv(
        self,
        k: int = 3,
        cluster_id: Optional[int] = None,
        search: Optional[str] = None,
        user_nicknames: Optional[Dict[int, str]] = None,
    ) -> str:
        """
        Generate buyer-level CSV export respecting active clustering and filters.

        Args:
            k: Target K cluster count.
            cluster_id: Optional specific cluster ID filter.
            search: Optional text filter for client ID, country, or region.
            user_nicknames: Optional custom presentation nicknames.

        Returns:
            CSV formatted string.
        """
        # Ensure segmentation for target K is run
        seg_res = self.run_segmentation(
            SegmentationRequest(k=k, random_state=42, user_nicknames=user_nicknames)
        )

        output = io.StringIO()
        fieldnames = [
            "client_id",
            "cluster_id",
            "archetype_name",
            "presentation_nickname",
            "acquisition_purpose",
            "client_type",
            "country",
            "region",
            "loan_status",
            "total_properties",
            "total_spend",
            "avg_price_per_unit",
            "satisfaction_score",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        search_term = search.lower().strip() if search else ""

        for profile in self._profiles:
            c_id = seg_res.cluster_assignments.get(profile.client_id, 0)

            # Apply cluster filter
            if cluster_id is not None and c_id != cluster_id:
                continue

            # Apply text search filter
            if search_term:
                if (
                    search_term not in profile.client_id.lower()
                    and search_term not in profile.country.lower()
                    and search_term not in profile.region.lower()
                    and search_term not in profile.acquisition_purpose.lower()
                ):
                    continue

            arch = seg_res.archetypes.get(c_id)
            arch_name = arch.generated_name if arch else f"Cluster {c_id}"
            user_nick = arch.user_nickname if (arch and arch.user_nickname) else ""

            writer.writerow(
                {
                    "client_id": profile.client_id,
                    "cluster_id": c_id,
                    "archetype_name": arch_name,
                    "presentation_nickname": user_nick,
                    "acquisition_purpose": profile.acquisition_purpose,
                    "client_type": profile.client_type,
                    "country": profile.country,
                    "region": profile.region,
                    "loan_status": "Mortgage" if profile.loan_applied_binary == 1 else "Cash",
                    "total_properties": profile.total_properties,
                    "total_spend": round(profile.total_spend, 2),
                    "avg_price_per_unit": round(profile.avg_price_per_unit, 2),
                    "satisfaction_score": round(profile.satisfaction_score, 1),
                }
            )

        return output.getvalue()

    def export_segment_summary_csv(
        self,
        k: int = 3,
        user_nicknames: Optional[Dict[int, str]] = None,
    ) -> str:
        """
        Generate segment summary CSV export with aggregated cohort statistics.

        Args:
            k: Target K cluster count.
            user_nicknames: Optional custom presentation nicknames.

        Returns:
            CSV formatted string.
        """
        seg_res = self.run_segmentation(
            SegmentationRequest(k=k, random_state=42, user_nicknames=user_nicknames)
        )

        output = io.StringIO()
        fieldnames = [
            "cluster_id",
            "archetype_name",
            "presentation_nickname",
            "buyer_count",
            "population_percentage",
            "avg_spend",
            "median_spend",
            "avg_unit_price",
            "avg_properties",
            "loan_reliance_pct",
            "confidence_rating",
            "top_differentiating_features",
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for c_id in sorted(seg_res.cluster_profiles.keys()):
            prof = seg_res.cluster_profiles[c_id]
            arch = seg_res.archetypes.get(c_id)

            arch_name = arch.generated_name if arch else f"Cluster {c_id}"
            user_nick = arch.user_nickname if (arch and arch.user_nickname) else ""
            conf = arch.confidence if arch else "Analytical Cohort"
            diff_feats = "; ".join(prof.differentiating_features)

            np_data = prof.numerical_profiles
            spend_mean = np_data["total_spend"].mean if "total_spend" in np_data else 0.0
            spend_med = np_data["total_spend"].median if "total_spend" in np_data else 0.0
            price_mean = np_data["avg_price_per_unit"].mean if "avg_price_per_unit" in np_data else 0.0
            props_mean = np_data["total_properties"].mean if "total_properties" in np_data else 0.0
            loan_mean = np_data["loan_applied_binary"].mean if "loan_applied_binary" in np_data else 0.0

            writer.writerow(
                {
                    "cluster_id": c_id,
                    "archetype_name": arch_name,
                    "presentation_nickname": user_nick,
                    "buyer_count": prof.count,
                    "population_percentage": round(prof.percentage, 2),
                    "avg_spend": round(spend_mean, 2),
                    "median_spend": round(spend_med, 2),
                    "avg_unit_price": round(price_mean, 2),
                    "avg_properties": round(props_mean, 2),
                    "loan_reliance_pct": round(loan_mean * 100.0, 2),
                    "confidence_rating": conf,
                    "top_differentiating_features": diff_feats,
                }
            )

        return output.getvalue()


