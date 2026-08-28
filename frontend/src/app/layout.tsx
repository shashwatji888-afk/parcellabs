import type { Metadata } from "next";
import { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ParclLabs — Real Estate Buyer Intelligence Platform",
  description: "Machine Learning Based Buyer Segmentation and Investment Profiling for Real Estate Market Intelligence",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
