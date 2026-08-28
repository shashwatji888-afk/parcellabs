"use strict";
"use client";

import React from "react";
import { Globe2, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CountryDistributionItem } from "@/types/api";

export interface CountryDistributionGridProps {
  countries: CountryDistributionItem[];
  selectedCountry: string | null;
  onSelectCountry: (country: string) => void;
  className?: string;
}

export function CountryDistributionGrid({
  countries,
  selectedCountry,
  onSelectCountry,
  className,
}: CountryDistributionGridProps) {
  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-indigo-500" />
              Country-Level Distribution & Investment Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Overview of all 10 buyer origin countries. Select any country to view its sub-regional breakdown.
            </CardDescription>
          </div>
          {selectedCountry && (
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs"
            >
              Filtering: {selectedCountry}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {countries.map((c) => {
            const isSelected = selectedCountry === c.country;

            return (
              <div
                key={c.country}
                data-testid={`country-card-${c.country}`}
                onClick={() => onSelectCountry(c.country)}
                className={`group cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30"
                    : "border-slate-200/80 bg-slate-50/50 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <MapPin className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-500"}`} />
                      {c.country}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatPercent(c.percentage)}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatNumber(c.buyer_count)} buyers • {c.region_count} regions
                  </div>

                  {/* Share Progress Bar */}
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      style={{ width: `${Math.max(c.percentage, 4)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSelected ? "bg-indigo-600 dark:bg-indigo-400" : "bg-indigo-500/70"
                      }`}
                    />
                  </div>

                  {/* Behavioral Metrics Grid */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-[11px] border-t border-slate-200/60 pt-2.5 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Investment</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatPercent(c.investment_rate_pct)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Mortgage</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                        {formatPercent(c.loan_rate_pct)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Med Spend</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {formatCurrency(c.median_spend)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Avg Units</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        {c.avg_properties.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end text-[11px] font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  Drill down <ChevronRight className="h-3 w-3 ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
