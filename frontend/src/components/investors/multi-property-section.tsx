"use strict";
"use client";

import React, { useState } from "react";
import {
  Building2,
  Sliders,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { MultiPropertyAnalyticsResponse } from "@/types/api";

export interface MultiPropertySectionProps {
  analytics: MultiPropertyAnalyticsResponse;
  activeThreshold: number;
  onThresholdChange: (threshold: number) => void;
  isLoading?: boolean;
  className?: string;
}

const PAGE_SIZE = 10;

export function MultiPropertySection({
  analytics,
  activeThreshold,
  onThresholdChange,
  isLoading = false,
  className,
}: MultiPropertySectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const thresholdOptions = [3, 4, 5, 6, 7, 8];

  // Filter qualifying buyers by search term
  const filteredBuyers = (analytics.qualifying_buyers || []).filter((buyer) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      buyer.client_id.toLowerCase().includes(term) ||
      buyer.country.toLowerCase().includes(term) ||
      buyer.region.toLowerCase().includes(term) ||
      buyer.client_type.toLowerCase().includes(term) ||
      buyer.acquisition_purpose.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredBuyers.length / PAGE_SIZE) || 1;
  const paginatedBuyers = filteredBuyers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-base font-semibold">
                Multi-Property / High-Portfolio-Scale Accumulators
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                N ≥ {activeThreshold} Units
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Empirical profiling of buyers holding large multi-unit portfolios (Default threshold: N ≥ 5 units)
            </CardDescription>
          </div>

          {/* Threshold Selector Button Group */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-850 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 px-2 flex items-center gap-1">
              <Sliders className="h-3 w-3" /> Min Units:
            </span>
            {thresholdOptions.map((t) => (
              <button
                key={t}
                onClick={() => {
                  onThresholdChange(t);
                  setCurrentPage(1);
                }}
                disabled={isLoading}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeThreshold === t
                    ? "bg-white text-purple-700 shadow-xs dark:bg-slate-750 dark:text-purple-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                ≥ {t}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metric Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Qualifying Cohort Size */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              Qualifying Buyers
            </span>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatNumber(analytics.qualifying_buyers_count)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {formatPercent(analytics.qualifying_percentage)} of total buyers
            </div>
          </div>

          {/* Aggregate Capital Deployed */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              Total Capital Deployed
            </span>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(analytics.total_spend)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Avg: {formatCurrency(analytics.avg_spend)}
            </div>
          </div>

          {/* Average Portfolio Scale */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              Avg Portfolio Size
            </span>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {analytics.avg_properties.toFixed(2)}{" "}
              <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Median: {analytics.median_properties.toFixed(1)} units
            </div>
          </div>

          {/* Investment Intent Share */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">
              Investment Intent
            </span>
            <div className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatPercent(analytics.investment_rate_pct)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {analytics.investment_purpose_count} Inv • {analytics.home_purpose_count} Home
            </div>
          </div>

          {/* Corporate Entity Share */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">
              Corporate Entities
            </span>
            <div className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatPercent(analytics.corporate_rate_pct)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {analytics.corporate_count} Company • {analytics.individual_count} Indiv
            </div>
          </div>

          {/* Mortgage Loan Reliance */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400">
              Mortgage Loan Share
            </span>
            <div className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">
              {formatPercent(analytics.loan_rate_pct)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {analytics.loan_count} Loan • {analytics.cash_count} Cash
            </div>
          </div>
        </div>

        {/* Search and Table Container */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search qualifying buyers by ID, country, region..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs shadow-xs focus:border-purple-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing {paginatedBuyers.length} of {filteredBuyers.length} matching buyers
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                  <th className="py-2.5 pl-3">Client ID</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5">Purpose</th>
                  <th className="py-2.5">Financing</th>
                  <th className="py-2.5 text-right">Properties</th>
                  <th className="py-2.5 text-right">Avg Unit Price</th>
                  <th className="py-2.5 text-right pr-3">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
                {paginatedBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                      No buyers match the current threshold (N ≥ {activeThreshold}) or search query.
                    </td>
                  </tr>
                ) : (
                  paginatedBuyers.map((buyer) => (
                    <tr
                      key={buyer.client_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 pl-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {buyer.client_id}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">
                        {buyer.region}, {buyer.country}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            buyer.client_type === "Company"
                              ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                              : "bg-slate-50 text-slate-600 border-slate-200 text-[10px] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          }
                        >
                          {buyer.client_type}
                        </Badge>
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant="outline"
                          className={
                            buyer.acquisition_purpose === "Investment"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-blue-50 text-blue-700 border-blue-200 text-[10px] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                          }
                        >
                          {buyer.acquisition_purpose}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {buyer.loan_applied_binary === 1 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Mortgage</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cash</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {buyer.total_properties}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(buyer.avg_price_per_unit)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 pr-3">
                        {formatCurrency(buyer.total_spend)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
