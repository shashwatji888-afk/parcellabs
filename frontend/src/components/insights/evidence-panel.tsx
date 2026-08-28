"use strict";
"use client";

import React from "react";
import { CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArchetypeInterpretation, ClusterProfile } from "@/types/api";

export interface EvidencePanelProps {
  archetype: ArchetypeInterpretation;
  profile: ClusterProfile;
  className?: string;
}

export function EvidencePanel({ archetype, profile, className }: EvidencePanelProps) {
  const diffFeatures = profile.differentiating_features || [];
  const neglFeatures = profile.negligible_features || [];
  const rejections = Object.entries(archetype.rejection_reasons || {});

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className || ""}`}>
      {/* 1. Supporting Empirical Evidence ("Why this segment?") */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Supporting Empirical Evidence (&quot;Why this segment?&quot;)
          </CardTitle>
          <CardDescription className="text-xs">
            Measurable mathematical deviations and behavioral traits driving this cluster formation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2.5">
            {archetype.supporting_evidence.map((bullet, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 text-xs text-slate-800 dark:border-emerald-950/60 dark:bg-emerald-950/20 dark:text-slate-200"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5 dark:bg-emerald-900 dark:text-emerald-300">
                  {idx + 1}
                </span>
                <span className="leading-relaxed font-medium">{bullet}</span>
              </li>
            ))}
          </ul>

          {/* Differentiating Feature Badges */}
          {diffFeatures.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Primary Differentiating Features (|Z| ≥ 0.35)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {diffFeatures.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 font-mono dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Counter-Evidence & Interpretive Guardrails */}
      <Card className="border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Counter-Evidence & Analytical Guardrails
          </CardTitle>
          <CardDescription className="text-xs">
            Boundary conditions preventing over-interpretation or unsupported business claims
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {archetype.counter_evidence.length > 0 ? (
            <ul className="space-y-2.5">
              {archetype.counter_evidence.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/30 p-3 text-xs text-slate-800 dark:border-amber-950/60 dark:bg-amber-950/20 dark:text-slate-200"
                >
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30">
              No material negative counter-evidence identified for this partition.
            </div>
          )}

          {/* Rejected Archetype Hypotheses */}
          {rejections.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Rejected Hypothetical Personas
              </span>
              <div className="space-y-1.5">
                {rejections.map(([claim, reason]) => (
                  <div
                    key={claim}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-2 text-xs dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="line-through text-slate-400">{claim}</span>
                      <span className="text-[10px] text-rose-500 uppercase font-mono ml-1.5">Rejected</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negligible Separation Features */}
          {neglFeatures.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Features with Negligible Deviation (|Z| &lt; 0.15)
              </span>
              <div className="flex flex-wrap gap-1">
                {neglFeatures.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 font-mono dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
