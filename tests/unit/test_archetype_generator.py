from datetime import date
from typing import Dict, List
import pytest

from parcllabs.ml.contracts import (
    ArchetypeInterpretation,
    ClusterProfile,
    DatasetProfilingResult,
)
from parcllabs.ml.profiler import ClusterProfiler
from parcllabs.ml.archetypes import ArchetypeGenerator
from parcllabs.models.analytical import CustomerPortfolioProfile

@pytest.fixture
def test_profiles_and_assignments() -> tuple[List[CustomerPortfolioProfile], Dict[str, int]]:
    profiles: List[CustomerPortfolioProfile] = []
    assignments: Dict[str, int] = {}

    # Cluster 0: 30 Cash Value Buyers (0% loan, below-average spend)
    for i in range(30):
        cid = f"C{i+1:04d}"
        assignments[cid] = 0
        profiles.append(
            CustomerPortfolioProfile(
                client_id=cid,
                client_type="Individual",
                first_name="Alice",
                last_name=f"Cash{i}",
                gender="F",
                country="USA",
                region="California",
                date_of_birth_parsed=date(1990, 1, 1),
                age=34,
                acquisition_purpose="Home",
                satisfaction_score=3,
                loan_applied="No",
                loan_applied_binary=0,
                referral_channel="Website",
                total_properties=3,
                total_spend=900000.0,
                avg_price_per_unit=300000.0,
                avg_floor_area_sqft=950.0,
                office_units_count=0,
                office_ratio=0.0,
                apartment_units_count=3,
                apartment_ratio=1.0,
            )
        )

    # Cluster 1: 30 Premium Asset Buyers (high unit price, large floor area, high spend)
    for i in range(30, 60):
        cid = f"C{i+1:04d}"
        assignments[cid] = 1
        profiles.append(
            CustomerPortfolioProfile(
                client_id=cid,
                client_type="Individual",
                first_name="Bob",
                last_name=f"Prem{i}",
                gender="M",
                country="USA",
                region="New York",
                date_of_birth_parsed=date(1975, 1, 1),
                age=49,
                acquisition_purpose="Home",
                satisfaction_score=4,
                loan_applied="No",
                loan_applied_binary=0,
                referral_channel="Website",
                total_properties=3,
                total_spend=1800000.0,
                avg_price_per_unit=600000.0,
                avg_floor_area_sqft=1600.0,
                office_units_count=0,
                office_ratio=0.0,
                apartment_units_count=3,
                apartment_ratio=1.0,
            )
        )

    # Cluster 2: 30 Leveraged Buyers (100% loan)
    for i in range(60, 90):
        cid = f"C{i+1:04d}"
        assignments[cid] = 2
        profiles.append(
            CustomerPortfolioProfile(
                client_id=cid,
                client_type="Individual",
                first_name="Charlie",
                last_name=f"Loan{i}",
                gender="M",
                country="USA",
                region="Texas",
                date_of_birth_parsed=date(1985, 1, 1),
                age=39,
                acquisition_purpose="Home",
                satisfaction_score=3,
                loan_applied="Yes",
                loan_applied_binary=1,
                referral_channel="Agency",
                total_properties=3,
                total_spend=1050000.0,
                avg_price_per_unit=350000.0,
                avg_floor_area_sqft=1100.0,
                office_units_count=0,
                office_ratio=0.0,
                apartment_units_count=3,
                apartment_ratio=1.0,
            )
        )

    # Cluster 3: 2 Micro-segment high-volume accumulators (8 properties, $2.6M spend)
    for i in range(90, 92):
        cid = f"C{i+1:04d}"
        assignments[cid] = 3
        profiles.append(
            CustomerPortfolioProfile(
                client_id=cid,
                client_type="Individual",
                first_name="David",
                last_name=f"Scale{i}",
                gender="M",
                country="USA",
                region="Nevada",
                date_of_birth_parsed=date(1960, 1, 1),
                age=64,
                acquisition_purpose="Investment",
                satisfaction_score=4,
                loan_applied="No",
                loan_applied_binary=0,
                referral_channel="Website",
                total_properties=8,
                total_spend=2600000.0,
                avg_price_per_unit=325000.0,
                avg_floor_area_sqft=1050.0,
                office_units_count=1,
                office_ratio=0.125,
                apartment_units_count=7,
                apartment_ratio=0.875,
            )
        )

    return profiles, assignments

def test_archetype_generator_deterministic_naming(
    test_profiles_and_assignments: tuple[List[CustomerPortfolioProfile], Dict[str, int]],
) -> None:
    profiles, assignments = test_profiles_and_assignments
    profiler = ClusterProfiler()
    prof_res = profiler.profile(profiles, assignments)

    generator = ArchetypeGenerator()
    res = generator.generate_archetypes(prof_res)

    assert res.k == 4
    assert len(res.archetypes) == 4

    # Verify Cluster 0 is interpreted around Cash / Unleveraged
    a0 = res.archetypes[0]
    assert "Cash" in a0.generated_name or "Unleveraged" in a0.generated_name
    assert a0.confidence in ["Strong Evidence", "Moderate Evidence"]
    assert len(a0.supporting_evidence) > 0

    # Verify Cluster 1 is interpreted around Premium Asset
    a1 = res.archetypes[1]
    assert "Premium" in a1.generated_name or "High-Value" in a1.generated_name

    # Verify Cluster 2 is interpreted around Leveraged
    a2 = res.archetypes[2]
    assert "Leveraged" in a2.generated_name or "Loan" in a2.generated_name

    # Verify Cluster 3 is marked as micro-segment and High-Portfolio Scale
    a3 = res.archetypes[3]
    assert a3.is_micro_segment is True
    assert "Scale" in a3.generated_name or "Accumulator" in a3.generated_name or "Multi-Unit" in a3.generated_name

def test_archetype_generator_unsupported_claims_safeguards(
    test_profiles_and_assignments: tuple[List[CustomerPortfolioProfile], Dict[str, int]],
) -> None:
    profiles, assignments = test_profiles_and_assignments
    profiler = ClusterProfiler()
    prof_res = profiler.profile(profiles, assignments)

    generator = ArchetypeGenerator()
    res = generator.generate_archetypes(prof_res)

    for arch in res.archetypes.values():
        # Corporate claim should be rejected because company_pct is not elevated
        assert "Corporate" not in arch.generated_name
        assert "Institutional" not in arch.generated_name
        # Rejection reasons must explicitly document why unsupported labels were rejected
        assert "corporate" in arch.rejection_reasons
        assert "office" in arch.rejection_reasons

def test_presentation_nickname_independence(
    test_profiles_and_assignments: tuple[List[CustomerPortfolioProfile], Dict[str, int]],
) -> None:
    profiles, assignments = test_profiles_and_assignments
    profiler = ClusterProfiler()
    prof_res = profiler.profile(profiles, assignments)

    generator = ArchetypeGenerator()
    res = generator.generate_archetypes(prof_res)

    arch0 = res.archetypes[0]
    assert arch0.display_name == arch0.generated_name

    # Assign user presentation nickname
    arch_custom = arch0.model_copy(update={"user_nickname": "VIP Cash Tier"})
    assert arch_custom.display_name == "VIP Cash Tier"
    assert arch_custom.generated_name == arch0.generated_name  # Generated name is preserved!
    assert arch_custom.cluster_id == 0                         # Cluster ID remains immutable!
