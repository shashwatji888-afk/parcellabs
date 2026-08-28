import Link from "next/link";
import { ArchetypeInterpretation, ClusterProfile } from "@/types/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClusterColor } from "@/components/segmentation/colors";
import { formatCurrency, formatNumber, formatPercent, cn } from "@/lib/utils";
import { Check, ShieldCheck, AlertTriangle, ArrowUpRight } from "lucide-react";

export interface ClusterComparisonCardsProps {
  profiles: Record<number, ClusterProfile>;
  archetypes: Record<number, ArchetypeInterpretation>;
  selectedClusterId: number | null;
  onSelectCluster: (clusterId: number | null) => void;
  activeK?: number;
  className?: string;
}

export function ClusterComparisonCards({
  profiles,
  archetypes,
  selectedClusterId,
  onSelectCluster,
  activeK = 3,
  className,
}: ClusterComparisonCardsProps) {
  const clusterIds = Object.keys(profiles)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Identified Segment Archetypes ({clusterIds.length} Clusters)
        </h3>
        {selectedClusterId !== null && (
          <button
            type="button"
            onClick={() => onSelectCluster(null)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Reset Filter (Show All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clusterIds.map((cId) => {
          const profile = profiles[cId];
          const arch = archetypes[cId];
          const color = getClusterColor(cId);
          const isSelected = selectedClusterId === cId;
          const isDimmed = selectedClusterId !== null && !isSelected;

          const numP = profile?.numerical_profiles || {};
          const spendMean = numP.total_spend?.mean || 0;
          const priceMean = numP.avg_price_per_unit?.mean || 0;
          const loanMean = numP.loan_applied_binary?.mean || 0;
          const propsMean = numP.total_properties?.mean || 0;

          return (
            <Card
              key={cId}
              onClick={() => onSelectCluster(isSelected ? null : cId)}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 relative overflow-hidden",
                isSelected && "ring-2 ring-slate-900 border-transparent shadow-md dark:ring-slate-400",
                isDimmed && "opacity-50 hover:opacity-80"
              )}
            >
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: color.hex }}
              />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs"
                      style={{ backgroundColor: color.hex }}
                    >
                      {cId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {arch?.display_name || arch?.generated_name || `Cluster ${cId}`}
                    </h4>
                  </div>
                  {isSelected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatNumber(profile.count)} buyers
                  </span>
                  <Badge variant={arch?.is_micro_segment ? "warning" : "secondary"} className="text-[10px] py-0 px-1.5 font-mono">
                    {profile.percentage.toFixed(1)}% share
                  </Badge>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {arch?.short_thesis || "Behavioral cluster partition."}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Avg Spend</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(spendMean)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Price / Unit</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(priceMean)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mean Units</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {propsMean.toFixed(1)} properties
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Loan Reliance</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatPercent(loanMean * 100)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  {arch?.confidence && (
                    <div className="flex items-center gap-1.5">
                      {arch.is_micro_segment ? (
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      )}
                      <span>{arch.confidence}</span>
                    </div>
                  )}

                  <Link
                    href={`/insights?clusterId=${cId}&k=${activeK}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-700 font-semibold hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 ml-auto"
                  >
                    Deep-Dive <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
