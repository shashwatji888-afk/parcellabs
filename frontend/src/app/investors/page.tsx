"use strict";
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { InvestorKPIs } from "@/components/investors/investor-kpis";
import { FinancingAnalysis } from "@/components/investors/financing-analysis";
import { PortfolioDistributions } from "@/components/investors/portfolio-distributions";
import { MultiPropertySection } from "@/components/investors/multi-property-section";
import { BehavioralComparison } from "@/components/investors/behavioral-comparison";

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

export default function InvestorBehaviorPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("");
  const [selectedLoan, setSelectedLoan] = useState<string>("");
  const [selectedClientType, setSelectedClientType] = useState<string>("");
  const [multiPropertyThreshold, setMultiPropertyThreshold] = useState<number>(5);

  const hasActiveFilters = Boolean(
    selectedCountry || selectedPurpose || selectedLoan || selectedClientType
  );

  const resetFilters = () => {
    setSelectedCountry("");
    setSelectedPurpose("");
    setSelectedLoan("");
    setSelectedClientType("");
  };

  // 1. Fetch Investor Behavior Analytics with display filters
  const {
    data: investorData,
    isLoading: isInvestorLoading,
    isError: isInvestorError,
    error: investorError,
    refetch: refetchInvestor,
  } = useQuery({
    queryKey: [
      "investor-behavior",
      selectedCountry,
      selectedPurpose,
      selectedLoan,
      selectedClientType,
    ],
    queryFn: () =>
      apiClient.getInvestorBehavior({
        country: selectedCountry || undefined,
        acquisition_purpose: selectedPurpose || undefined,
        loan_status: selectedLoan || undefined,
        client_type: selectedClientType || undefined,
      }),
  });

  // 2. Fetch Multi-Property Accumulator Analytics
  const {
    data: multiPropertyData,
    isLoading: isMultiPropertyLoading,
    isError: isMultiPropertyError,
    refetch: refetchMultiProperty,
  } = useQuery({
    queryKey: [
      "multi-property",
      multiPropertyThreshold,
      selectedCountry,
    ],
    queryFn: () =>
      apiClient.getMultiPropertyAnalytics({
        threshold: multiPropertyThreshold,
        country: selectedCountry || undefined,
      }),
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Investor Behavior & Portfolio Analytics
            </h1>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              Descriptive Intelligence
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comprehensive exploratory analysis of acquisition intent, mortgage financing leverage, capital deployment, and multi-unit accumulators
          </p>
        </div>

        {/* Global Action Refresh */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchInvestor();
              refetchMultiProperty();
            }}
            className="text-xs h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Display Filter Toolbar */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              <option value="">All Purposes (Home & Investment)</option>
              <option value="Home">Home Purchase (Primary)</option>
              <option value="Investment">Investment Acquisition</option>
            </select>

            {/* Financing Status Selector */}
            <select
              value={selectedLoan}
              onChange={(e) => setSelectedLoan(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Financing Structures</option>
              <option value="Yes">Mortgage Loan Backed</option>
              <option value="No">100% Cash / Unleveraged</option>
            </select>

            {/* Client Type Selector */}
            <select
              value={selectedClientType}
              onChange={(e) => setSelectedClientType(e.target.value)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">All Client Types</option>
              <option value="Individual">Individual Buyers (94.8%)</option>
              <option value="Company">Corporate / Entity Buyers (5.1%)</option>
            </select>
          </div>

          {/* Reset Filters */}
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
      </div>

      {/* Loading State */}
      {(isInvestorLoading || isMultiPropertyLoading) && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Calculating portfolio metrics, financial percentiles, and behavioral cross-tabulations...
          </p>
        </div>
      )}

      {/* Error State */}
      {(isInvestorError || isMultiPropertyError) && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Failed to load investor behavior analytics
          </div>
          <p className="mt-2 text-xs">
            {investorError instanceof Error
              ? investorError.message
              : "Unable to retrieve analytics from the backend service. Ensure the FastAPI service is running."}
          </p>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!isInvestorLoading && investorData && (
        <div className="space-y-6">
          {/* Section 1: Summary KPIs */}
          <InvestorKPIs summary={investorData.summary} />

          {/* Section 2: Financing Analysis & Cross-Tabulation */}
          <FinancingAnalysis
            financingByPurpose={investorData.financing_by_purpose}
            financingByCluster={investorData.financing_by_cluster}
            totalBuyers={investorData.summary.total_buyers}
          />

          {/* Section 3: Portfolio Size & Financial Distributions */}
          <PortfolioDistributions
            portfolioSizeDistribution={investorData.portfolio_size_distribution}
            spendPercentiles={investorData.spend_percentiles}
            pricePercentiles={investorData.price_percentiles}
            totalBuyers={investorData.summary.total_buyers}
          />

          {/* Section 4: Multi-Property Accumulator Focus */}
          {!isMultiPropertyLoading && multiPropertyData && (
            <MultiPropertySection
              analytics={multiPropertyData}
              activeThreshold={multiPropertyThreshold}
              onThresholdChange={setMultiPropertyThreshold}
              isLoading={isMultiPropertyLoading}
            />
          )}

          {/* Section 5: Behavioral & Structural Cohort Comparison */}
          <BehavioralComparison
            comparisonByCluster={investorData.comparison_by_cluster}
            comparisonByPurpose={investorData.comparison_by_purpose}
            comparisonByClientType={investorData.comparison_by_client_type}
          />
        </div>
      )}
    </div>
  );
}
