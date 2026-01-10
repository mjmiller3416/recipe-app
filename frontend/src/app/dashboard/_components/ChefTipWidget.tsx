"use client";

import { useEffect, useState, useCallback } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cookingTipApi } from "@/lib/api";

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
        // Debug logging for tip consistency testing
        console.log("[ChefTip]", new Date().toLocaleTimeString(), "Received:", data.tip);
        setTip(data.tip);
      }
    } catch (error) {
      console.error("Failed to fetch cooking tip:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch only - users can manually refresh if they want a new tip
  useEffect(() => {
    fetchTip();
  }, [fetchTip]);

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      fetchTip(true);
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
