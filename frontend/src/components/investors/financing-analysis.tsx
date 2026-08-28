"use strict";
"use client";

import React from "react";
import { CreditCard, Landmark, Home, TrendingUp, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ClusterFinancingItem, FinancingByPurposeBreakdown } from "@/types/api";

export interface FinancingAnalysisProps {
  financingByPurpose: FinancingByPurposeBreakdown;
  financingByCluster: ClusterFinancingItem[];
  totalBuyers: number;
  className?: string;
}

export function FinancingAnalysis({
  financingByPurpose,
  financingByCluster,
  totalBuyers,
  className,
}: FinancingAnalysisProps) {
  const totalLoan = financingByPurpose.loan_home_count + financingByPurpose.loan_investment_count;
  const totalCash = financingByPurpose.cash_home_count + financingByPurpose.cash_investment_count;
  const loanPct = totalBuyers > 0 ? (totalLoan / totalBuyers) * 100 : 0;
  const cashPct = totalBuyers > 0 ? (totalCash / totalBuyers) * 100 : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className || ""}`}>
      {/* 1. Loan vs Cash Structure & Acquisition Purpose */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-500" />
            Financing Structure & Intent Cross-Tabulation
          </CardTitle>
          <CardDescription className="text-xs">
            Distribution of mortgage loan backing vs cash un-leveraged buyers partitioned by purpose
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proportion Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Cash / Unleveraged: {formatPercent(cashPct)} ({formatNumber(totalCash)})
              </span>
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-amber-500" />
                Mortgage / Loan: {formatPercent(loanPct)} ({formatNumber(totalLoan)})
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex">
              <div
                style={{ width: `${cashPct}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Cash: ${formatPercent(cashPct)}`}
              />
              <div
                style={{ width: `${loanPct}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Loan: ${formatPercent(loanPct)}`}
              />
            </div>
          </div>

          {/* 4-Box Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Cash - Home */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Home className="h-3.5 w-3.5 text-slate-500" />
                  Cash • Home
                </span>
                <span className="font-mono">{formatPercent(financingByPurpose.cash_home_pct)}</span>
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(financingByPurpose.cash_home_count)}
                <span className="text-xs font-normal text-slate-500 ml-1">buyers</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Primary residence acquired with 100% equity
              </p>
            </div>

            {/* Cash - Investment */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  Cash • Investment
                </span>
                <span className="font-mono">{formatPercent(financingByPurpose.cash_investment_pct)}</span>
              </div>
              <div className="mt-2 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {formatNumber(financingByPurpose.cash_investment_count)}
                <span className="text-xs font-normal text-emerald-600/80 ml-1">buyers</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Un-leveraged capital deployment for yield/growth
              </p>
            </div>

            {/* Loan - Home */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <Home className="h-3.5 w-3.5 text-amber-600" />
                  Loan • Home
                </span>
                <span className="font-mono">{formatPercent(financingByPurpose.loan_home_pct)}</span>
              </div>
              <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(financingByPurpose.loan_home_count)}
                <span className="text-xs font-normal text-slate-500 ml-1">buyers</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Mortgage-backed residential owner-occupiers
              </p>
            </div>

            {/* Loan - Investment */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                  Loan • Investment
                </span>
                <span className="font-mono">{formatPercent(financingByPurpose.loan_investment_pct)}</span>
              </div>
              <div className="mt-2 text-lg font-bold text-amber-700 dark:text-amber-300">
                {formatNumber(financingByPurpose.loan_investment_count)}
                <span className="text-xs font-normal text-amber-600/80 ml-1">buyers</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Debt-leveraged property portfolio acquisitions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Financing by Cluster / Segment */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Landmark className="h-4 w-4 text-indigo-500" />
            Mortgage Financing Rate by Segment Cohort
          </CardTitle>
          <CardDescription className="text-xs">
            Comparison of leverage rates and buyer counts across active clustering archetypes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {financingByCluster.map((cluster) => {
              return (
                <div
                  key={cluster.cluster_id}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                        {cluster.archetype_name}
                        <span className="text-[10px] text-slate-400 font-normal">
                          [Cluster {cluster.cluster_id}]
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatNumber(cluster.total_buyers)} Total Buyers • {cluster.loan_count} Loan ({formatPercent(cluster.loan_rate_pct)}) • {cluster.cash_count} Cash ({formatPercent(cluster.cash_rate_pct)})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatPercent(cluster.loan_rate_pct)}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Loan Rate
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 flex">
                    <div
                      style={{ width: `${cluster.cash_rate_pct}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Cash: ${formatPercent(cluster.cash_rate_pct)}`}
                    />
                    <div
                      style={{ width: `${cluster.loan_rate_pct}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`Loan: ${formatPercent(cluster.loan_rate_pct)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            * Note: Percentages represent within-cluster financing rates. Cluster 0 exhibits complete un-leveraged cash backing (0.0% loan rate), whereas Cluster 2 is entirely mortgage-financed (100.0% loan rate).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
