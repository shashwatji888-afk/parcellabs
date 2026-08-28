"use strict";
"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ClusterProfile } from "@/types/api";

export interface FeatureDistributionsCardProps {
  profile: ClusterProfile;
  className?: string;
}

export function FeatureDistributionsCard({ profile, className }: FeatureDistributionsCardProps) {
  const np = profile.numerical_profiles;

  const keyNumericalFeatures = [
    {
      key: "total_spend",
      label: "Total Portfolio Spend",
      isCurrency: true,
      data: np.total_spend,
    },
    {
      key: "total_properties",
      label: "Portfolio Units Scale",
      isCurrency: false,
      data: np.total_properties,
    },
    {
      key: "avg_price_per_unit",
      label: "Average Price / Unit",
      isCurrency: true,
      data: np.avg_price_per_unit,
    },
    {
      key: "avg_floor_area_sqft",
      label: "Mean Unit Floor Area (SqFt)",
      isCurrency: false,
      data: np.avg_floor_area_sqft,
    },
    {
      key: "age",
      label: "Buyer Age (Years)",
      isCurrency: false,
      data: np.age,
    },
    {
      key: "satisfaction_score",
      label: "Client Satisfaction (1-5)",
      isCurrency: false,
      data: np.satisfaction_score,
    },
    {
      key: "loan_applied_binary",
      label: "Mortgage Loan Ratio (0-1)",
      isCurrency: false,
      isPercent: true,
      data: np.loan_applied_binary,
    },
    {
      key: "office_ratio",
      label: "Office Units Allocation",
      isCurrency: false,
      isPercent: true,
      data: np.office_ratio,
    },
  ];

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          Numerical Feature Distributions vs Population Baseline
        </CardTitle>
        <CardDescription className="text-xs">
          Exact continuous distribution statistics: Segment Mean, Median, Quartiles, and Standardized Z-Score Deviation
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyNumericalFeatures.map((item) => {
            const p = item.data;
            if (!p) return null;

            const zScore = p.z_score_deviation;
            const isElevated = zScore >= 0.35;
            const isDepressed = zScore <= -0.35;

            const formatVal = (val: number) => {
              if (item.isCurrency) return formatCurrency(val);
              if (item.isPercent) return formatPercent(val * 100);
              return val.toFixed(2);
            };

            return (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.label}>
                      {item.label}
                    </span>

                    {/* Z-Score Badge */}
                    <Badge
                      variant={isElevated ? "success" : isDepressed ? "warning" : "outline"}
                      className="text-[10px] py-0 px-1 font-mono shrink-0"
                    >
                      {zScore >= 0 ? `+${zScore.toFixed(2)}σ` : `${zScore.toFixed(2)}σ`}
                    </Badge>
                  </div>

                  {/* Segment Mean & Median */}
                  <div className="mt-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formatVal(p.mean)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Segment Mean (Med: {formatVal(p.median)})
                      </span>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-slate-500 font-mono block">
                        {formatVal(p.population_mean)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Pop Baseline
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quartile Dispersion Box */}
                <div className="rounded-lg border border-slate-200 bg-white p-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span>Q25: {formatVal(p.q25)}</span>
                    <span>Q75: {formatVal(p.q75)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>IQR: {formatVal(p.iqr)}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {p.pct_difference >= 0 ? `+${p.pct_difference.toFixed(1)}%` : `${p.pct_difference.toFixed(1)}%`} vs pop
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
