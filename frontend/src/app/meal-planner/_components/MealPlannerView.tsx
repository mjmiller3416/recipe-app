"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { plannerApi } from "@/lib/api";
import { PlannerEntryResponseDTO, MealSelectionResponseDTO } from "@/types";
import { MealDialog } from "./meal-dialog/MealDialog";
import { MealGrid } from "./MealGrid";
import { MealGridItem } from "./MealGridCard";
import { CompletedDropdown, CompletedMealItem } from "./CompletedDropdown";
import { SelectedMealCard } from "./meal-display/SelectedMealCard";
import { RecipePickerDialog } from "./RecipePickerDialog";
import { MealPreviewDialog } from "./MealPreviewDialog";
import { AlertTriangle, ChefHat } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import type { RecipeCardData } from "@/types";

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [mealRefreshKey, setMealRefreshKey] = useState(0);

  // Dialog orchestration state for meal creation flow
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showMealPreview, setShowMealPreview] = useState(false);
  const [pickerMode, setPickerMode] = useState<"main" | "side">("main");
  const [pendingMain, setPendingMain] = useState<RecipeCardData | null>(null);
  const [pendingSides, setPendingSides] = useState<RecipeCardData[]>([]);
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Track if user has started meal creation (selected a main dish)
  const hasPendingMeal = !!pendingMain;

  // Helper to reset meal creation state
  const resetMealCreation = useCallback(() => {
    setPendingMain(null);
    setPendingSides([]);
    setShowMealPreview(false);
    setShowRecipePicker(false);
  }, []);

  // Unsaved changes hook - handles browser nav and sidebar via SafeLink
  const {
    showLeaveDialog,
    setShowLeaveDialog,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty: hasPendingMeal,
    onConfirmLeave: resetMealCreation,
  });

  // Check for create=true URL parameter and redirect to create page
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      router.replace("/meal-planner/create");
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
    bannerImageUrl: entry.main_recipe?.banner_image_path ?? null,
    servings: entry.main_recipe?.servings ?? null,
    totalTime: entry.main_recipe?.total_time ?? null,
    isSaved: entry.meal_is_saved ?? false,
    shoppingMode: entry.shopping_mode ?? "all",
  }));

  // Transform completed entries to CompletedMealItem format
  const completedItems: CompletedMealItem[] = completedEntries.map((entry) => ({
    id: entry.id,
    name: entry.meal_name ?? "Untitled Meal",
    imageUrl: entry.main_recipe?.reference_image_path ?? null,
    servings: entry.main_recipe?.servings ?? null,
    totalTime: entry.main_recipe?.total_time ?? null,
  }));

  // Handle grid item selection
  const handleGridItemClick = (item: MealGridItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle completed item selection
  const handleCompletedItemClick = (item: CompletedMealItem) => {
    setSelectedEntryId(item.id);
  };

  // Handle Add Meal button click - opens the meal preview dialog first
  const handleAddMealClick = () => {
    // Reset state for new meal creation
    setPendingMain(null);
    setPendingSides([]);
    setPickerMode("main");
    setShowMealPreview(true);
  };

  // Handle Create Meal button click - opens the meal preview dialog first
  const handleCreateMealClick = () => {
    // Reset state for new meal creation
    setPendingMain(null);
    setPendingSides([]);
    setPickerMode("main");
    setShowMealPreview(true);
  };

  // Handle selecting a main dish from the preview dialog
  const handleSelectMainFromPreview = () => {
    setPickerMode("main");
    setShowMealPreview(false);
    setShowRecipePicker(true);
  };

  // Handle recipe selection in the picker dialog
  const handleRecipeSelect = (recipe: RecipeCardData) => {
    if (pickerMode === "main") {
      // Selected a main dish - go to preview
      setPendingMain(recipe);
      setShowRecipePicker(false);
      setShowMealPreview(true);
    } else {
      // Selecting sides - toggle in the array (can select multiple)
      setPendingSides((prev) => {
        const isSelected = prev.some((s) => s.id === recipe.id);
        if (isSelected) {
          // Remove if already selected
          return prev.filter((s) => s.id !== recipe.id);
        }
        // Add if not at max (3 sides)
        if (prev.length >= 3) return prev;
        return [...prev, recipe];
      });
    }
  };

  // Handle "Add Sides" button click from preview dialog
  const handleAddSidesClick = () => {
    setPickerMode("side");
    setShowMealPreview(false);
    setShowRecipePicker(true);
  };

  // Handle "Done" button click when finished selecting sides
  const handleSidesDone = () => {
    setShowRecipePicker(false);
    setShowMealPreview(true);
  };

  // Handle picker dialog close - always return to preview dialog
  const handlePickerClose = (open: boolean) => {
    if (!open) {
      setShowRecipePicker(false);
      // Always go back to preview dialog (user can close from there)
      setShowMealPreview(true);
    }
  };

  // Handle meal preview dialog close - show confirmation if meal is in progress
  const handleMealPreviewClose = (open: boolean) => {
    if (!open && hasPendingMeal) {
      // User trying to close with a meal in progress - show confirmation
      setShowDiscardDialog(true);
    } else {
      setShowMealPreview(open);
    }
  };

  // Confirm discarding meal creation
  const handleConfirmDiscard = () => {
    setShowDiscardDialog(false);
    resetMealCreation();
  };

  // Cancel discarding - stay in meal creation
  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
  };

  // Handle removing main dish from preview
  const handleRemovePendingMain = () => {
    setPendingMain(null);
    setPendingSides([]);
    // Stay on preview dialog - user can click the empty slot to select a new main
  };

  // Handle removing a side dish from preview
  const handleRemovePendingSide = (recipeId: number) => {
    setPendingSides((prev) => prev.filter((s) => Number(s.id) !== recipeId));
  };

  // Handle confirming meal creation
  const handleConfirmMeal = async () => {
    if (!pendingMain) return;

    setIsCreatingMeal(true);
    try {
      const sideRecipeIds = pendingSides.map((r) => Number(r.id));

      // Create the meal
      const meal = await plannerApi.createMeal({
        meal_name: pendingMain.name,
        main_recipe_id: Number(pendingMain.id),
        side_recipe_ids: sideRecipeIds,
      });

      // Add to planner
      await plannerApi.addToPlanner(meal.id);

      // Refresh entries
      const data = await plannerApi.getEntries();
      setEntries(data);

      // Select the new entry
      const newEntry = data.find((e) => e.meal_id === meal.id);
      if (newEntry) {
        setSelectedEntryId(newEntry.id);
      }

      // Close dialogs and reset state
      setShowMealPreview(false);
      setPendingMain(null);
      setPendingSides([]);

      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      console.error("Failed to create meal:", err);
      const message = err instanceof Error ? err.message : "Failed to create meal";

      // Show user-friendly toast for capacity errors
      if (message.includes("maximum capacity")) {
        toast.error("Meal queue is full", {
          description: "Remove or clear completed meals to add more.",
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsCreatingMeal(false);
    }
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
      const updatedEntry = currentEntry.is_completed
        ? await plannerApi.markIncomplete(selectedEntryId)
        : await plannerApi.markComplete(selectedEntryId);
      // Update with server response
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === selectedEntryId
            ? { ...entry, is_completed: updatedEntry.is_completed, completed_at: updatedEntry.completed_at }
            : entry
        )
      );
      // Refresh meal card to show updated recipe stats (times cooked, last cooked)
      setMealRefreshKey((k) => k + 1);
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

  // Handle toggling saved status for the selected meal
  const handleToggleSave = async () => {
    if (!selectedMealId || selectedEntryId === null) return;

    const previousEntries = entries;

    // Optimistic UI update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === selectedEntryId
          ? { ...entry, meal_is_saved: !entry.meal_is_saved }
          : entry
      )
    );

    try {
      await plannerApi.toggleSave(selectedMealId);
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to update saved status");
    }
  };

  // Handle cycling shopping mode for a meal: all -> produce_only -> none -> all
  const handleCycleShoppingMode = async (item: MealGridItem) => {
    const previousEntries = entries;

    // Calculate next mode for optimistic update
    const currentMode = item.shoppingMode ?? "all";
    const modes = ["all", "produce_only", "none"] as const;
    const currentIndex = modes.indexOf(currentMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];

    // Optimistic UI update
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, shopping_mode: nextMode }
          : entry
      )
    );

    try {
      await plannerApi.cycleShoppingMode(item.id);
      window.dispatchEvent(new Event("planner-updated"));
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      setError(err instanceof Error ? err.message : "Failed to update shopping mode");
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

  // When recipe picker is open, render it directly without PageLayout header
  if (showRecipePicker) {
    return (
      <div className="min-h-screen bg-background">
        <RecipePickerDialog
          open={showRecipePicker}
          onOpenChange={handlePickerClose}
          onSelect={handleRecipeSelect}
          selectedIds={
            pickerMode === "side"
              ? new Set(pendingSides.map((s) => s.id))
              : pendingMain
                ? new Set([pendingMain.id])
                : new Set()
          }
          filterMealType={pickerMode === "side" ? "side" : null}
          title={pickerMode === "side" ? "Add Side Dishes" : "Select Main Dish"}
          description={
            pickerMode === "side"
              ? "Choose up to 3 side dishes for your meal"
              : "Choose the main dish for your meal"
          }
          showDoneButton={pickerMode === "side"}
          onDone={handleSidesDone}
        />

        {/* Overlay dialogs still need to render */}
        <MealPreviewDialog
          open={showMealPreview}
          onOpenChange={handleMealPreviewClose}
          mainDish={pendingMain}
          sides={pendingSides}
          onSelectMain={handleSelectMainFromPreview}
          onRemoveMain={handleRemovePendingMain}
          onRemoveSide={handleRemovePendingSide}
          onAddSides={handleAddSidesClick}
          onConfirm={handleConfirmMeal}
          isSubmitting={isCreatingMeal}
        />

        {/* Discard Confirmation Dialog */}
        <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Discard Meal?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have a meal in progress. Are you sure you want to discard it?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDiscard}>
                Keep Editing
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDiscard}
                className="bg-destructive hover:bg-destructive/90"
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

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
            <ChefHat strokeWidth={1.5} />
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
          onCycleShoppingMode={handleCycleShoppingMode}
        />

        {/* BOTTOM: SELECTED MEAL CARD */}
        {selectedMealId !== null ? (
          <SelectedMealCard
            key={`meal-${selectedMealId}-${mealRefreshKey}`}
            mealId={selectedMealId}
            isCompleted={selectedEntry?.is_completed}
            isSaved={selectedEntry?.meal_is_saved}
            onMarkComplete={handleMarkComplete}
            onEditMeal={handleEditMeal}
            onToggleSave={handleToggleSave}
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

      {/* Meal Dialog - for editing existing meals */}
      <MealDialog
        open={showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditDialog(false);
          }
        }}
        mode="edit"
        mealId={selectedMealId}
        onMealUpdated={handleMealUpdated}
      />

      {/* Meal Preview Dialog - overlay for building a new meal */}
      <MealPreviewDialog
        open={showMealPreview}
        onOpenChange={handleMealPreviewClose}
        mainDish={pendingMain}
        sides={pendingSides}
        onSelectMain={handleSelectMainFromPreview}
        onRemoveMain={handleRemovePendingMain}
        onRemoveSide={handleRemovePendingSide}
        onAddSides={handleAddSidesClick}
        onConfirm={handleConfirmMeal}
        isSubmitting={isCreatingMeal}
      />

      {/* Discard Confirmation Dialog - for dialog close attempts */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Discard Meal?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have a meal in progress. Are you sure you want to discard it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDiscard}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="bg-destructive hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog - for browser navigation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Discard Meal?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have a meal in progress. Are you sure you want to leave? Your
              selection will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-destructive hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
