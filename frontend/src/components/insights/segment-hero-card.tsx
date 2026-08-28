"use strict";
"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Edit3,
  Check,
  X,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ArchetypeInterpretation, ClusterProfile } from "@/types/api";
import { getClusterColor } from "@/components/segmentation/colors";

export interface SegmentHeroCardProps {
  clusterId: number;
  profile: ClusterProfile;
  archetype: ArchetypeInterpretation;
  activeK: number;
  silhouetteScore: number;
  nickname?: string;
  onSaveNickname: (clusterId: number, nickname: string) => void;
  onResetNickname: (clusterId: number) => void;
  className?: string;
}

export function SegmentHeroCard({
  clusterId,
  profile,
  archetype,
  activeK,
  silhouetteScore,
  nickname,
  onSaveNickname,
  onResetNickname,
  className,
}: SegmentHeroCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftNickname, setDraftNickname] = useState(nickname || "");

  const color = getClusterColor(clusterId);
  const isMicro = archetype.is_micro_segment || profile.percentage < 4.0;

  const handleStartEdit = () => {
    setDraftNickname(nickname || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmed = draftNickname.trim();
    if (trimmed) {
      onSaveNickname(clusterId, trimmed);
    } else {
      onResetNickname(clusterId);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftNickname(nickname || "");
    setIsEditing(false);
  };

  const handleReset = () => {
    onResetNickname(clusterId);
    setDraftNickname("");
    setIsEditing(false);
  };

  return (
    <Card className={`border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden relative ${className || ""}`}>
      {/* Top Accent Bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color.hex }} />

      <CardContent className="p-6 space-y-6">
        {/* Top Header: ID, Names & Edit Action */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: color.hex }}
              >
                {clusterId}
              </span>
              <Badge variant="outline" className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Cluster {clusterId}
              </Badge>

              {isMicro ? (
                <Badge variant="warning" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Exploratory Micro-Segment (&lt;4% Share)
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {archetype.confidence}
                </Badge>
              )}
            </div>

            {/* Editable Title Layer */}
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={draftNickname}
                  placeholder={`e.g. ${archetype.generated_name}`}
                  onChange={(e) => setDraftNickname(e.target.value)}
                  className="rounded-md border border-indigo-400 bg-white px-3 py-1.5 text-base font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-hidden dark:border-indigo-500 dark:bg-slate-950 dark:text-slate-100"
                  autoFocus
                />
                <Button size="sm" onClick={handleSave} className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                  <Check className="h-3.5 w-3.5 mr-1" /> Save Nickname
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 px-2.5 text-xs">
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                {nickname && (
                  <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 px-2 text-xs text-slate-500">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset to Generated
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {nickname || archetype.generated_name}
                </h2>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  {nickname ? "Edit Nickname" : "Set Custom Nickname"}
                </Button>
              </div>
            )}

            {/* Generated Name Subtitle if Custom Nickname is active */}
            {nickname && !isEditing && (
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Generated Archetype:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {archetype.generated_name}
                </span>
                <button
                  onClick={handleReset}
                  className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400 ml-1"
                >
                  (Reset)
                </button>
              </div>
            )}
          </div>

          {/* Scale Box */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 dark:bg-slate-950/40 dark:border-slate-800">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Cluster Population
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(profile.count)} <span className="text-xs font-normal text-slate-500">buyers</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Population Share
              </span>
              <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {formatPercent(profile.percentage)}
              </span>
            </div>
          </div>
        </div>

        {/* Short Thesis Statement */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Analytical Thesis
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {archetype.short_thesis}
              </p>
              {archetype.detailed_rationale && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {archetype.detailed_rationale}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Model Execution & Statistical Honesty Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="h-3 w-3 text-indigo-500" /> Active Model
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              K-Means++ (K={activeK} partitions)
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-500" /> Silhouette Score
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
              S = {silhouetteScore.toFixed(3)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <Info className="h-3 w-3 text-cyan-500" /> Feature Matrix
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              24 Features (StandardScaler)
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-amber-500" /> Statistical Nature
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Descriptive Analytical Cohort
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
