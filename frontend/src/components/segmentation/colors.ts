export interface ClusterColor {
  id: number;
  hex: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
}

export const CLUSTER_COLORS: Record<number, ClusterColor> = {
  0: {
    id: 0,
    hex: "#3b82f6", // Blue
    name: "Blue",
    badgeBg: "bg-blue-50 dark:bg-blue-950/50",
    badgeText: "text-blue-700 dark:text-blue-400",
    dotBg: "bg-blue-500",
  },
  1: {
    id: 1,
    hex: "#10b981", // Emerald
    name: "Emerald",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/50",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    dotBg: "bg-emerald-500",
  },
  2: {
    id: 2,
    hex: "#f59e0b", // Amber
    name: "Amber",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    badgeText: "text-amber-700 dark:text-amber-400",
    dotBg: "bg-amber-500",
  },
  3: {
    id: 3,
    hex: "#8b5cf6", // Purple
    name: "Purple",
    badgeBg: "bg-purple-50 dark:bg-purple-950/50",
    badgeText: "text-purple-700 dark:text-purple-400",
    dotBg: "bg-purple-500",
  },
  4: {
    id: 4,
    hex: "#ec4899", // Pink
    name: "Pink",
    badgeBg: "bg-pink-50 dark:bg-pink-950/50",
    badgeText: "text-pink-700 dark:text-pink-400",
    dotBg: "bg-pink-500",
  },
  5: {
    id: 5,
    hex: "#06b6d4", // Cyan
    name: "Cyan",
    badgeBg: "bg-cyan-50 dark:bg-cyan-950/50",
    badgeText: "text-cyan-700 dark:text-cyan-400",
    dotBg: "bg-cyan-500",
  },
  6: {
    id: 6,
    hex: "#f97316", // Orange
    name: "Orange",
    badgeBg: "bg-orange-50 dark:bg-orange-950/50",
    badgeText: "text-orange-700 dark:text-orange-400",
    dotBg: "bg-orange-500",
  },
  7: {
    id: 7,
    hex: "#64748b", // Slate
    name: "Slate",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeText: "text-slate-700 dark:text-slate-300",
    dotBg: "bg-slate-500",
  },
  8: {
    id: 8,
    hex: "#14b8a6", // Teal
    name: "Teal",
    badgeBg: "bg-teal-50 dark:bg-teal-950/50",
    badgeText: "text-teal-700 dark:text-teal-400",
    dotBg: "bg-teal-500",
  },
  9: {
    id: 9,
    hex: "#e11d48", // Rose
    name: "Rose",
    badgeBg: "bg-rose-50 dark:bg-rose-950/50",
    badgeText: "text-rose-700 dark:text-rose-400",
    dotBg: "bg-rose-500",
  },
};

export function getClusterColor(clusterId: number): ClusterColor {
  return CLUSTER_COLORS[clusterId % 10] || CLUSTER_COLORS[0];
}
