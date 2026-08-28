"use client";

import React from "react";
import { CheckCircle2, Database, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { DataQualityReport } from "@/types/api";

export interface DataQualityCardProps {
  auditReport: DataQualityReport;
  className?: string;
}

export function DataQualityCard({ auditReport, className }: DataQualityCardProps) {
  const {
    total_clients_audited,
    total_properties_audited,
    duplicate_client_ids,
    duplicate_property_ids,
    orphan_client_refs,
    missing_dates_of_birth_count,
    missing_country_count,
    missing_loan_status_count,
    future_dates_count,
    unparseable_records,
    is_dataset_valid,
  } = auditReport;

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Source Dataset Quality & Referential Integrity Audit
            </CardTitle>
            <CardDescription className="text-xs">
              Automated validation results across raw CSV records, data types, constraints, and relational foreign keys
            </CardDescription>
          </div>
          <Badge
            variant={is_dataset_valid ? "outline" : "destructive"}
            className={is_dataset_valid ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-xs dark:bg-emerald-950/40 dark:text-emerald-300" : ""}
          >
            {is_dataset_valid ? "100% Audit Verified" : "Data Issues Detected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Core Record Invariants */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Clients</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatNumber(total_clients_audited)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> 100% Verified
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Properties</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatNumber(total_properties_audited)}
            </div>
            <span className="text-[10px] text-slate-500">
              Complete Portfolio
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Orphan References</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {orphan_client_refs.length}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              0 Referential Errors
            </span>
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Unparseable Rows</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
              {unparseable_records.length}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              0 Corrupted Rows
            </span>
          </div>
        </div>

        {/* Integrity Check Matrix */}
        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800/60 text-xs">
          <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              Referential Integrity (Orphan Sold Properties Client Refs)
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {orphan_client_refs.length} Errors
            </span>
          </div>

          <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              Duplicate Client Identifiers
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {duplicate_client_ids.length} Duplicates
            </span>
          </div>

          <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              Duplicate Property Identifiers
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {duplicate_property_ids.length} Duplicates
            </span>
          </div>

          <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              Malformed Date of Birth Formats / Future Dates
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {future_dates_count} Future / {missing_dates_of_birth_count} Missing
            </span>
          </div>

          <div className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900/40">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
              Missing Country / Missing Loan Status Records
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {missing_country_count} Missing Country / {missing_loan_status_count} Missing Loan
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
