"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
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
import {
  usePlannerEntries,
  useCreateMeal,
  useUpdateMeal,
  useAddToPlanner,
  useRemoveEntry,
  useMarkComplete,
  useMarkIncomplete,
  useToggleSaveMeal,
  useCycleShoppingMode,
  useReorderEntries,
  useClearCompleted,
} from "@/hooks/api";
import { plannerApi } from "@/lib/api";
import type { PlannerEntryResponseDTO } from "@/types/planner";
import type { MealSelectionResponseDTO } from "@/types/meal";
import type { RecipeCardData } from "@/types/recipe";
import { MealGrid } from "./MealGrid";
import { MealGridItem } from "./MealGridCard";
import { CompletedDropdown, CompletedMealItem } from "./CompletedDropdown";
import { SelectedMealCard } from "./meal-display/SelectedMealCard";
import { RecipePickerDialog } from "./RecipePickerDialog";
import { MealPreviewDialog } from "./MealPreviewDialog";
import { SavedMealsDialog } from "./SavedMealsDialog";
import { AlertTriangle, ChefHat, ArrowUpDown, Bookmark } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnsavedChanges, setNavigationBypass } from "@/hooks/useUnsavedChanges";

// ============================================================================
// MEAL PLANNER PAGE COMPONENT
// ============================================================================

export function MealPlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();

  // Fetch planner entries via React Query
  const { data: entries = [], isLoading } = usePlannerEntries();

  // Mutation hooks
  const createMealMutation = useCreateMeal();
  const updateMealMutation = useUpdateMeal();
  const addToPlannerMutation = useAddToPlanner();
  const removeEntryMutation = useRemoveEntry();
  const markCompleteMutation = useMarkComplete();
  const markIncompleteMutation = useMarkIncomplete();
  const toggleSaveMutation = useToggleSaveMeal();
  const cycleShoppingModeMutation = useCycleShoppingMode();
  const reorderEntriesMutation = useReorderEntries();
  const clearCompletedMutation = useClearCompleted();

  // Local UI state
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mealRefreshKey, setMealRefreshKey] = useState(0);

  // Dialog orchestration state for meal creation/edit flow
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [showMealPreview, setShowMealPreview] = useState(false);
  const [showSavedMealsDialog, setShowSavedMealsDialog] = useState(false);
  const [pickerMode, setPickerMode] = useState<"main" | "side">("main");
  const [pendingMain, setPendingMain] = useState<RecipeCardData | null>(null);
  const [pendingSides, setPendingSides] = useState<RecipeCardData[]>([]);
  const [isCreatingMeal, setIsCreatingMeal] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [editingMealId, setEditingMealId] = useState<number | null>(null);
  const [editingMealName, setEditingMealName] = useState<string | null>(null);

  // Track if user has started meal creation (selected a main dish)
  const hasPendingMeal = !!pendingMain;

  // Helper to reset meal creation/edit state
  const resetMealCreation = useCallback(() => {
    setPendingMain(null);
    setPendingSides([]);
    setShowMealPreview(false);
    setShowRecipePicker(false);
    setEditingMealId(null);
    setEditingMealName(null);
  }, []);

  // Unsaved changes hook - handles browser nav and sidebar via SafeLink
  // Include showRecipePicker so protection is active during recipe selection
  const {
    showLeaveDialog,
    setShowLeaveDialog,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty: showRecipePicker || hasPendingMeal,
    onConfirmLeave: resetMealCreation,
  });

  // Track picker state in a ref for the popstate handler
  const showRecipePickerRef = useRef(showRecipePicker);
  showRecipePickerRef.current = showRecipePicker;

  // Handle browser back button when picker is open
  // This intercepts back button and shows discard dialog instead of navigating away
  useEffect(() => {
    if (!showRecipePicker) return;

    // Push a guard state when picker opens
    window.history.pushState({ pickerGuard: true }, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      if (showRecipePickerRef.current) {
        // Temporarily bypass the useUnsavedChanges handler
        setNavigationBypass(true);
        // Re-push guard to stay on page
        window.history.pushState({ pickerGuard: true }, "", window.location.href);
        // Show the discard dialog
        setShowDiscardDialog(true);
        // Reset bypass after a short delay
        setTimeout(() => setNavigationBypass(false), 100);
      }
    };

    // Use capture phase to run before other listeners
    window.addEventListener("popstate", handlePopState, true);
    return () => window.removeEventListener("popstate", handlePopState, true);
  }, [showRecipePicker]);

  // Check for create=true URL parameter and redirect to create page
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      router.replace("/meal-planner/create");
    }
  }, [searchParams, router]);

  // Auto-select first uncompleted entry when entries load
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (entries.length > 0 && selectedEntryId === null && !hasAutoSelected.current) {
      hasAutoSelected.current = true;
      const firstUncompleted = entries.find((e) => !e.is_completed);
      setSelectedEntryId(firstUncompleted?.id ?? entries[0].id);
    }
  }, [entries, selectedEntryId]);

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

  // Handle confirming meal creation or update
  const handleConfirmMeal = async () => {
    if (!pendingMain) return;

    setIsCreatingMeal(true);
    try {
      const sideRecipeIds = pendingSides.map((r) => Number(r.id));

      if (editingMealId) {
        // Update existing meal using mutation
        const updatedMeal = await updateMealMutation.mutateAsync({
          mealId: editingMealId,
          data: {
            meal_name: editingMealName || pendingMain.name,
            main_recipe_id: Number(pendingMain.id),
            side_recipe_ids: sideRecipeIds,
          },
        });

        // Update local entries state
        handleMealUpdated(updatedMeal);

        // Close dialogs and reset state
        resetMealCreation();
      } else {
        // Create new meal using mutation
        const meal = await createMealMutation.mutateAsync({
          meal_name: pendingMain.name,
          main_recipe_id: Number(pendingMain.id),
          side_recipe_ids: sideRecipeIds,
        });

        // Add to planner using mutation
        const newEntry = await addToPlannerMutation.mutateAsync(meal.id);

        // Select the new entry (cache will be automatically updated by mutations)
        setSelectedEntryId(newEntry.id);

        // Close dialogs and reset state
        resetMealCreation();
      }
    } catch (err) {
      console.error("Failed to save meal:", err);
      const message = err instanceof Error ? err.message : "Failed to save meal";

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
  const handleMarkComplete = () => {
    if (selectedEntryId === null) return;

    const currentEntry = entries.find((e) => e.id === selectedEntryId);
    if (!currentEntry) return;

    // Use the appropriate mutation based on current state
    // Optimistic updates are handled by the hooks
    if (currentEntry.is_completed) {
      markIncompleteMutation.mutate(selectedEntryId, {
        onSuccess: () => {
          // Refresh meal card to show updated recipe stats
          setMealRefreshKey((k) => k + 1);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update completion status");
        },
      });
    } else {
      markCompleteMutation.mutate(selectedEntryId, {
        onSuccess: () => {
          // Refresh meal card to show updated recipe stats (times cooked, last cooked)
          setMealRefreshKey((k) => k + 1);

          // Auto-select next uncompleted meal after marking complete
          // Filter out the current entry (now completed) to find remaining entries
          const remainingEntries = entries.filter((e) => e.id !== selectedEntryId);
          if (remainingEntries.length > 0) {
            // Try to find the first uncompleted entry
            const firstUncompleted = remainingEntries.find((e) => !e.is_completed);
            setSelectedEntryId(firstUncompleted?.id ?? remainingEntries[0].id);
          } else {
            // No entries remain - clear selection to show empty state
            setSelectedEntryId(null);
          }
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Failed to update completion status");
        },
      });
    }
  };

  // Handle Edit Meal button click - fetches meal data and opens preview dialog in edit mode
  const handleEditMeal = async () => {
    if (!selectedMealId) return;

    try {
      const token = await getToken();
      const meal = await plannerApi.getMeal(selectedMealId, token);

      // Store the original meal name to preserve it during editing
      setEditingMealName(meal.meal_name);

      // Convert main recipe to RecipeCardData format
      if (meal.main_recipe) {
        const mainDish: RecipeCardData = {
          id: meal.main_recipe.id,
          name: meal.main_recipe.recipe_name,
          servings: meal.main_recipe.servings ?? 0,
          totalTime: meal.main_recipe.total_time ?? 0,
          imageUrl: meal.main_recipe.reference_image_path ?? undefined,
        };
        setPendingMain(mainDish);
      }

      // Convert side recipes to RecipeCardData format
      if (meal.side_recipes && meal.side_recipes.length > 0) {
        const sides: RecipeCardData[] = meal.side_recipes.map((r) => ({
          id: r.id,
          name: r.recipe_name,
          servings: r.servings ?? 0,
          totalTime: r.total_time ?? 0,
          imageUrl: r.reference_image_path ?? undefined,
        }));
        setPendingSides(sides);
      } else {
        setPendingSides([]);
      }

      // Set edit mode and open dialog
      setEditingMealId(selectedMealId);
      setShowMealPreview(true);
    } catch (err) {
      console.error("Failed to fetch meal for editing:", err);
      toast.error("Failed to load meal for editing");
    }
  };

  // Handle Add Side click - opens edit dialog with side picker
  const handleAddSide = async () => {
    // Same as edit meal - opens the dialog with existing meal data
    await handleEditMeal();
  };

  // Handle saved meal added to planner from SavedMealsDialog
  const handleSavedMealAdded = (entry: PlannerEntryResponseDTO) => {
    // Cache is automatically updated by the useAddToPlanner mutation in SavedMealsDialog
    setSelectedEntryId(entry.id);
  };

  // Handle meal updated - cache is automatically updated by mutation
  const handleMealUpdated = (updatedMeal: MealSelectionResponseDTO) => {
    // Trigger SelectedMealCard to re-fetch by changing its key
    setMealRefreshKey((prev) => prev + 1);
  };

  const handleRemoveFromMenu = () => {
    if (selectedEntryId === null) return;

    const entryToRemove = selectedEntryId;

    // Select next entry before removal (optimistic UI handled by hook)
    const remainingEntries = entries.filter((e) => e.id !== entryToRemove);
    if (remainingEntries.length > 0) {
      const firstUncompleted = remainingEntries.find((e) => !e.is_completed);
      setSelectedEntryId(firstUncompleted?.id ?? remainingEntries[0].id);
    } else {
      setSelectedEntryId(null);
    }

    removeEntryMutation.mutate(entryToRemove, {
      onError: (err) => {
        // Restore selection on error
        setSelectedEntryId(entryToRemove);
        setError(err instanceof Error ? err.message : "Failed to remove from menu");
      },
    });
  };

  // Handle toggling saved status for the selected meal
  const handleToggleSave = () => {
    if (!selectedMealId) return;

    // Optimistic update handled by the hook
    toggleSaveMutation.mutate(selectedMealId, {
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to update saved status");
      },
    });
  };

  // Handle cycling shopping mode for a meal: all -> produce_only -> none -> all
  const handleCycleShoppingMode = (item: MealGridItem) => {
    // Optimistic update handled by the hook
    cycleShoppingModeMutation.mutate(item.id, {
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to update shopping mode");
      },
    });
  };

  // Handle drag-and-drop reorder of grid items
  const handleReorder = useCallback(
    (reorderedItems: MealGridItem[]) => {
      const reorderedIds = reorderedItems.map((item) => item.id);
      // Optimistic update handled by the hook
      reorderEntriesMutation.mutate(reorderedIds);
    },
    [reorderEntriesMutation]
  );

  // Handle clearing all completed entries
  const handleClearCompleted = () => {
    const completedIds = entries.filter((e) => e.is_completed).map((e) => e.id);
    const remainingEntries = entries.filter((e) => !e.is_completed);

    // Update selection if current selection was completed
    if (selectedEntryId && completedIds.includes(selectedEntryId)) {
      if (remainingEntries.length > 0) {
        setSelectedEntryId(remainingEntries[0].id);
      } else {
        setSelectedEntryId(null);
      }
    }

    // Optimistic update handled by the hook
    clearCompletedMutation.mutate(undefined, {
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Failed to clear completed");
      },
    });
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
          mode={editingMealId ? "edit" : "create"}
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
          {/* Reorder Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsReorderMode(!isReorderMode)}
                variant={isReorderMode ? "default" : "outline"}
                size="icon"
                aria-label={isReorderMode ? "Done reordering" : "Reorder meals"}
              >
                <ArrowUpDown strokeWidth={1.5} className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isReorderMode ? "Done reordering" : "Reorder meals"}
            </TooltipContent>
          </Tooltip>

          {/* Saved Meals Button */}
          <Button
            onClick={() => setShowSavedMealsDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Bookmark strokeWidth={1.5} />
            Saved Meals
          </Button>

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
          onReorder={handleReorder}
          isReorderMode={isReorderMode}
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

      {/* Meal Preview Dialog - overlay for building/editing a meal */}
      <MealPreviewDialog
        open={showMealPreview}
        onOpenChange={handleMealPreviewClose}
        mode={editingMealId ? "edit" : "create"}
        mainDish={pendingMain}
        sides={pendingSides}
        onSelectMain={handleSelectMainFromPreview}
        onRemoveMain={handleRemovePendingMain}
        onRemoveSide={handleRemovePendingSide}
        onAddSides={handleAddSidesClick}
        onConfirm={handleConfirmMeal}
        isSubmitting={isCreatingMeal}
      />

      {/* Saved Meals Dialog - for browsing and quick-adding saved meals */}
      <SavedMealsDialog
        open={showSavedMealsDialog}
        onOpenChange={setShowSavedMealsDialog}
        onEntryCreated={handleSavedMealAdded}
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
