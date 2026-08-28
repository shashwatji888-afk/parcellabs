"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Globe2,
  Layers,
  LayoutDashboard,
  PieChart,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Executive Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "High-level market & portfolio KPIs",
  },
  {
    name: "Buyer Segmentation",
    href: "/segments",
    icon: PieChart,
    description: "2D/3D clusters & archetypes",
  },
  {
    name: "Investor Behavior",
    href: "/investors",
    icon: TrendingUp,
    description: "Multi-unit & leverage profiles",
  },
  {
    name: "Geographic Analysis",
    href: "/geography",
    icon: Globe2,
    description: "Country & regional intelligence",
  },
  {
    name: "Segment Insights",
    href: "/insights",
    icon: Layers,
    description: "Profiles, bounds & counter-evidence",
  },
  {
    name: "Model Diagnostics",
    href: "/diagnostics",
    icon: Sliders,
    description: "Candidate K & dendrogram linkage",
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-slate-200/80 bg-slate-900 text-slate-100 dark:border-slate-800 dark:bg-slate-950",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white">ParclLabs</span>
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
            Buyer Intelligence
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto" aria-label="Primary Navigation">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Analytics & Intelligence
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"
                )}
              />
              <div className="flex flex-col">
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Environment Info */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Engine
          </span>
          <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            v0.1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
