import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = "Failed to load analytical data",
  message,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="mt-1 text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:bg-rose-700 dark:hover:bg-rose-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}
