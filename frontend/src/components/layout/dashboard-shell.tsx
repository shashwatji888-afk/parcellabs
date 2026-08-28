"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export interface DashboardShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  onRefresh,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Primary Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} subtitle={subtitle} onRefresh={onRefresh} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
