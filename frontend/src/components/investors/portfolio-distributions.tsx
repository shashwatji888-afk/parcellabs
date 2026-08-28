"use strict";
"use client";

import React from "react";
import { Layers, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { PercentileDistribution } from "@/types/api";

export interface PortfolioDistributionsProps {
  portfolioSizeDistribution: Record<number, number>;
  spendPercentiles: PercentileDistribution;
  pricePercentiles: PercentileDistribution;
  totalBuyers: number;
  className?: string;
}

export function PortfolioDistributions({
  portfolioSizeDistribution,
  spendPercentiles,
  pricePercentiles,
  totalBuyers,
  className,
}: PortfolioDistributionsProps) {
  // Find max count for scaling property distribution bars
  const maxCount = Math.max(...Object.values(portfolioSizeDistribution), 1);

  const percentileLadder = [
    { label: "P5 (Lower Outliers)", spend: spendPercentiles.p5, price: pricePercentiles.p5 },
    { label: "P10", spend: spendPercentiles.p10, price: pricePercentiles.p10 },
    { label: "P25 (Q1 / Lower Quartile)", spend: spendPercentiles.p25, price: pricePercentiles.p25 },
    { label: "P50 (Median)", spend: spendPercentiles.p50, price: pricePercentiles.p50, highlight: true },
    { label: "P75 (Q3 / Upper Quartile)", spend: spendPercentiles.p75, price: pricePercentiles.p75 },
    { label: "P90", spend: spendPercentiles.p90, price: pricePercentiles.p90 },
    { label: "P95", spend: spendPercentiles.p95, price: pricePercentiles.p95 },
    { label: "P99 (Top 1% Tier)", spend: spendPercentiles.p99, price: pricePercentiles.p99 },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className || ""}`}>
      {/* 1. Portfolio Size (Properties Owned) Distribution */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500" />
            Portfolio Unit Scale Distribution
          </CardTitle>
          <CardDescription className="text-xs">
            Frequency count and concentration of total properties acquired per buyer portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            {Object.entries(portfolioSizeDistribution).map(([unitsStr, count]) => {
              const units = parseInt(unitsStr, 10);
              const pct = totalBuyers > 0 ? (count / totalBuyers) * 100 : 0;
              const barWidth = (count / maxCount) * 100;

              return (
                <div key={units} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {units} {units === 1 ? "Property" : "Properties"}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>{formatNumber(count)} buyers</span>
                      <span className="text-slate-400">({formatPercent(pct)})</span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        units >= 5
                          ? "bg-purple-600 dark:bg-purple-500"
                          : "bg-indigo-500 dark:bg-indigo-400"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-800">
            <p className="leading-relaxed text-[11px]">
              <strong>Distribution Insight:</strong> 94.0% of buyers hold exactly 3 or 4 units (3 units: 46.6%, 4 units: 47.4%). Buyers with 5+ units constitute the high-scale accumulator tail (6.0% of total population).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Percentile Ladder (Spend & Unit Price) */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-cyan-500" />
            Financial Percentile Ladder & Dispersion
          </CardTitle>
          <CardDescription className="text-xs">
            Non-parametric percentile ranges revealing distribution skew across capital and unit pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pl-2">Percentile</th>
                  <th className="py-2 text-right">Total Portfolio Spend</th>
                  <th className="py-2 text-right pr-2">Avg Price / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {percentileLadder.map((row) => (
                  <tr
                    key={row.label}
                    className={`${
                      row.highlight
                        ? "bg-indigo-50/60 font-semibold text-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-200"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    <td className="py-2 pl-2 text-[11px]">{row.label}</td>
                    <td className="py-2 text-right font-mono text-[11px]">{formatCurrency(row.spend)}</td>
                    <td className="py-2 text-right font-mono text-[11px] pr-2">{formatCurrency(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                Spend Mean vs Median
              </span>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">
                Mean: {formatCurrency(spendPercentiles.mean)} • Med: {formatCurrency(spendPercentiles.p50)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                IQR (Spread): {formatCurrency(spendPercentiles.iqr)}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
              <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
                Unit Price Mean vs Median
              </span>
              <div className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">
                Mean: {formatCurrency(pricePercentiles.mean)} • Med: {formatCurrency(pricePercentiles.p50)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                IQR (Spread): {formatCurrency(pricePercentiles.iqr)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
