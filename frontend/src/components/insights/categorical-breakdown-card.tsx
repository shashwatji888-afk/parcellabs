"use strict";
"use client";

import React from "react";
import { PieChart, Globe, Users, Briefcase, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import { ClusterProfile } from "@/types/api";

export interface CategoricalBreakdownCardProps {
  profile: ClusterProfile;
  className?: string;
}

export function CategoricalBreakdownCard({ profile, className }: CategoricalBreakdownCardProps) {
  const cp = profile.categorical_profiles;

  const categories = [
    {
      key: "acquisition_purpose",
      title: "Acquisition Purpose",
      icon: Briefcase,
      data: cp.acquisition_purpose,
    },
    {
      key: "client_type",
      title: "Client Structure",
      icon: Users,
      data: cp.client_type,
    },
    {
      key: "country",
      title: "Geographic Origin",
      icon: Globe,
      data: cp.country,
    },
    {
      key: "referral_channel",
      title: "Referral Channel",
      icon: Share2,
      data: cp.referral_channel,
    },
  ];

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 ${className || ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <PieChart className="h-4 w-4 text-indigo-500" />
          Categorical Attribute Proportions vs Population Baseline
        </CardTitle>
        <CardDescription className="text-xs">
          Segment-specific categorical distributions and percentage-point (pp) deviations relative to baseline
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const data = cat.data;
            if (!data) return null;

            const Icon = cat.icon;
            const entries = Object.entries(data.category_distributions).sort(
              (a, b) => b[1] - a[1]
            );

            return (
              <div
                key={cat.key}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-2 dark:border-slate-800">
                  <Icon className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {cat.title}
                  </span>
                </div>

                <div className="space-y-2">
                  {entries.slice(0, 5).map(([category, prop]) => {
                    const pct = prop * 100;
                    const popProp = (data.population_distributions[category] || 0) * 100;
                    const ppDiff = data.percentage_point_diff[category] !== undefined
                      ? data.percentage_point_diff[category] * 100
                      : pct - popProp;

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={category}>
                            {category}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {formatPercent(pct)}
                            </span>
                            <span
                              className={`text-[10px] ${
                                ppDiff > 1
                                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : ppDiff < -1
                                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-slate-400"
                              }`}
                            >
                              ({ppDiff >= 0 ? `+${ppDiff.toFixed(1)}` : ppDiff.toFixed(1)} pp)
                            </span>
                          </div>
                        </div>

                        {/* Visual Proportion Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            style={{ width: `${Math.min(pct, 100)}%` }}
                            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
