"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, Layers, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export interface TopBarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function TopBar({ title, subtitle, onRefresh }: TopBarProps) {
  const { data: status, isFetching, refetch } = useQuery({
    queryKey: ["dataset-status"],
    queryFn: () => apiClient.getDatasetStatus(),
  });

  const handleRefresh = () => {
    refetch();
    if (onRefresh) onRefresh();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-8 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Dataset Status Indicator */}
        {status ? (
          <div className="flex items-center gap-2">
            <Badge variant={status.is_dataset_valid ? "success" : "warning"} className="gap-1 py-1 px-2.5">
              <Database className="h-3 w-3" />
              <span>{formatNumber(status.client_count)} Buyers Audited</span>
            </Badge>
            <Badge variant="outline" className="gap-1 py-1 px-2.5">
              <Layers className="h-3 w-3" />
              <span>{formatNumber(status.sold_property_count)} Sold Properties</span>
            </Badge>
          </div>
        ) : null}

        {/* Refresh Action */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          title="Refresh Analysis"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-emerald-500" : ""}`} />
        </button>
      </div>
    </header>
  );
}
