"use strict";
"use client";

import React, { useState, useMemo } from "react";
import { Users, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CustomerPortfolioProfile } from "@/types/api";

export interface SegmentBuyerTableProps {
  buyers: CustomerPortfolioProfile[];
  clusterId: number;
  segmentDisplayName: string;
  className?: string;
}

const PAGE_SIZE = 12;

export function SegmentBuyerTable({
  buyers,
  clusterId,
  segmentDisplayName,
  className,
}: SegmentBuyerTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof CustomerPortfolioProfile>("total_spend");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof CustomerPortfolioProfile) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...buyers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.client_id.toLowerCase().includes(term) ||
          b.country.toLowerCase().includes(term) ||
          b.region.toLowerCase().includes(term) ||
          b.client_type.toLowerCase().includes(term) ||
          b.acquisition_purpose.toLowerCase().includes(term)
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
  }, [buyers, searchTerm, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredAndSorted.length / PAGE_SIZE) || 1;
  const paginatedBuyers = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Segment Buyer Registry ({formatNumber(buyers.length)} Cohort Members)
            </CardTitle>
            <CardDescription className="text-xs">
              Micro-level inspection of individual buyer portfolios assigned to {segmentDisplayName} (Cluster {clusterId})
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, country, region..."
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
                  onClick={() => handleSort("client_id")}
                >
                  <div className="flex items-center gap-1">
                    Client ID <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("country")}
                >
                  <div className="flex items-center gap-1">
                    Location <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="py-2.5">Structure</th>
                <th className="py-2.5">Purpose</th>
                <th className="py-2.5">Financing</th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("total_properties")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Properties <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("avg_price_per_unit")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg Unit Price <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("total_spend")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Spend <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  className="py-2.5 text-right pr-3 cursor-pointer hover:text-indigo-600"
                  onClick={() => handleSort("satisfaction_score")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Satisfaction <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {paginatedBuyers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No buyer records matched your query within Cluster {clusterId}.
                  </td>
                </tr>
              ) : (
                paginatedBuyers.map((b) => (
                  <tr
                    key={b.client_id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 pl-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {b.client_id}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">
                      {b.region}, {b.country}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant="outline"
                        className={
                          b.client_type === "Company"
                            ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                            : "bg-slate-50 text-slate-600 border-slate-200 text-[10px] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }
                      >
                        {b.client_type}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge
                        variant="outline"
                        className={
                          b.acquisition_purpose === "Investment"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-blue-50 text-blue-700 border-blue-200 text-[10px] dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                        }
                      >
                        {b.acquisition_purpose}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">
                      {b.loan_applied_binary === 1 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Mortgage</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cash</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {b.total_properties}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(b.avg_price_per_unit)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(b.total_spend)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300 pr-3">
                      {b.satisfaction_score.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-500">
              Showing {paginatedBuyers.length} of {filteredAndSorted.length} matching buyers (Page {currentPage} of {totalPages})
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
