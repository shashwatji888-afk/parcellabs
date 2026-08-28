from pathlib import Path
from datetime import date
import pytest

from parcllabs.core.config import DomainConfig
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.contracts import PreprocessingConfig, ClusteringConfig
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.profiler import ClusterProfiler
from parcllabs.ml.archetypes import ArchetypeGenerator

BASELINE_CLIENTS_PATH = Path("clients.csv")
BASELINE_PROPERTIES_PATH = Path("properties.csv")

def test_baseline_archetype_generation_k3_and_k4() -> None:
    config = DomainConfig(reference_date=date(2024, 1, 1))
    clients = load_clients_csv(BASELINE_CLIENTS_PATH, config=config)
    properties = load_properties_csv(BASELINE_PROPERTIES_PATH)
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    prep = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    matrix = prep.fit_transform(profiles)
    profiler = ClusterProfiler()
    generator = ArchetypeGenerator()

    # 1. Evaluate K=3 archetypes
    k3_clusterer = KMeansClusterer(ClusteringConfig(k=3, random_state=42, n_init=20))
    k3_res = k3_clusterer.fit(matrix)
    k3_prof = profiler.profile(profiles, k3_res.cluster_assignments)
    k3_arch = generator.generate_archetypes(k3_prof)

    assert k3_arch.k == 3
    assert len(k3_arch.archetypes) == 3
    # Verify each archetype has supporting evidence and rejection reasons
    for arch in k3_arch.archetypes.values():
        assert arch.generated_name
        assert arch.short_thesis
        assert len(arch.supporting_evidence) > 0
        assert "corporate" in arch.rejection_reasons
        assert "office" in arch.rejection_reasons

    # 2. Evaluate K=4 archetypes (verify 51-client micro-segment)
    k4_clusterer = KMeansClusterer(ClusteringConfig(k=4, random_state=42, n_init=20))
    k4_res = k4_clusterer.fit(matrix)
    k4_prof = profiler.profile(profiles, k4_res.cluster_assignments)
    k4_arch = generator.generate_archetypes(k4_prof)

    assert k4_arch.k == 4
    micro_arch = next(a for a in k4_arch.archetypes.values() if a.count == 51)
    assert micro_arch.is_micro_segment is True
    # Crucially assert that it is NOT labeled corporate or office
    assert "Corporate" not in micro_arch.generated_name
    assert "Office" not in micro_arch.generated_name
    assert "Scale" in micro_arch.generated_name or "Accumulator" in micro_arch.generated_name or "Multi-Unit" in micro_arch.generated_name
