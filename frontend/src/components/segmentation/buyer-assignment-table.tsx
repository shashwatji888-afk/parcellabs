"use client";

import { useState, useMemo } from "react";
import { CustomerPortfolioProfile, ArchetypeInterpretation } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClusterColor } from "@/components/segmentation/colors";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Users } from "lucide-react";

export interface BuyerAssignmentTableProps {
  buyers: CustomerPortfolioProfile[];
  assignments: Record<string, number>;
  archetypes: Record<number, ArchetypeInterpretation>;
  selectedClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  className?: string;
}

type SortField = "client_id" | "cluster_id" | "total_spend" | "avg_price_per_unit" | "total_properties" | "age";
type SortOrder = "asc" | "desc";

export function BuyerAssignmentTable({
  buyers,
  assignments,
  archetypes,
  selectedClusterId,
  onSelectCluster,
  className,
}: BuyerAssignmentTableProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("total_spend");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const clusterIds = useMemo(() => {
    return Object.keys(archetypes)
      .map(Number)
      .sort((a, b) => a - b);
  }, [archetypes]);

  // Handle sorting toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Filtered & Sorted Buyers
  const filteredBuyers = useMemo(() => {
    let list = buyers.map((b) => {
      const cId = assignments[b.client_id] ?? 0;
      return {
        ...b,
        cluster_id: cId,
        archetype_name: archetypes[cId]?.display_name || archetypes[cId]?.generated_name || `Cluster ${cId}`,
      };
    });

    // Filter by cluster
    if (selectedClusterId !== null) {
      list = list.filter((b) => b.cluster_id === selectedClusterId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.client_id.toLowerCase().includes(q) ||
          b.country.toLowerCase().includes(q) ||
          b.archetype_name.toLowerCase().includes(q) ||
          b.acquisition_purpose.toLowerCase().includes(q)
      );
    }

    // Sort list
    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];

      if (typeof vA === "string" && typeof vB === "string") {
        return sortOrder === "asc" ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }

      vA = vA ?? 0;
      vB = vB ?? 0;
      return sortOrder === "asc" ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

    return list;
  }, [buyers, assignments, archetypes, selectedClusterId, searchQuery, sortField, sortOrder]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredBuyers.length / pageSize) || 1;
  const paginatedBuyers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBuyers.slice(start, start + pageSize);
  }, [filteredBuyers, page, pageSize]);

  return (
    <Card className={cn("border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60", className)}>
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            Buyer Assignment & Analytical Attributes Table
          </CardTitle>
          <CardDescription className="text-xs">
            Individual client-level cluster classifications, portfolio spend, and property counts
          </CardDescription>
        </div>

        {/* Search & Cluster Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client ID, country..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-9 w-60 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </div>

          {/* Cluster Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedClusterId === null ? "all" : selectedClusterId}
              onChange={(e) => {
                const val = e.target.value;
                onSelectCluster(val === "all" ? null : Number(val));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:border-slate-400 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Clusters ({formatNumber(buyers.length)})</option>
              {clusterIds.map((cId) => (
                <option key={cId} value={cId}>
                  Cluster {cId}: {archetypes[cId]?.generated_name || `Cluster ${cId}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Table Viewport */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
              <tr>
                <th
                  onClick={() => handleSort("client_id")}
                  className="cursor-pointer py-3 px-4 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Client ID <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("cluster_id")}
                  className="cursor-pointer py-3 px-4 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Cluster & Archetype <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("total_spend")}
                  className="cursor-pointer py-3 px-4 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Total Spend <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("avg_price_per_unit")}
                  className="cursor-pointer py-3 px-4 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Price / Unit <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("total_properties")}
                  className="cursor-pointer py-3 px-4 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-1">
                    Units <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Loan Rel.</th>
                <th className="py-3 px-4 font-semibold">Purpose</th>
                <th className="py-3 px-4 font-semibold">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedBuyers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No matching buyers found for the active search criteria.
                  </td>
                </tr>
              ) : (
                paginatedBuyers.map((b) => {
                  const color = getClusterColor(b.cluster_id);
                  return (
                    <tr
                      key={b.client_id}
                      className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40"
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {b.client_id}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {b.archetype_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(b.total_spend)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        {formatCurrency(b.avg_price_per_unit)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                        {b.total_properties} properties
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={b.loan_applied_binary === 1 ? "warning" : "success"}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {b.loan_applied_binary === 1 ? "Mortgage" : "100% Cash"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {b.acquisition_purpose}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {b.country}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {filteredBuyers.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {Math.min(page * pageSize, filteredBuyers.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(filteredBuyers.length)}
            </span>{" "}
            buyers
            {selectedClusterId !== null && (
              <span className="ml-1 text-slate-400">
                (filtered from {formatNumber(buyers.length)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded border border-slate-200 bg-slate-50 px-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <span className="text-xs font-medium px-1">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
