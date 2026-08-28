"use strict";
"use client";

import React from "react";
import { TableProperties } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { GeoBehaviorMatrixRow } from "@/types/api";

export interface GeoBehaviorMatrixProps {
  matrix: GeoBehaviorMatrixRow[];
  className?: string;
}

export function GeoBehaviorMatrix({ matrix, className }: GeoBehaviorMatrixProps) {
  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-indigo-500" />
          Geographic × Behavioral Cross-Tabulation Matrix
        </CardTitle>
        <CardDescription className="text-xs">
          Multi-dimensional matrix evaluating behavioral divergence and capital deployment across all 10 national markets
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <th className="py-2.5 pl-3">Country</th>
                <th className="py-2.5 text-right">Buyers</th>
                <th className="py-2.5 text-right">Share %</th>
                <th className="py-2.5 text-right">Invest Intent %</th>
                <th className="py-2.5 text-right">Mortgage %</th>
                <th className="py-2.5 text-right">Corporate %</th>
                <th className="py-2.5 text-right">Avg Units</th>
                <th className="py-2.5 text-right">Median Spend</th>
                <th className="py-2.5 text-right">Avg Spend</th>
                <th className="py-2.5 text-right">Avg Unit Price</th>
                <th className="py-2.5 text-right pr-3">Satisfaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {matrix.map((row) => (
                <tr
                  key={row.country}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 pl-3 font-semibold text-slate-900 dark:text-slate-100">
                    {row.country}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatNumber(row.buyer_count)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatPercent(row.share_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatPercent(row.investment_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                    {formatPercent(row.loan_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatPercent(row.corporate_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                    {row.avg_portfolio_size.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.median_spend)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(row.avg_spend)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatCurrency(row.avg_unit_price)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-900 dark:text-slate-100 pr-3">
                    {row.avg_satisfaction.toFixed(2)}
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
