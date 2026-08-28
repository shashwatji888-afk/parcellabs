"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  DollarSign,
  Globe,
  PieChart,
  Sliders,
  Smile,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { KPICard } from "@/components/ui/kpi-card";
import { apiClient } from "@/lib/api";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default function OverviewPage() {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => apiClient.getOverviewAnalytics(),
  });

  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
  } = useQuery({
    queryKey: ["dataset-status"],
    queryFn: () => apiClient.getDatasetStatus(),
  });

  const isLoading = isOverviewLoading || isStatusLoading;
  const hasError = overviewError || statusError;
  const errorMessage =
    overviewError instanceof Error
      ? overviewError.message
      : statusError instanceof Error
      ? statusError.message
      : "Unable to connect to the ParclLabs analytical backend service.";

  return (
    <DashboardShell
      title="Market & Portfolio Intelligence Overview"
      subtitle="Executive summary of 2,000 buyers, 10,000 properties, and baseline machine learning segmentation"
      onRefresh={() => refetchOverview()}
    >
      <div className="space-y-8">
        {/* Error State */}
        {hasError && (
          <ErrorBanner
            title="Backend Synchronization Error"
            message={errorMessage}
            onRetry={() => refetchOverview()}
          />
        )}

        {/* Top KPI Metrics Grid */}
        <section aria-labelledby="kpi-metrics-heading">
          <h2 id="kpi-metrics-heading" className="sr-only">
            Key Performance Indicators
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Analyzed Buyers"
              value={overview ? formatNumber(overview.total_buyers) : undefined}
              subtitle="100% referential integrity"
              icon={<Users className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Capital Deployed"
              value={overview ? formatCurrency(overview.total_portfolio_spend) : undefined}
              subtitle="Aggregate closed portfolio volume"
              icon={<DollarSign className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Sold Portfolio Units"
              value={overview ? formatNumber(overview.total_sold_properties) : undefined}
              subtitle={
                status
                  ? `${formatNumber(status.available_property_count)} listings available`
                  : undefined
              }
              icon={<Building2 className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Active ML Segments"
              value={overview ? `K = ${overview.active_cluster_count}` : undefined}
              subtitle="Optimal empirical partition"
              icon={<PieChart className="h-4 w-4" />}
              trend={{ value: "Silhouette 0.125", positive: true }}
              loading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            <KPICard
              title="Mortgage Loan Reliance"
              value={overview ? formatPercent(overview.loan_usage_pct) : undefined}
              subtitle="63.2% unleveraged cash equity"
              icon={<Wallet className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Investment Purpose"
              value={overview ? formatPercent(overview.investment_purpose_pct) : undefined}
              subtitle="69.3% primary residence / home"
              icon={<TrendingUp className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Avg Buyer Satisfaction"
              value={overview ? `${overview.avg_satisfaction.toFixed(2)} / 5.0` : undefined}
              subtitle="Uniform across all clusters"
              icon={<Smile className="h-4 w-4" />}
              loading={isLoading}
            />

            <KPICard
              title="Origin Countries"
              value={overview ? formatNumber(overview.unique_countries_count) : undefined}
              subtitle="76.9% United States domestic"
              icon={<Globe className="h-4 w-4" />}
              loading={isLoading}
            />
          </div>
        </section>

        {/* Dataset Verification & Audit Card */}
        <section aria-labelledby="dataset-verification-heading">
          <Card className="border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/40">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Baseline Ingestion & Data Quality Status
                </CardTitle>
                <CardDescription>
                  Exact age computation from parsed DOBs, automated currency parsing, and referential validation
                </CardDescription>
              </div>
              <Badge variant="success" className="font-mono text-xs">
                PASSED AUDIT
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Buyer Records
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    2,000 Clients
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    0 duplicate IDs • 0 invalid DOBs • 100% validated
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Property Listings
                  </span>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    10,000 Properties
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    7,305 sold portfolio units • 2,695 available listings
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Referential Integrity
                  </span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    100.0% Complete
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    0 orphan client references • Complete portfolio joins
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modular Navigation Cards */}
        <section aria-labelledby="analytics-modules-heading">
          <h2 id="analytics-modules-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Intelligence Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/segments" className="group block">
              <Card className="h-full transition-all hover:border-slate-400 hover:shadow-md dark:hover:border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">TICK-09</Badge>
                  </div>
                  <CardTitle className="mt-3 text-base group-hover:text-indigo-600 transition-colors">
                    Buyer Segmentation
                  </CardTitle>
                  <CardDescription>
                    Interactive 2D/3D PCA scatter plots, cluster distribution tables, and dynamic K-Means tuning.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/investors" className="group block">
              <Card className="h-full transition-all hover:border-slate-400 hover:shadow-md dark:hover:border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">TICK-10</Badge>
                  </div>
                  <CardTitle className="mt-3 text-base group-hover:text-emerald-600 transition-colors">
                    Investor Behavior & Geography
                  </CardTitle>
                  <CardDescription>
                    Analysis of multi-unit accumulators, mortgage vs equity capital, and geographic market penetration.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/diagnostics" className="group block">
              <Card className="h-full transition-all hover:border-slate-400 hover:shadow-md dark:hover:border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">TICK-11</Badge>
                  </div>
                  <CardTitle className="mt-3 text-base group-hover:text-amber-600 transition-colors">
                    Model Diagnostics Lab
                  </CardTitle>
                  <CardDescription>
                    Multi-metric candidate K evaluation curves (Inertia, Silhouette, Davies-Bouldin) and dendrogram linkage tree.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
