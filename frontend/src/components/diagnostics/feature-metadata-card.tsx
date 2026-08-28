"use client";

import React from "react";
import { Sliders, CheckCircle2, XCircle, Layers, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeatureMetadataResponse } from "@/types/api";

export interface FeatureMetadataCardProps {
  metadata: FeatureMetadataResponse;
  className?: string;
}

export function FeatureMetadataCard({ metadata, className }: FeatureMetadataCardProps) {
  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Authoritative ML Feature Vector Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Dynamically retrieved preprocessing and feature matrix metadata used in K-Means distance calculations
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-mono dark:bg-indigo-950/40 dark:text-indigo-300">
            {metadata.total_feature_dimensions} Distance Dimensions
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Continuous Features */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Continuous Features ({metadata.numerical_features.length})
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {metadata.scaler_applied}
              </Badge>
            </div>
            <ul className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              {metadata.numerical_features.map((feat) => (
                <li key={feat} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorical Encodings */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-cyan-500" />
                Categorical Encodings ({metadata.categorical_features.length})
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                One-Hot Encoded
              </Badge>
            </div>
            <ul className="space-y-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              {metadata.categorical_features.map((cat) => (
                <li key={cat} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>{cat} {cat === "country" ? `(Top ${metadata.top_n_countries_encoded})` : ""}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Excluded Attributes */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                Excluded from ML Matrix ({metadata.excluded_features.length})
              </span>
              <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-mono">
                Safeguard
              </Badge>
            </div>
            <ul className="space-y-1 text-xs font-mono text-slate-500 dark:text-slate-500">
              {metadata.excluded_features.map((ex) => (
                <li key={ex} className="flex items-center gap-1.5">
                  <XCircle className="h-3 w-3 text-rose-400 shrink-0" />
                  <span>{ex} {ex === "gender" ? "(Excluded: Fairness)" : ex === "region" ? "(Excluded: High Cardinality)" : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature Dimension Breakdown */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                Authoritative 24-Dimension Input Order:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {metadata.feature_dimension_names.map((name) => (
                  <span
                    key={name}
                    className="inline-block px-1.5 py-0.5 rounded bg-white text-[10px] font-mono border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
