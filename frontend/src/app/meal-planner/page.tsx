"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  MealSelectionResponseDTO,
} from "@/types/index";
import {
  PlannerHeader,
  ActivePlanner,
  PlannerSkeleton,
  MealLibrary,
  MobileTabNav,
  MealFormModal,
} from "./components";
import type { MobileTab } from "./components";
import { cn } from "@/lib/utils";

// ============================================================================
// Toast Notification Component
// ============================================================================

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
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
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 hover:opacity-70"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function MealPlannerPage() {
  // Data state
  const [entries, setEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [summary, setSummary] = useState<PlannerSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [isClearingCompleted, setIsClearingCompleted] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("planner");
  
  // Modal state (Phase 3)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealSelectionResponseDTO | null>(null);
  const [mealLibraryRefreshTrigger, setMealLibraryRefreshTrigger] = useState(0);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Get set of meal IDs currently in planner
  const mealIdsInPlanner = useMemo(() => {
    return new Set(entries.map((e) => e.meal_id));
  }, [entries]);

  // Get all existing tags from meals for autocomplete
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [entries]);

  // Show toast notification
  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Dismiss toast
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
        err instanceof ApiError ? err.message : "Failed to load planner data";
      setError(message);
      console.error("Failed to fetch planner data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Toggle entry completion
  const handleToggleCompletion = useCallback(
    async (entryId: number) => {
      // Prevent double-toggling
      if (togglingIds.has(entryId)) return;
      setTogglingIds((prev) => new Set([...prev, entryId]));

      // Optimistic update
      const previousEntries = entries;
      const previousSummary = summary;

      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, is_completed: !e.is_completed } : e
        )
      );

      // Update summary optimistically
      const toggledEntry = entries.find((e) => e.id === entryId);
      if (toggledEntry && summary) {
        setSummary({
          ...summary,
          completed_entries: toggledEntry.is_completed
            ? summary.completed_entries - 1
            : summary.completed_entries + 1,
          incomplete_entries: toggledEntry.is_completed
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
    [entries, summary, togglingIds, showToast]
  );

  // Remove entry from planner
  const handleRemoveEntry = useCallback(
    async (entryId: number) => {
      // Prevent double-removing
      if (removingIds.has(entryId)) return;
      setRemovingIds((prev) => new Set([...prev, entryId]));

      // Optimistic update
      const previousEntries = entries;
      const previousSummary = summary;
      const removedEntry = entries.find((e) => e.id === entryId);

      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      // Update summary optimistically
      if (removedEntry && summary) {
        const recipeCount =
          1 + (removedEntry.side_recipe_ids?.length || 0);
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
    [entries, summary, removingIds, showToast]
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

  // Handle meal added from library
  const handleMealAdded = useCallback(
    async (added: { meal_id: number; meal_name: string }) => {
      // Refetch planner data to get the new entry
      await fetchPlannerData();
    },
    [fetchPlannerData]
  );

  // =========================================================================
  // Phase 3: Modal Handlers
  // =========================================================================

  // Open create modal
  const handleCreateMeal = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  // Open edit modal
  const handleEditMeal = useCallback((meal: MealSelectionResponseDTO) => {
    setEditingMeal(meal);
    setEditModalOpen(true);
  }, []);

  // Handle meal created
  const handleMealCreated = useCallback(
    async (meal: MealSelectionResponseDTO, addedToPlanner?: boolean) => {
      showToast(`Created "${meal.meal_name}"`, "success");
      
      // Refresh meal library
      setMealLibraryRefreshTrigger((prev) => prev + 1);
      
      // If added to planner, refresh planner data too
      if (addedToPlanner) {
        await fetchPlannerData();
        showToast(`Added "${meal.meal_name}" to planner`, "success");
      }
    },
    [fetchPlannerData, showToast]
  );

  // Handle meal updated
  const handleMealUpdated = useCallback(
    async (meal: MealSelectionResponseDTO) => {
      showToast(`Updated "${meal.meal_name}"`, "success");
      
      // Refresh meal library
      setMealLibraryRefreshTrigger((prev) => prev + 1);
      
      // If meal is in planner, refresh planner data to reflect changes
      if (mealIdsInPlanner.has(meal.id)) {
        await fetchPlannerData();
      }
    },
    [fetchPlannerData, mealIdsInPlanner, showToast]
  );

  // Handle meal deleted
  const handleMealDeleted = useCallback(
    async (mealId: number) => {
      showToast("Meal deleted", "success");
      
      // Refresh meal library
      setMealLibraryRefreshTrigger((prev) => prev + 1);
      
      // If meal was in planner, refresh planner data
      if (mealIdsInPlanner.has(mealId)) {
        await fetchPlannerData();
      }
    },
    [fetchPlannerData, mealIdsInPlanner, showToast]
  );

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
        {/* Header with stats and actions */}
        <PlannerHeader
          summary={summary}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          isClearingCompleted={isClearingCompleted}
          isClearingAll={isClearingAll}
        />

        {/* Mobile tab navigation - hidden on desktop */}
        <div className="lg:hidden mt-6">
          <MobileTabNav
            activeTab={mobileTab}
            onTabChange={setMobileTab}
            plannerCount={entries.length}
          />
        </div>

        {/* Main content area - responsive layout */}
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Active Planner - 65% on desktop, full on mobile when selected */}
          <div
            className={cn(
              "w-full lg:w-[65%]",
              mobileTab !== "planner" && "hidden lg:block"
            )}
          >
            <ActivePlanner
              entries={entries}
              onToggleCompletion={handleToggleCompletion}
              onRemoveEntry={handleRemoveEntry}
              togglingIds={togglingIds}
              removingIds={removingIds}
            />
          </div>

          {/* Meal Library Sidebar - 35% on desktop, full on mobile when selected */}
          <div
            className={cn(
              "w-full lg:w-[35%]",
              mobileTab !== "library" && "hidden lg:block"
            )}
          >
            <MealLibrary
              mealIdsInPlanner={mealIdsInPlanner}
              onMealAdded={handleMealAdded}
              showToast={showToast}
              isAtCapacity={summary?.is_at_capacity || false}
              onCreateMeal={handleCreateMeal}
              onEditMeal={handleEditMeal}
              refreshTrigger={mealLibraryRefreshTrigger}
            />
          </div>
        </div>
      </main>

      {/* Phase 3: Create Meal Modal */}
      <MealFormModal
        mode="create"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleMealCreated}
        existingTags={existingTags}
      />

      {/* Phase 3: Edit Meal Modal */}
      <MealFormModal
        mode="edit"
        meal={editingMeal}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingMeal(null);
        }}
        onSuccess={handleMealUpdated}
        onDelete={handleMealDeleted}
        existingTags={existingTags}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}