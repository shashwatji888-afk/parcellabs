"""Machine learning preprocessing, clustering algorithms, evaluation, profiling, and archetype generation."""

from parcllabs.ml.contracts import (
    ArchetypeInterpretation,
    CandidateKEvaluation,
    CandidateKMetrics,
    CategoricalFeatureProfile,
    ClusteringConfig,
    ClusteringRunResult,
    ClusterProfile,
    DatasetArchetypesResult,
    DatasetProfilingResult,
    HierarchicalLinkageResult,
    NumericalFeatureProfile,
    PreprocessingConfig,
    ProcessedMLMatrix,
)
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.clustering import KMeansClusterer
from parcllabs.ml.evaluator import ClusterEvaluator
from parcllabs.ml.hierarchical import HierarchicalClusterer
from parcllabs.ml.profiler import ClusterProfiler
from parcllabs.ml.archetypes import ArchetypeGenerator

__all__ = [
    "PreprocessingConfig",
    "ProcessedMLMatrix",
    "ClusteringConfig",
    "CandidateKMetrics",
    "CandidateKEvaluation",
    "ClusteringRunResult",
    "HierarchicalLinkageResult",
    "NumericalFeatureProfile",
    "CategoricalFeatureProfile",
    "ClusterProfile",
    "DatasetProfilingResult",
    "ArchetypeInterpretation",
    "DatasetArchetypesResult",
    "CustomerFeaturePreprocessor",
    "KMeansClusterer",
    "HierarchicalClusterer",
    "ClusterEvaluator",
    "ClusterProfiler",
    "ArchetypeGenerator",
]
