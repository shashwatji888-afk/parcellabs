"use strict";
"use client";

import React, { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { GeographicKPIs } from "@/components/geography/geographic-kpis";
import { CountryDistributionGrid } from "@/components/geography/country-distribution-grid";
import { CountryDetailPanel } from "@/components/geography/country-detail-panel";
import { RegionHierarchyTable } from "@/components/geography/region-hierarchy-table";
import { GeoBehaviorMatrix } from "@/components/geography/geo-behavior-matrix";

const COUNTRIES = [
  "USA",
  "UK",
  "Canada",
  "Germany",
  "France",
  "Belgium",
  "Mexico",
  "Australia",
  "Russia",
  "Denmark",
];

function GeographicIntelligenceContent() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("");
  const [selectedLoan, setSelectedLoan] = useState<string>("");

  const hasActiveFilters = Boolean(
    selectedCountry || selectedPurpose || selectedLoan
  );

  const resetFilters = () => {
    setSelectedCountry("");
    setSelectedPurpose("");
    setSelectedLoan("");
  };

  const {
    data: geoData,
    isLoading: isGeoLoading,
    isError: isGeoError,
    error: geoError,
    refetch: refetchGeo,
  } = useQuery({
    queryKey: [
      "geographic-intelligence",
      selectedCountry,
      selectedPurpose,
      selectedLoan,
    ],
    queryFn: () =>
      apiClient.getGeographicIntelligence({
        selected_country: selectedCountry || undefined,
        acquisition_purpose: selectedPurpose || undefined,
        loan_status: selectedLoan || undefined,
      }),
  });

  const activeCountryDetail = selectedCountry && geoData
    ? geoData.countries.find((c) => c.country.toLowerCase() === selectedCountry.toLowerCase())
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          Global Demographics
        </span>
      </div>

      {/* Filter Toolbar + Refresh Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Display Filters:</span>
          </div>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Countries (10)</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Acquisition Purpose Selector */}
          <select
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Purposes</option>
            <option value="Home">Home Purchase (Primary)</option>
            <option value="Investment">Investment Acquisition</option>
          </select>

          {/* Financing Status Selector */}
          <select
            value={selectedLoan}
            onChange={(e) => setSelectedLoan(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Financing Types</option>
            <option value="Yes">Mortgage Loan Backed</option>
            <option value="No">100% Cash / Unleveraged</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reset Filters
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchGeo()}
          className="text-xs h-8"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {/* Loading State */}
      {isGeoLoading && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Mapping geographic divisions, regional hierarchies, and cross-tabulation matrix...
          </p>
        </div>
      )}

      {/* Error State */}
      {isGeoError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Failed to load geographic intelligence
          </div>
          <p className="mt-2 text-xs">
            {geoError instanceof Error
              ? geoError.message
              : "Unable to retrieve geographic data from the backend service."}
          </p>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!isGeoLoading && geoData && (
        <div className="space-y-6">
          {/* Section 1: Geographic KPIs */}
          <GeographicKPIs
            totalBuyers={geoData.total_buyers}
            totalCountries={geoData.total_countries}
            totalRegions={geoData.total_regions}
            avgSpendGlobal={geoData.avg_spend_global}
            topCountryName={geoData.top_country_name}
            topCountrySharePct={geoData.top_country_share_pct}
          />

          {/* Section 2: Selected Country Drilldown Panel (if active) */}
          {activeCountryDetail && (
            <CountryDetailPanel
              country={activeCountryDetail}
              onClear={() => setSelectedCountry("")}
            />
          )}

          {/* Section 3: Country Cards Grid */}
          <CountryDistributionGrid
            countries={geoData.countries}
            selectedCountry={selectedCountry || null}
            onSelectCountry={(c: string) => setSelectedCountry(selectedCountry === c ? "" : c)}
          />

          {/* Section 4: Geographic x Behavioral Cross-Matrix */}
          <GeoBehaviorMatrix matrix={geoData.cross_matrix} />

          {/* Section 5: Full 57 Sub-National Regional Hierarchy Table */}
          <RegionHierarchyTable regions={geoData.regions} />
        </div>
      )}
    </div>
  );
}

export default function GeographicIntelligencePage() {
  return (
    <DashboardShell
      title="Geographic Intelligence & Regional Hierarchy"
      subtitle="National and sub-national distribution of property buyers across 10 international markets and 57 verified state/provincial divisions"
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        }
      >
        <GeographicIntelligenceContent />
      </Suspense>
    </DashboardShell>
  );
}
