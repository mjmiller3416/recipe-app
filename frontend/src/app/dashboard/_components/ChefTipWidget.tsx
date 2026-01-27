"use client";

import { Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCookingTip, useRefreshCookingTip } from "@/hooks/api";

export function ChefTipWidget() {
  const { data, isLoading, isFetching, refetch } = useCookingTip();
  const refreshTip = useRefreshCookingTip();

  const tip = data?.success && data.tip ? data.tip : null;
  const isRefreshing = isFetching && !isLoading;

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      refreshTip();
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border shadow-raised">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-chart-3" />
          <h2 className="text-lg font-semibold text-foreground">Chef&apos;s Tip</h2>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-50"
          aria-label="Refresh tip"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Tip Content */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
      )}
    </div>
  );
}
