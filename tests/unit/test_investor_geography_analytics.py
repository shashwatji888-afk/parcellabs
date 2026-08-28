"""Unit tests for TICK-10: Investor Behavior and Geographic Intelligence analytics."""

from pathlib import Path
import pytest
from parcllabs.services.analytics_service import AnalyticsService
from parcllabs.api.schemas import (
    InvestorBehaviorResponse,
    MultiPropertyAnalyticsResponse,
    GeographicIntelligenceResponse,
)

@pytest.fixture
def service() -> AnalyticsService:
    svc = AnalyticsService(
        clients_path=Path("clients.csv"),
        properties_path=Path("properties.csv"),
    )
    svc.initialize()
    return svc

# ---------------------------------------------------------------------------
# PART A: Investor Behavior Analytics
# ---------------------------------------------------------------------------

def test_investor_behavior_full_population(service: AnalyticsService) -> None:
    res: InvestorBehaviorResponse = service.get_investor_behavior()
    
    # 1. Summary KPIs
    assert res.summary.total_buyers == 2000
    assert res.summary.investment_buyers_count == 615
    assert res.summary.home_buyers_count == 1385
    assert round(res.summary.investment_rate_pct, 1) == 30.8
    assert res.summary.loan_buyers_count == 736
    assert res.summary.cash_buyers_count == 1264
    assert round(res.summary.loan_rate_pct, 1) == 36.8
    assert res.summary.individual_count == 1897
    assert res.summary.company_count == 103
    assert res.summary.company_rate_pct == 5.15
    assert round(res.summary.avg_portfolio_size, 2) == 3.65
    assert res.summary.median_portfolio_size == 4.0
    assert round(res.summary.avg_spend, 2) == 1260375.48
    assert round(res.summary.median_spend, 2) == 1220893.17
    assert res.summary.spend_iqr > 400000.0
    assert round(res.summary.avg_satisfaction, 2) == 3.03
    assert res.summary.median_satisfaction == 3.0

    # 2. Financing by Purpose Breakdown
    fp = res.financing_by_purpose
    assert fp.cash_home_count == 883
    assert fp.cash_investment_count == 381
    assert fp.loan_home_count == 502
    assert fp.loan_investment_count == 234
    assert fp.cash_home_count + fp.cash_investment_count == 1264
    assert fp.loan_home_count + fp.loan_investment_count == 736

    # 3. Financing by Cluster
    fc = res.financing_by_cluster
    assert len(fc) == 3
    # In baseline K=3: Cluster 0 is 0% loan, Cluster 2 is 100% loan
    c0 = next(c for c in fc if c.cluster_id == 0)
    assert c0.loan_count == 0
    assert c0.loan_rate_pct == 0.0
    assert c0.cash_count == 842

    c2 = next(c for c in fc if c.cluster_id == 2)
    assert c2.cash_count == 0
    assert c2.loan_rate_pct == 100.0
    assert c2.loan_count == 638

    # 4. Percentiles
    sp = res.spend_percentiles
    assert sp.p5 < sp.p25 < sp.p50 < sp.p75 < sp.p95 < sp.p99
    assert sp.p50 == res.summary.median_spend
    assert round(sp.iqr, 2) == round(sp.p75 - sp.p25, 2)

    # 5. Portfolio size distribution
    ps = res.portfolio_size_distribution
    assert sum(ps.values()) == 2000
    assert ps[3] == 932
    assert ps[4] == 948

    # 6. Behavioral Comparison Groups
    assert len(res.comparison_by_cluster) == 3
    assert len(res.comparison_by_purpose) == 2
    assert len(res.comparison_by_client_type) == 2

def test_investor_behavior_filtering(service: AnalyticsService) -> None:
    # Filter by Country = USA
    res_usa = service.get_investor_behavior(country="USA")
    assert res_usa.summary.total_buyers == 1538
    assert res_usa.summary.investment_buyers_count + res_usa.summary.home_buyers_count == 1538

    # Filter by Purpose = Investment
    res_inv = service.get_investor_behavior(acquisition_purpose="Investment")
    assert res_inv.summary.total_buyers == 615
    assert res_inv.summary.investment_buyers_count == 615
    assert res_inv.summary.home_buyers_count == 0
    assert res_inv.summary.investment_rate_pct == 100.0

    # Filter by Loan = Yes
    res_loan = service.get_investor_behavior(loan_status="Yes")
    assert res_loan.summary.total_buyers == 736
    assert res_loan.summary.loan_rate_pct == 100.0

    # Filter by Cluster = 1
    res_c1 = service.get_investor_behavior(cluster_id=1)
    assert res_c1.summary.total_buyers == 520

    # Combined filter: USA + Investment + Loan
    res_comb = service.get_investor_behavior(country="USA", acquisition_purpose="Investment", loan_status="Yes")
    assert res_comb.summary.total_buyers > 0
    assert res_comb.summary.investment_rate_pct == 100.0
    assert res_comb.summary.loan_rate_pct == 100.0

def test_investor_behavior_empty_cohort(service: AnalyticsService) -> None:
    # Non-existent country
    res_empty = service.get_investor_behavior(country="NonExistentCountry")
    assert res_empty.summary.total_buyers == 0
    assert res_empty.summary.investment_rate_pct == 0.0
    assert res_empty.summary.avg_spend == 0.0
    assert res_empty.summary.median_spend == 0.0
    assert res_empty.financing_by_purpose.loan_home_count == 0

# ---------------------------------------------------------------------------
# PART B: Multi-Property Accumulator Analytics
# ---------------------------------------------------------------------------

def test_multi_property_analytics_thresholds(service: AnalyticsService) -> None:
    # Threshold N=3 (100% of buyers)
    res_3 = service.get_multi_property_analytics(threshold=3)
    assert res_3.threshold == 3
    assert res_3.qualifying_buyers_count == 2000
    assert res_3.qualifying_percentage == 100.0

    # Threshold N=4 (53.4% of buyers)
    res_4 = service.get_multi_property_analytics(threshold=4)
    assert res_4.threshold == 4
    assert res_4.qualifying_buyers_count == 1068
    assert round(res_4.qualifying_percentage, 1) == 53.4

    # Threshold N=5 (Default recommended: 6.0% of buyers)
    res_5 = service.get_multi_property_analytics(threshold=5)
    assert res_5.threshold == 5
    assert res_5.qualifying_buyers_count == 120
    assert round(res_5.qualifying_percentage, 1) == 6.0
    assert res_5.avg_spend > res_3.avg_spend
    assert res_5.avg_properties >= 5.0

    # Threshold N=6 (Super-scale micro segment: 2.55% of buyers)
    res_6 = service.get_multi_property_analytics(threshold=6)
    assert res_6.threshold == 6
    assert res_6.qualifying_buyers_count == 51
    assert round(res_6.qualifying_percentage, 2) == 2.55

    # Threshold N=15 (empty cohort)
    res_15 = service.get_multi_property_analytics(threshold=15)
    assert res_15.qualifying_buyers_count == 0
    assert res_15.qualifying_percentage == 0.0
    assert res_15.avg_spend == 0.0

# ---------------------------------------------------------------------------
# PART C: Geographic Intelligence Analytics
# ---------------------------------------------------------------------------

def test_geographic_intelligence_baseline(service: AnalyticsService) -> None:
    res: GeographicIntelligenceResponse = service.get_geographic_intelligence()

    assert res.total_buyers == 2000
    assert res.total_countries == 10
    assert res.total_regions == 57
    assert res.top_country_name == "USA"
    assert round(res.top_country_share_pct, 1) == 76.9

    # Reconcile country distribution
    countries = res.countries
    assert len(countries) == 10
    total_country_buyers = sum(c.buyer_count for c in countries)
    assert total_country_buyers == 2000
    total_pct = sum(c.percentage for c in countries)
    assert round(total_pct, 1) == 100.0

    # Verify top countries
    c_usa = next(c for c in countries if c.country == "USA")
    assert c_usa.buyer_count == 1538
    assert round(c_usa.percentage, 2) == 76.90
    assert c_usa.region_count > 10

    c_uk = next(c for c in countries if c.country == "UK")
    assert c_uk.buyer_count == 95

    # Reconcile region distribution
    regions = res.regions
    assert len(regions) == 57
    total_region_buyers = sum(r.buyer_count for r in regions)
    assert total_region_buyers == 2000

    # Cross Matrix
    matrix = res.cross_matrix
    assert len(matrix) == 10
    for row in matrix:
        assert row.buyer_count > 0
        assert 0.0 <= row.investment_rate_pct <= 100.0
        assert 0.0 <= row.loan_rate_pct <= 100.0
        assert row.avg_spend > 500000.0

def test_geographic_intelligence_filtering(service: AnalyticsService) -> None:
    # Filter by Country = Canada
    res_can = service.get_geographic_intelligence(selected_country="Canada")
    assert res_can.total_buyers == 85
    assert len(res_can.countries) == 1
    assert res_can.countries[0].country == "Canada"
    assert len(res_can.regions) == 5  # Alberta, BC, Manitoba, Ontario, Quebec
    assert sum(r.buyer_count for r in res_can.regions) == 85

    # Filter by Purpose = Investment
    res_inv = service.get_geographic_intelligence(acquisition_purpose="Investment")
    assert res_inv.total_buyers == 615
    assert sum(c.buyer_count for c in res_inv.countries) == 615
