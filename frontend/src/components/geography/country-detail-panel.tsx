"use strict";
"use client";

import React from "react";
import { MapPin, X, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CountryDistributionItem } from "@/types/api";

export interface CountryDetailPanelProps {
  country: CountryDistributionItem;
  onClear: () => void;
  className?: string;
}

export function CountryDetailPanel({ country, onClear, className }: CountryDetailPanelProps) {
  return (
    <Card className={`border-indigo-200 bg-indigo-50/20 shadow-xs dark:border-indigo-900/40 dark:bg-indigo-950/20 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {country.country} Market Drill-Down
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-800">
                  {formatNumber(country.buyer_count)} buyers ({formatPercent(country.percentage)} global share)
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed structural composition and top sub-national subdivisions
              </CardDescription>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-xs">
            <X className="h-4 w-4 mr-1" /> Close Drill-Down
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Median Spend</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatCurrency(country.median_spend)}
            </div>
            <div className="text-[10px] text-slate-500">Mean: {formatCurrency(country.avg_spend)}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Avg Unit Price</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatCurrency(country.avg_unit_price)}
            </div>
            <div className="text-[10px] text-slate-500">Per acquired unit</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
              Investment Intent
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {formatPercent(country.investment_rate_pct)}
            </div>
            <div className="text-[10px] text-slate-500">{country.investment_count} investment buyers</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">
              Loan Financing
            </span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {formatPercent(country.loan_rate_pct)}
            </div>
            <div className="text-[10px] text-slate-500">{country.loan_count} mortgage buyers</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Corporate Share</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {formatPercent(country.corporate_rate_pct)}
            </div>
            <div className="text-[10px] text-slate-500">{country.corporate_count} companies</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-500">Mean Satisfaction</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {country.avg_satisfaction.toFixed(2)} / 5.0
            </div>
            <div className="text-[10px] text-slate-500">Avg client score</div>
          </div>
        </div>

        {/* Top Regions Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            Top Sub-National Regions ({country.top_regions.length} total)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {country.top_regions.slice(0, 10).map((r) => (
              <div
                key={r.region}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={r.region}>
                  {r.region}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between font-mono">
                  <span>{formatNumber(r.buyer_count)} buyers</span>
                  <span>{formatPercent(r.share_pct)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
