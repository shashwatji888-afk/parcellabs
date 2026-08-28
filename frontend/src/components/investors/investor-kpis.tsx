"use strict";
"use client";

import React from "react";
import { Users, TrendingUp, CreditCard, Building, DollarSign, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { InvestorSummaryKPIs } from "@/types/api";

export interface InvestorKPIsProps {
  summary: InvestorSummaryKPIs;
  className?: string;
}

export function InvestorKPIs({ summary, className }: InvestorKPIsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 ${className || ""}`}>
      {/* 1. Total Analyzed Buyers */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Analyzed Buyers
            </span>
            <Users className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {formatNumber(summary.total_buyers)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {summary.individual_count} Indiv • {summary.company_count} Corp ({formatPercent(summary.company_rate_pct)})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Investment Intent Share */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Investment Intent
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-600 tracking-tight dark:text-emerald-400">
              {formatPercent(summary.investment_rate_pct)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {formatNumber(summary.investment_buyers_count)} buyers • {formatNumber(summary.home_buyers_count)} Home
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Mortgage Loan Reliance */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Loan Reliance
            </span>
            <CreditCard className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-600 tracking-tight dark:text-amber-400">
              {formatPercent(summary.loan_rate_pct)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {formatNumber(summary.loan_buyers_count)} Loan • {formatNumber(summary.cash_buyers_count)} Cash
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Median Portfolio Spend */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Median Spend
            </span>
            <DollarSign className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {formatCurrency(summary.median_spend)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Mean: {formatCurrency(summary.avg_spend)} (IQR: {formatCurrency(summary.spend_iqr)})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Median Units Owned */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Portfolio Units
            </span>
            <Building className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              {summary.median_portfolio_size.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Mean: {summary.avg_portfolio_size.toFixed(2)} units / buyer
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Client Satisfaction */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Satisfaction Rating
            </span>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 tracking-tight dark:text-slate-100 flex items-baseline gap-1">
              {summary.avg_satisfaction.toFixed(2)}
              <span className="text-xs font-normal text-slate-500">/ 5.0</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Median rating: {summary.median_satisfaction.toFixed(1)} / 5.0
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
