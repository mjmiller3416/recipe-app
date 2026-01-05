"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { plannerApi } from "@/lib/api";
import { PlannerEntryResponseDTO, MealSelectionResponseDTO } from "@/types";
import { MealDialog } from "./meal-dialog/MealDialog";
import { MealGrid } from "./MealGrid";
import { MealGridItem } from "./MealGridCard";
import { CompletedDropdown, CompletedMealItem } from "./CompletedDropdown";
import { SelectedMealCard } from "./meal-display/SelectedMealCard";
import { ChefHat } from "lucide-react";

// ============================================================================
// MEAL PLANNER PAGE COMPONENT
// ============================================================================

export function MealPlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for planner entries (not meals directly)
  const [entries, setEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [createDialogDefaultTab, setCreateDialogDefaultTab] = useState<"saved" | "create">("saved");
  const [mealRefreshKey, setMealRefreshKey] = useState(0);

  // Check for create=true URL parameter to auto-open dialog
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateDialog(true);
      // Clear the URL parameter without triggering a reload
      router.replace("/meal-planner", { scroll: false });
    }
  }, [searchParams, router]);

  // Fetch planner entries on mount
  useEffect(() => {
    async function fetchEntries() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await plannerApi.getEntries();
        setEntries(data);

        // Auto-select first uncompleted entry, or first entry if all completed
        if (data.length > 0 && selectedEntryId === null) {
          const firstUncompleted = data.find((e) => !e.is_completed);
          setSelectedEntryId(firstUncompleted?.id ?? data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load planner");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, []);

  // Get the selected entry to derive meal_id for SelectedMealCard
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const selectedMealId = selectedEntry?.meal_id ?? null;

  // Split entries into active and completed
  const activeEntries = entries.filter((e) => !e.is_completed);
  const completedEntries = entries.filter((e) => e.is_completed);

  // Transform active entries to MealGridItem format
  const gridItems: MealGridItem[] = activeEntries.map((entry) => ({
    id: entry.id,
    name: entry.meal_name ?? "Untitled Meal",
    imageUrl: entry.main_recipe?.reference_image_path ?? null,
    servings: entry.main_recipe?.servings ?? null,
    totalTime: entry.main_recipe?.total_time ?? null,
    isFavorite: entry.meal_is_favorite ?? false,
    excludeFromShopping: entry.exclude_from_shopping ?? false,
  }));

  // Transform completed entries to CompletedMealItem format
  const completedItems: CompletedMealItem[] = completedEntries.map((entry) => ({
    id: entry.id,
    name: entry.meal_name ?? "Untitled Meal",
    imageUrl: entry.main_recipe?.reference_image_path ?? null,
    servings: entry.main_recipe?.servings ?? null,
    totalTime: entry.main_recipe?.total_time ?? null,
    isFavorite: entry.meal_is_favorite ?? false,
  }));

  // Handle grid item selection
  const handleGridItemClick = (item: MealGridItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle completed item selection
  const handleCompletedItemClick = (item: CompletedMealItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle Add Meal button click - opens the dialog with Saved Meals tab
  const handleAddMealClick = () => {
    setCreateDialogDefaultTab("saved");
    setShowCreateDialog(true);
  };

  // Handle Create Meal button click - opens the dialog with Create Meal tab
  const handleCreateMealClick = () => {
    setCreateDialogDefaultTab("create");
    setShowCreateDialog(true);
  };

  // Handle entry created - add to entries list and select it
  const handleEntryCreated = (entry: PlannerEntryResponseDTO) => {
    setEntries((prev) => [...prev, entry]);
    setSelectedEntryId(entry.id);
    window.dispatchEvent(new Event("planner-updated"));
  };

  // Handle marking a meal as complete/incomplete (toggle)
  const handleMarkComplete = async () => {
    if (selectedEntryId === null) return;

    const previousEntries = entries;
    const currentEntry = entries.find((e) => e.id === selectedEntryId);
    if (!currentEntry) return;

    // Optimistic UI update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === selectedEntryId
          ? { ...entry, is_completed: !entry.is_completed }
          : entry
      )
    );

    try {
      const updatedEntry = await plannerApi.toggleCompletion(selectedEntryId);
      // Update with server response
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === selectedEntryId
            ? { ...entry, is_completed: updatedEntry.is_completed, completed_at: updatedEntry.completed_at }
            : entry
        )
      );
      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to update completion status");
    }
  };

  // Handle Edit Meal button click - opens the edit meal dialog
  const handleEditMeal = () => {
    if (selectedMealId) {
      setShowEditDialog(true);
    }
  };

  // Handle Add Side click - opens edit dialog
  const handleAddSide = () => {
    if (selectedMealId) {
      setShowEditDialog(true);
    }
  };

  // Handle meal updated - refresh entry data in local state
  const handleMealUpdated = (updatedMeal: MealSelectionResponseDTO) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.meal_id === updatedMeal.id
          ? {
              ...entry,
              meal_name: updatedMeal.meal_name,
              main_recipe: updatedMeal.main_recipe,
            }
          : entry
      )
    );
    // Trigger SelectedMealCard to re-fetch by changing its key
    setMealRefreshKey((prev) => prev + 1);
    window.dispatchEvent(new Event("planner-updated"));
  };

  const handleRemoveFromMenu = async () => {
    if (selectedEntryId === null) return;

    const previousEntries = entries;
    const entryToRemove = selectedEntryId;

    // Optimistic UI update
    const updatedEntries = entries.filter((e) => e.id !== entryToRemove);
    setEntries(updatedEntries);

    // Select next entry or null
    if (updatedEntries.length > 0) {
      const firstUncompleted = updatedEntries.find((e) => !e.is_completed);
      setSelectedEntryId(firstUncompleted?.id ?? updatedEntries[0].id);
    } else {
      setSelectedEntryId(null);
    }

    try {
      await plannerApi.removeEntry(entryToRemove);
      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setSelectedEntryId(entryToRemove);
      setError(err instanceof Error ? err.message : "Failed to remove from menu");
    }
  };

  // Handle toggling favorite status for the selected meal
  const handleToggleFavorite = async () => {
    if (!selectedMealId || selectedEntryId === null) return;

    const previousEntries = entries;

    // Optimistic UI update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === selectedEntryId
          ? { ...entry, meal_is_favorite: !entry.meal_is_favorite }
          : entry
      )
    );

    try {
      await plannerApi.toggleFavorite(selectedMealId);
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to update favorite status");
    }
  };

  // Handle toggling exclude from shopping for a meal
  const handleToggleExcludeFromShopping = async (item: MealGridItem) => {
    const previousEntries = entries;

    // Optimistic UI update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, exclude_from_shopping: !entry.exclude_from_shopping }
          : entry
      )
    );

    try {
      await plannerApi.toggleExcludeFromShopping(item.id);
      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to update shopping exclusion");
    }
  };

  // Handle clearing all completed entries
  const handleClearCompleted = async () => {
    const previousEntries = entries;
    const completedIds = entries.filter((e) => e.is_completed).map((e) => e.id);

    // Optimistic UI update
    const updatedEntries = entries.filter((e) => !e.is_completed);
    setEntries(updatedEntries);

    // Update selection if current selection was completed
    if (selectedEntryId && completedIds.includes(selectedEntryId)) {
      if (updatedEntries.length > 0) {
        setSelectedEntryId(updatedEntries[0].id);
      } else {
        setSelectedEntryId(null);
      }
    }

    try {
      await plannerApi.clearCompleted();
      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to clear completed");
    }
  };

  return (
    <PageLayout
      title="Meal Planner"
      description="Plan your weekly meals"
      actions={
        <div className="flex items-center gap-2">
          {/* Create Meal Button */}
          <Button
            onClick={handleCreateMealClick}
            variant="outline"
            className="gap-2"
          >
            <ChefHat className="h-4 w-4" strokeWidth={1.5} />
            Create Meal
          </Button>

          {/* Completed Dropdown */}
          <CompletedDropdown
            items={completedItems}
            onItemClick={handleCompletedItemClick}
            onClearCompleted={handleClearCompleted}
          />
        </div>
      }
    >
      {/* STACKED VERTICAL LAYOUT */}
      <div className="space-y-8 px-3">
        {/* TOP: MEAL GRID */}
        <MealGrid
          items={gridItems}
          selectedId={selectedEntryId}
          onItemClick={handleGridItemClick}
          onAddMealClick={handleAddMealClick}
          onToggleExcludeFromShopping={handleToggleExcludeFromShopping}
        />

        {/* BOTTOM: SELECTED MEAL CARD */}
        {selectedMealId !== null ? (
          <SelectedMealCard
            key={`meal-${selectedMealId}-${mealRefreshKey}`}
            mealId={selectedMealId}
            isCompleted={selectedEntry?.is_completed}
            isFavorite={selectedEntry?.meal_is_favorite}
            onMarkComplete={handleMarkComplete}
            onEditMeal={handleEditMeal}
            onToggleFavorite={handleToggleFavorite}
            onRemove={handleRemoveFromMenu}
            onAddSide={handleAddSide}
          />
        ) : (
          /* Empty state when no meals in planner */
          <div className="flex flex-col items-center justify-center text-center py-16 px-8">
            <div className="text-muted-foreground mb-6">
              <p className="text-lg font-medium mb-2">No meals planned yet</p>
              <p className="text-sm">
                Add a meal to your weekly menu to get started
              </p>
            </div>
            <Button onClick={handleAddMealClick} size="default">
              + Add Meal
            </Button>
          </div>
        )}
      </div>

      {/* Meal Dialog - unified create/edit */}
      <MealDialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
          }
        }}
        mode={showEditDialog ? "edit" : "create"}
        mealId={selectedMealId}
        defaultTab={createDialogDefaultTab}
        onEntryCreated={handleEntryCreated}
        onMealUpdated={handleMealUpdated}
      />
    </PageLayout>
  );
}
