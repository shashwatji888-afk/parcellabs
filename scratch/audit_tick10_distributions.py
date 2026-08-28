"""Comprehensive baseline distribution audit for TICK-10: Investor Behavior & Geographic Intelligence."""

from pathlib import Path
import pandas as pd
import numpy as np
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from parcllabs.ml.preprocessor import CustomerFeaturePreprocessor
from parcllabs.ml.contracts import PreprocessingConfig
from parcllabs.ml.clustering import KMeansClusterer, ClusteringConfig

def run_audit():
    clients = load_clients_csv(Path("clients.csv"))
    properties = load_properties_csv(Path("properties.csv"))
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    # Convert to DataFrame for descriptive audit
    data = []
    for p in profiles:
        data.append({
            "client_id": p.client_id,
            "client_type": p.client_type,
            "gender": p.gender,
            "country": p.country,
            "region": p.region or "Unassigned",
            "age": p.age,
            "satisfaction_score": p.satisfaction_score,
            "acquisition_purpose": p.acquisition_purpose,
            "loan_applied": p.loan_applied,
            "loan_applied_binary": p.loan_applied_binary,
            "referral_channel": p.referral_channel,
            "total_properties": p.total_properties,
            "total_spend": p.total_spend,
            "avg_price_per_unit": p.avg_price_per_unit,
            "avg_floor_area_sqft": p.avg_floor_area_sqft,
            "office_ratio": p.office_ratio,
            "apartment_ratio": p.apartment_ratio,
        })
    df = pd.DataFrame(data)

    # 1. High level population KPIs
    n_buyers = len(df)
    n_invest = (df["acquisition_purpose"] == "Investment").sum()
    n_home = (df["acquisition_purpose"] == "Home").sum()
    n_loan = (df["loan_applied_binary"] == 1).sum()
    n_cash = (df["loan_applied_binary"] == 0).sum()

    print("==================================================")
    print("1. POPULATION OVERVIEW")
    print(f"Total Buyers: {n_buyers}")
    print(f"Acquisition Purpose: Investment = {n_invest} ({n_invest/n_buyers*100:.1f}%), Home = {n_home} ({n_home/n_buyers*100:.1f}%)")
    print(f"Financing Status: Loan = {n_loan} ({n_loan/n_buyers*100:.1f}%), Cash/Unleveraged = {n_cash} ({n_cash/n_buyers*100:.1f}%)")
    print(f"Client Type: Individual = {(df['client_type']=='Individual').sum()} ({(df['client_type']=='Individual').sum()/n_buyers*100:.1f}%), Company = {(df['client_type']=='Company').sum()} ({(df['client_type']=='Company').sum()/n_buyers*100:.1f}%)")
    print(f"Average Portfolio Size: {df['total_properties'].mean():.2f} (Median: {df['total_properties'].median():.1f}, Std: {df['total_properties'].std():.2f})")
    print(f"Average Total Spend: ${df['total_spend'].mean():,.2f} (Median: ${df['total_spend'].median():,.2f}, IQR: ${df['total_spend'].quantile(0.75)-df['total_spend'].quantile(0.25):,.2f})")
    print(f"Average Unit Price: ${df['avg_price_per_unit'].mean():,.2f} (Median: ${df['avg_price_per_unit'].median():,.2f})")
    print(f"Average Satisfaction: {df['satisfaction_score'].mean():.2f} (Median: {df['satisfaction_score'].median():.1f})")

    # 2. Portfolio Size Distribution & Candidate Multi-Unit Thresholds
    print("\n==================================================")
    print("2. PORTFOLIO SIZE (TOTAL PROPERTIES) DISTRIBUTION")
    vc_props = df["total_properties"].value_counts().sort_index()
    print(vc_props)

    print("\n--- Candidate Multi-Unit Thresholds (total_properties >= N) ---")
    for n in range(2, 9):
        sub = df[df["total_properties"] >= n]
        cnt = len(sub)
        pct = cnt / n_buyers * 100
        inv_pct = (sub["acquisition_purpose"] == "Investment").mean() * 100
        loan_pct = (sub["loan_applied_binary"] == 1).mean() * 100
        corp_pct = (sub["client_type"] == "Company").mean() * 100
        avg_sp = sub["total_spend"].mean()
        med_sp = sub["total_spend"].median()
        print(f"Threshold >= {n} properties: Count={cnt:4d} ({pct:5.1f}%), AvgSpend=${avg_sp:10,.0f}, MedSpend=${med_sp:10,.0f}, Invest={inv_pct:4.1f}%, Loan={loan_pct:4.1f}%, Corp={corp_pct:4.1f}%")

    # 3. Spend & Price Distributions (Percentiles)
    print("\n==================================================")
    print("3. SPEND & PRICE PERCENTILE PROFILES")
    percentiles = [0.05, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99]
    spend_p = df["total_spend"].quantile(percentiles)
    price_p = df["avg_price_per_unit"].quantile(percentiles)
    p_df = pd.DataFrame({"Total Spend ($)": spend_p, "Avg Price/Unit ($)": price_p})
    print(p_df)

    # 4. Financing Cross-Tabs (Loan vs Cash by Purpose, Client Type, Cluster)
    print("\n==================================================")
    print("4. FINANCING CROSS-TABULATION (LOAN VS CASH)")
    print("\n-- Financing by Acquisition Purpose --")
    print(pd.crosstab(df["loan_applied"], df["acquisition_purpose"], margins=True, normalize='columns') * 100)
    print("\n-- Counts --")
    print(pd.crosstab(df["loan_applied"], df["acquisition_purpose"], margins=True))

    print("\n-- Financing by Client Type --")
    print(pd.crosstab(df["loan_applied"], df["client_type"], margins=True))

    # Cluster assignments
    preprocessor = CustomerFeaturePreprocessor(PreprocessingConfig(include_gender=False))
    mat = preprocessor.fit_transform(profiles)
    k3_clusterer = KMeansClusterer(ClusteringConfig(k=3))
    res3 = k3_clusterer.fit(mat)
    df["cluster_k3"] = [res3.cluster_assignments[cid] for cid in df["client_id"]]

    print("\n-- Loan Usage by K=3 Cluster --")
    ct_k3 = pd.crosstab(df["cluster_k3"], df["loan_applied"], margins=True)
    print(ct_k3)
    print("Loan % by Cluster:")
    for c in range(3):
        c_sub = df[df["cluster_k3"] == c]
        print(f"  Cluster {c}: {c_sub['loan_applied_binary'].mean()*100:.1f}% ({c_sub['loan_applied_binary'].sum()}/{len(c_sub)})")

    # 5. Geographic Intelligence: Country Breakdown
    print("\n==================================================")
    print("5. COUNTRY DISTRIBUTION & BEHAVIOR")
    country_summary = df.groupby("country").agg(
        buyer_count=("client_id", "count"),
        avg_spend=("total_spend", "mean"),
        median_spend=("total_spend", "median"),
        avg_properties=("total_properties", "mean"),
        avg_price_unit=("avg_price_per_unit", "mean"),
        investment_rate=("acquisition_purpose", lambda s: (s == "Investment").mean() * 100),
        loan_rate=("loan_applied_binary", lambda s: s.mean() * 100),
        avg_satisfaction=("satisfaction_score", "mean"),
    ).sort_values("buyer_count", ascending=False)
    country_summary["percentage"] = country_summary["buyer_count"] / n_buyers * 100
    print(country_summary)

    # 6. Geographic Intelligence: Region Breakdown
    print("\n==================================================")
    print("6. REGION DISTRIBUTION & MISSINGNESS")
    print(f"Unique regions: {df['region'].nunique()}")
    reg_counts = df["region"].value_counts()
    print("Top 15 Regions:")
    print(reg_counts.head(15))
    print(f"Unassigned / None region count: {(df['region'] == 'Unassigned').sum()}")

    # Region grouped by country
    print("\n-- Regions by Country sample --")
    reg_by_country = df.groupby(["country", "region"])["client_id"].count().reset_index()
    print(reg_by_country.head(25))

if __name__ == "__main__":
    run_audit()
