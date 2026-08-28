"use strict";
"use client";

import React from "react";
import { Layers, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ArchetypeInterpretation, ClusterProfile } from "@/types/api";
import { getClusterColor } from "@/components/segmentation/colors";

export interface SegmentSelectorTabsProps {
  clusterIds: number[];
  profiles: Record<number, ClusterProfile>;
  archetypes: Record<number, ArchetypeInterpretation>;
  selectedClusterId: number;
  onSelectCluster: (clusterId: number) => void;
  activeK: number;
  recommendedK: number;
  nicknames: Record<number, string>;
  className?: string;
}

export function SegmentSelectorTabs({
  clusterIds,
  profiles,
  archetypes,
  selectedClusterId,
  onSelectCluster,
  activeK,
  recommendedK,
  nicknames,
  className,
}: SegmentSelectorTabsProps) {
  return (
    <div className={`space-y-3 ${className || ""}`}>
      {/* Header & Model Classification */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Segment Partitions ({clusterIds.length} Cohorts)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {activeK === recommendedK ? (
            <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Recommended Operational Model (K={recommendedK})
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Exploratory Model Configuration (K={activeK})
            </Badge>
          )}
        </div>
      </div>

      {/* Cluster Tab Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {clusterIds.map((cId) => {
          const profile = profiles[cId];
          const arch = archetypes[cId];
          const color = getClusterColor(cId);
          const isSelected = selectedClusterId === cId;
          const userNick = nicknames[cId];
          const displayName = userNick || arch?.display_name || arch?.generated_name || `Cluster ${cId}`;
          const isMicro = arch?.is_micro_segment || (profile && profile.percentage < 4.0);

          return (
            <button
              key={cId}
              type="button"
              onClick={() => onSelectCluster(cId)}
              className={`text-left rounded-xl border p-3.5 transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "border-slate-900 bg-white ring-2 ring-slate-900/10 shadow-sm dark:border-slate-300 dark:bg-slate-900 dark:ring-slate-400/20"
                  : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-900"
              }`}
            >
              {/* Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color.hex }}
              />

              <div>
                <div className="flex items-center justify-between gap-1.5 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: color.hex }}
                    >
                      {cId}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]" title={displayName}>
                      {displayName}
                    </span>
                  </div>

                  {isMicro ? (
                    <Badge variant="warning" className="text-[9px] px-1 py-0 font-mono">
                      Micro
                    </Badge>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      {profile ? formatPercent(profile.percentage) : ""}
                    </span>
                  )}
                </div>

                {userNick && (
                  <div className="mt-1 text-[10px] text-slate-400 truncate">
                    Generated: {arch?.generated_name}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800/80">
                <span>{profile ? formatNumber(profile.count) : 0} buyers</span>
                <span className="text-[10px] text-slate-400">
                  {arch?.confidence ? arch.confidence.split(" ")[0] : "Cohort"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
