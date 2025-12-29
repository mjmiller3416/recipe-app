"use client";

import { useEffect, useState, useCallback } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cookingTipApi } from "@/lib/api";

const REFRESH_INTERVAL = 60000; // 60 seconds

export function ChefTipWidget() {
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTip = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const data = await cookingTipApi.getTip();
      if (data.success && data.tip) {
        setTip(data.tip);
      }
    } catch (error) {
      console.error("Failed to fetch cooking tip:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTip();
  }, [fetchTip]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTip(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTip]);

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      fetchTip(true);
    }
  };

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border shadow-raised">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-chart-3" />
          <h3 className="text-sm font-medium text-foreground">Chef&apos;s Tip</h3>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="p-1 text-muted hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Refresh tip"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
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
        <p className="text-sm text-muted leading-relaxed">{tip}</p>
      )}
    </div>
  );
}
