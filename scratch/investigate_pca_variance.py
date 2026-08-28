"""Diagnostic script to investigate the PCA explained variance ratio across preprocessing configurations."""

import numpy as np
from sklearn.decomposition import PCA
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.contracts import PreprocessingConfig
from pathlib import Path

def analyze():
    clients_path = Path("clients.csv")
    properties_path = Path("properties.csv")

    clients = load_clients_csv(clients_path)
    properties = load_properties_csv(properties_path)
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    configs = [
        ("Config A: include_gender=False, include_country=True, top_n_countries=10 (Current Baseline)", PreprocessingConfig(include_gender=False, include_country=True, top_n_countries=10)),
        ("Config B: include_gender=True, include_country=True, top_n_countries=10", PreprocessingConfig(include_gender=True, include_country=True, top_n_countries=10)),
        ("Config C: include_gender=False, include_country=True, top_n_countries=5", PreprocessingConfig(include_gender=False, include_country=True, top_n_countries=5)),
        ("Config D: include_gender=True, include_country=True, top_n_countries=5", PreprocessingConfig(include_gender=True, include_country=True, top_n_countries=5)),
        ("Config E: include_gender=False, include_country=False", PreprocessingConfig(include_gender=False, include_country=False)),
        ("Config F: include_gender=True, include_country=False", PreprocessingConfig(include_gender=True, include_country=False)),
    ]

    for name, cfg in configs:
        preprocessor = CustomerFeaturePreprocessor(cfg)
        mat = preprocessor.fit_transform(profiles)
        pca = PCA(n_components=3, random_state=42)
        pca.fit(mat.data)
        exp = pca.explained_variance_ratio_
        print(f"=== {name} ===")
        print(f"  Shape: {mat.data.shape} (D={mat.feature_count} features)")
        print(f"  Feature Names ({len(mat.feature_names)}): {mat.feature_names}")
        print(f"  PC1: {exp[0]*100:.2f}% | PC2: {exp[1]*100:.2f}% | PC3: {exp[2]*100:.2f}%")
        print(f"  Cumulative (PC1+PC2+PC3): {np.sum(exp)*100:.2f}%\n")

if __name__ == "__main__":
    analyze()
