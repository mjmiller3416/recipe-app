"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
} from "@/components/layout/PageHeader";
import { plannerApi, ApiError } from "@/lib/api";
import type {
  PlannerEntryResponseDTO,
  PlannerSummaryDTO,
} from "@/types/index";
import {
  PlannerHeader,
  ActivePlanner,
  PlannerSkeleton,
} from "@/components";

// Toast notification component (simple inline implementation)
interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "error"
              ? "bg-error text-white"
              : "bg-success text-white"
          }`}
        >
          {toast.message}
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function MealPlannerPage() {
  // Data state
  const [entries, setEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [summary, setSummary] = useState<PlannerSummaryDTO | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch planner data
  const fetchPlannerData = useCallback(async () => {
    try {
      setError(null);
      const [entriesData, summaryData] = await Promise.all([
        plannerApi.getEntries(),
        plannerApi.getSummary(),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `Error: ${err.message}`
          : "Failed to load planner data";
      setError(message);
      console.error("Failed to fetch planner data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Toggle completion with optimistic update
  const handleToggleCompletion = useCallback(
    async (entryId: number) => {
      // Find the entry to toggle
      const entryIndex = entries.findIndex((e) => e.id === entryId);
      if (entryIndex === -1) return;

      const previousEntries = [...entries];
      const previousSummary = summary;

      // Optimistic update
      setTogglingIds((prev) => new Set(prev).add(entryId));
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                is_completed: !e.is_completed,
                completed_at: !e.is_completed ? new Date().toISOString() : null,
              }
            : e
        )
      );

      // Update summary optimistically
      if (summary) {
        const wasCompleted = entries[entryIndex].is_completed;
        setSummary({
          ...summary,
          completed_entries: wasCompleted
            ? summary.completed_entries - 1
            : summary.completed_entries + 1,
          incomplete_entries: wasCompleted
            ? summary.incomplete_entries + 1
            : summary.incomplete_entries - 1,
        });
      }

      try {
        await plannerApi.toggleCompletion(entryId);
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        setSummary(previousSummary);
        showToast("Failed to update completion status", "error");
        console.error("Failed to toggle completion:", err);
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    },
    [entries, summary, showToast]
  );

  // Remove entry with optimistic update
  const handleRemoveEntry = useCallback(
    async (entryId: number) => {
      const previousEntries = [...entries];
      const previousSummary = summary;
      const removedEntry = entries.find((e) => e.id === entryId);

      // Optimistic update
      setRemovingIds((prev) => new Set(prev).add(entryId));
      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      // Update summary optimistically
      if (summary && removedEntry) {
        const recipeCount = 1 + (removedEntry.side_recipe_ids?.length || 0);
        setSummary({
          ...summary,
          total_entries: summary.total_entries - 1,
          completed_entries: removedEntry.is_completed
            ? summary.completed_entries - 1
            : summary.completed_entries,
          incomplete_entries: removedEntry.is_completed
            ? summary.incomplete_entries
            : summary.incomplete_entries - 1,
          total_recipes: summary.total_recipes - recipeCount,
          is_at_capacity: false,
        });
      }

      try {
        await plannerApi.removeEntry(entryId);
        showToast("Meal removed from planner", "success");
      } catch (err) {
        // Rollback on error
        setEntries(previousEntries);
        setSummary(previousSummary);
        showToast("Failed to remove meal", "error");
        console.error("Failed to remove entry:", err);
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    },
    [entries, summary, showToast]
  );

  // Clear completed entries
  const handleClearCompleted = useCallback(async () => {
    setIsClearingCompleted(true);
    try {
      const result = await plannerApi.clearCompleted();
      if (result.success) {
        showToast(`Cleared ${result.affected_count} completed meals`, "success");
        await fetchPlannerData();
      } else {
        showToast(result.error || "Failed to clear completed meals", "error");
      }
    } catch (err) {
      showToast("Failed to clear completed meals", "error");
      console.error("Failed to clear completed:", err);
    } finally {
      setIsClearingCompleted(false);
    }
  }, [fetchPlannerData, showToast]);

  // Clear all entries
  const handleClearAll = useCallback(async () => {
    setIsClearingAll(true);
    try {
      const result = await plannerApi.clearAll();
      if (result.success) {
        showToast("Planner cleared", "success");
        setEntries([]);
        setSummary((prev) =>
          prev
            ? {
                ...prev,
                total_entries: 0,
                completed_entries: 0,
                incomplete_entries: 0,
                total_recipes: 0,
                meal_names: [],
                is_at_capacity: false,
              }
            : null
        );
      } else {
        showToast(result.error || "Failed to clear planner", "error");
      }
    } catch (err) {
      showToast("Failed to clear planner", "error");
      console.error("Failed to clear all:", err);
    } finally {
      setIsClearingAll(false);
    }
  }, [showToast]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle title="Meal Planner" />
          </PageHeaderContent>
        </PageHeader>
        <main className="container mx-auto px-4 py-6">
          <PlannerSkeleton />
        </main>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle title="Meal Planner" />
          </PageHeaderContent>
        </PageHeader>
        <main className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-error/30 bg-error/10 px-6 py-12 text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-error" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Unable to load planner
            </h3>
            <p className="mb-4 text-muted">{error}</p>
            <Button onClick={fetchPlannerData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle title="Meal Planner" />
        </PageHeaderContent>
      </PageHeader>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header with stats and actions */}
          <PlannerHeader
            summary={summary}
            onClearCompleted={handleClearCompleted}
            onClearAll={handleClearAll}
            isClearingCompleted={isClearingCompleted}
            isClearingAll={isClearingAll}
          />

          {/* Active planner list */}
          <ActivePlanner
            entries={entries}
            onToggleCompletion={handleToggleCompletion}
            onRemoveEntry={handleRemoveEntry}
            togglingIds={togglingIds}
            removingIds={removingIds}
          />
        </div>
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}