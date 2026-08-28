"use strict";
"use client";

import React, { useState, useMemo } from "react";
import { Layers, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { RegionDistributionItem } from "@/types/api";

export interface RegionHierarchyTableProps {
  regions: RegionDistributionItem[];
  className?: string;
}

const PAGE_SIZE = 15;

export function RegionHierarchyTable({ regions, className }: RegionHierarchyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof RegionDistributionItem>("buyer_count");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof RegionDistributionItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...regions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.region.toLowerCase().includes(term) ||
          r.country.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }

      return 0;
    });

    return result;
  }, [regions, searchTerm, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE) || 1;
  const paginatedRegions = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Sub-National Regional Hierarchy ({regions.length} Distinct Regions)
            </CardTitle>
            <CardDescription className="text-xs">
              Complete inventory of provincial and state subdivisions mapped to parent nation
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search region or country..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs shadow-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <th
                  className="py-2.5 pl-3 cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("country")}
                >
                  <div className="flex items-center gap-1">
                    Country <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("region")}
                >
                  <div className="flex items-center gap-1">
                    Sub-Region / State <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("buyer_count")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Buyers <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("percentage_of_country")}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Nation <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("percentage_of_total")}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Global <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("investment_rate_pct")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Invest Rate % <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("loan_rate_pct")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Loan Rate % <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("median_spend")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Median Spend <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right pr-3 cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("avg_satisfaction")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Satisfaction <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {paginatedRegions.map((r) => (
                <tr
                  key={`${r.country}-${r.region}`}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 pl-3">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {r.country}
                    </Badge>
                  </td>
                  <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                    {r.region}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {formatNumber(r.buyer_count)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatPercent(r.percentage_of_country)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                    {formatPercent(r.percentage_of_total)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatPercent(r.investment_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">
                    {formatPercent(r.loan_rate_pct)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-900 dark:text-slate-100 font-medium">
                    {formatCurrency(r.median_spend)}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300 pr-3">
                    {r.avg_satisfaction.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500">
              Showing {paginatedRegions.length} of {filteredAndSorted.length} regions (Page {currentPage} of {totalPages})
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
      </CardContent>
    </Card>
  );
}
