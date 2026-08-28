"use strict";
"use client";

import React, { useState } from "react";
import { GitCompare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { BehavioralComparisonGroup } from "@/types/api";

export interface BehavioralComparisonProps {
  comparisonByCluster: BehavioralComparisonGroup[];
  comparisonByPurpose: BehavioralComparisonGroup[];
  comparisonByClientType: BehavioralComparisonGroup[];
  className?: string;
}

export function BehavioralComparison({
  comparisonByCluster,
  comparisonByPurpose,
  comparisonByClientType,
  className,
}: BehavioralComparisonProps) {
  const [activeTab, setActiveTab] = useState<"cluster" | "purpose" | "clientType">("cluster");

  const getActiveGroups = () => {
    switch (activeTab) {
      case "cluster":
        return comparisonByCluster;
      case "purpose":
        return comparisonByPurpose;
      case "clientType":
        return comparisonByClientType;
    }
  };

  const currentGroups = getActiveGroups();

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-indigo-500" />
              Behavioral & Structural Cohort Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Side-by-side comparison of capital deployment, scale, satisfaction, and leverage across dimensions
            </CardDescription>
          </div>

          {/* Group Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-850 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("cluster")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "cluster"
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-750 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              By Segment Archetype
            </button>
            <button
              onClick={() => setActiveTab("purpose")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "purpose"
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-750 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              By Acquisition Purpose
            </button>
            <button
              onClick={() => setActiveTab("clientType")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "clientType"
                  ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-750 dark:text-indigo-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              By Client Structure
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <th className="py-2.5 pl-3">Cohort</th>
                <th className="py-2.5 text-right">Buyers</th>
                <th className="py-2.5 text-right">Share %</th>
                <th className="py-2.5 text-right">Avg Units</th>
                <th className="py-2.5 text-right">Median Spend</th>
                <th className="py-2.5 text-right">Avg Spend</th>
                <th className="py-2.5 text-right">Avg Unit Price</th>
                <th className="py-2.5 text-right">Loan Rate %</th>
                <th className="py-2.5 text-right">Invest Rate %</th>
                <th className="py-2.5 text-right pr-3">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {currentGroups.map((group) => (
                <tr
                  key={group.group_key}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 pl-3 font-medium text-slate-900 dark:text-slate-100">
                    {group.group_label}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatNumber(group.buyer_count)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-700 dark:text-slate-200">
                    {formatPercent(group.share_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {group.avg_portfolio_size.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(group.median_spend)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(group.avg_spend)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(group.avg_unit_price)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                    {formatPercent(group.loan_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatPercent(group.investment_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-900 dark:text-slate-100 pr-3">
                    {group.avg_satisfaction.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
