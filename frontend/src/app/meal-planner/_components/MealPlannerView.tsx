"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { MealSelection } from "./meal-display/MealSelection";
import { WeeklyMenu, MenuListItem } from "./WeeklyMenu";
import { plannerApi } from "@/lib/api";
import { PlannerEntryResponseDTO, MealSelectionResponseDTO } from "@/types";
import { MealDialog } from "./meal-dialog/MealDialog";
import { Trash2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function MealPlannerPage() {
  // State for planner entries (not meals directly)
  const [entries, setEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [mealRefreshKey, setMealRefreshKey] = useState(0);

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

  // Get the selected entry to derive meal_id for MealSelection
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);
  const selectedMealId = selectedEntry?.meal_id ?? null;

  // Transform entries to MenuListItem format for WeeklyMenu
  const menuItems: MenuListItem[] = entries.map((entry) => ({
    id: entry.id,
    name: entry.meal_name ?? "Untitled Meal",
    imageUrl: entry.main_recipe?.reference_image_path ?? null,
    isCompleted: entry.is_completed,
    isFavorite: entry.meal_is_favorite ?? false,
  }));

  // Handle entry selection from WeeklyMenu
  const handleEntrySelect = (item: MenuListItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle Add Meal button click - opens the create meal dialog
  const handleAddMealClick = () => {
    setShowCreateDialog(true);
  };

  // Handle entry created - add to entries list and select it
  const handleEntryCreated = (entry: PlannerEntryResponseDTO) => {
    setEntries((prev) => [...prev, entry]);
    setSelectedEntryId(entry.id);
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

  // Handle empty side slot click - opens edit dialog
  const handleEmptySideSlotClick = () => {
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
    // Trigger MealSelection to re-fetch by changing its key
    setMealRefreshKey((prev) => prev + 1);
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
      setSelectedEntryId(updatedEntries[0].id);
    } else {
      setSelectedEntryId(null);
    }

    try {
      await plannerApi.removeEntry(entryToRemove);
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

  // Check if there are any completed entries
  const hasCompletedEntries = entries.some((e) => e.is_completed);

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
      fillViewport
      actions={
        hasCompletedEntries && (
          <Button
            onClick={handleClearCompleted}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Completed
          </Button>
        )
      }
    >
      {/* GRID CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_clamp(200px,30%,350px)] gap-6 h-full min-h-0">

        {/* LEFT COLUMN: SELECTED MEAL */}
        <div className="flex flex-col h-full min-h-0">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex-shrink-0">
            Selected Meal
          </h2>

          {selectedMealId !== null ? (
            <>
              <MealSelection key={`meal-${selectedMealId}-${mealRefreshKey}`} mealId={selectedMealId} isCompleted={selectedEntry?.is_completed} onEmptySideSlotClick={handleEmptySideSlotClick} className="flex-1" />

              {/* Footer - Action Buttons */}
              <div className="flex-shrink-0 pt-4 flex gap-4">
                <Button
                  onClick={handleMarkComplete}
                  size="xl"
                  className="flex-1"
                >
                  {selectedEntry?.is_completed ? "Mark Incomplete" : "Mark Complete"}
                </Button>
                <Button
                  onClick={handleEditMeal}
                  variant="outline"
                  size="xl"
                  className="flex-1"
                >
                  Edit Meal
                </Button>
                <Button
                  onClick={handleToggleFavorite}
                  variant="outline"
                  size="xl"
                  className="flex-1"
                >
                  <Heart className={cn(
                    "h-5 w-5 mr-2",
                    selectedEntry?.meal_is_favorite && "fill-current text-destructive"
                  )} />
                  {selectedEntry?.meal_is_favorite ? "Unfavorite" : "Favorite"}
                </Button>
                <Button
                  onClick={handleRemoveFromMenu}
                  variant="outline"
                  size="xl"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  Remove from Menu
                </Button>
              </div>
            </>
          ) : (
            /* Empty state when no meals in planner */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="text-muted-foreground mb-6">
                <p className="text-lg font-medium mb-2">No meals planned yet</p>
                <p className="text-sm">
                  Add a meal to your weekly menu to get started
                </p>
              </div>
              <Button onClick={handleAddMealClick} size="xl">
                + Create Meal
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: WEEKLY MENU */}
        <div className="hidden lg:flex flex-col h-full min-h-0">
          <WeeklyMenu
            items={menuItems}
            selectedId={selectedEntryId}
            onItemClick={handleEntrySelect}
            onAddMealClick={handleAddMealClick}
            className="h-full"
          />
        </div>
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
        onEntryCreated={handleEntryCreated}
        onMealUpdated={handleMealUpdated}
      />
    </PageLayout>
  );
}