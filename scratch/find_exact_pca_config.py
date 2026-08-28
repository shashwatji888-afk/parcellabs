import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler
from parcllabs.data.loader import load_clients_csv, load_properties_csv
from parcllabs.features.aggregator import aggregate_customer_portfolios
from pathlib import Path

def test_variations():
    clients = load_clients_csv(Path("clients.csv"))
    properties = load_properties_csv(Path("properties.csv"))
    profiles = aggregate_customer_portfolios(clients, properties, strict=True)

    # Let's check numerical features + one-hot encodings with different combinations:
    # 1. StandardScaler vs RobustScaler vs MinMaxScaler
    # 2. Including gender vs excluding gender
    # 3. Including country vs excluding country vs including region
    # 4. Including apartment_ratio vs excluding apartment_ratio
    # 5. One-hot drop='first' vs drop=None
    # 6. Log-transformed spend vs standard spend
    # 7. Including total_spend, avg_floor_area_sqft, etc.

    df_list = []
    for p in profiles:
        df_list.append({
            "age": p.age or 45,
            "satisfaction_score": p.satisfaction_score,
            "total_properties": p.total_properties,
            "total_spend": p.total_spend,
            "avg_price_per_unit": p.avg_price_per_unit,
            "avg_floor_area_sqft": p.avg_floor_area_sqft,
            "office_units_count": p.office_units_count,
            "office_ratio": p.office_ratio,
            "apartment_units_count": p.apartment_units_count,
            "apartment_ratio": p.apartment_ratio,
            "loan_applied_binary": p.loan_applied_binary,
            "client_type": p.client_type,
            "acquisition_purpose": p.acquisition_purpose,
            "referral_channel": p.referral_channel,
            "country": p.country,
            "gender": p.gender or "Unknown",
        })
    df = pd.DataFrame(df_list)

    # Let's test combinations
    # What if all numerical features (including avg_floor_area_sqft, office_units_count, apartment_units_count, apartment_ratio) were included?
    num_cols_full = [
        "age", "satisfaction_score", "total_properties", "total_spend",
        "avg_price_per_unit", "avg_floor_area_sqft", "office_units_count",
        "office_ratio", "apartment_units_count", "apartment_ratio", "loan_applied_binary"
    ]
    
    cat_cols_full = ["client_type", "acquisition_purpose", "referral_channel", "country", "gender"]

    for include_floor in [True, False]:
        for include_apt_ratio in [True, False]:
            for include_counts in [True, False]:
                for include_gender in [True, False]:
                    for include_country in [True, False]:
                        for scaler_cls in [StandardScaler, RobustScaler, MinMaxScaler]:
                            num_c = ["age", "satisfaction_score", "total_properties", "total_spend", "avg_price_per_unit", "office_ratio", "loan_applied_binary"]
                            if include_floor:
                                num_c.append("avg_floor_area_sqft")
                            if include_apt_ratio:
                                num_c.append("apartment_ratio")
                            if include_counts:
                                num_c.extend(["office_units_count", "apartment_units_count"])
                            
                            cat_c = ["client_type", "acquisition_purpose", "referral_channel"]
                            if include_gender:
                                cat_c.append("gender")
                            if include_country:
                                cat_c.append("country")

                            X_num = scaler_cls().fit_transform(df[num_c])
                            X_cat = pd.get_dummies(df[cat_c], drop_first=False).values
                            X = np.hstack([X_num, X_cat])

                            pca = PCA(n_components=3, random_state=42)
                            pca.fit(X)
                            exp = [round(float(v), 4) for v in pca.explained_variance_ratio_]
                            tot = round(float(np.sum(exp)), 4)

                            if round(exp[0], 2) in [0.19, 0.20, 0.22] or abs(tot - 0.4429) < 0.01:
                                print(f"Features: {X.shape[1]}, Scaler: {scaler_cls.__name__}, Floor: {include_floor}, AptRatio: {include_apt_ratio}, Counts: {include_counts}, Gender: {include_gender}, Country: {include_country}")
                                print(f"  -> PC1: {exp[0]*100:.2f}%, PC2: {exp[1]*100:.2f}%, PC3: {exp[2]*100:.2f}%, Total: {tot*100:.2f}%")

if __name__ == "__main__":
    test_variations()
