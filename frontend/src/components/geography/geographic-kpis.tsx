"use strict";
"use client";

import React from "react";
import { Globe, MapPin, Building, DollarSign, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export interface GeographicKPIsProps {
  totalBuyers: number;
  totalCountries: number;
  totalRegions: number;
  avgSpendGlobal: number;
  topCountryName: string;
  topCountrySharePct: number;
  className?: string;
}

export function GeographicKPIs({
  totalBuyers,
  totalCountries,
  totalRegions,
  avgSpendGlobal,
  topCountryName,
  topCountrySharePct,
  className,
}: GeographicKPIsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className || ""}`}>
      {/* 1. Analyzed Buyer Base */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Total Buyers
            </span>
            <Globe className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {formatNumber(totalBuyers)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              100% verified baseline coverage
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Countries Count */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Countries
            </span>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {totalCountries} <span className="text-xs font-normal text-slate-500">nations</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Top 10 international markets
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Sub-national Regions */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Sub-Regions / States
            </span>
            <Building className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {totalRegions} <span className="text-xs font-normal text-slate-500">regions</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Distinct state/provincial divisions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Global Mean Spend */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Global Mean Spend
            </span>
            <DollarSign className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {formatCurrency(avgSpendGlobal)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Per-buyer portfolio capital deployment
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Primary Market Concentration */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Primary Market
            </span>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-600 tracking-tight dark:text-amber-400 flex items-baseline gap-1.5">
              {topCountryName}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                ({formatPercent(topCountrySharePct)})
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Dominant buyer geographic concentration
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
