"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealPreviewPanel } from "./MealPreviewPanel";
import { SavedView } from "./SavedView";
import type { RecipeCardData } from "@/types/recipe";
import type { PlannerEntryResponseDTO } from "@/types/planner";

// ============================================================================
// Types
// ============================================================================

export interface MealPreviewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog mode - "create" for new meals, "edit" for existing meals */
  mode?: "create" | "edit";
  /** Currently selected main dish (null if empty) */
  mainDish: RecipeCardData | null;
  /** Currently selected side dishes */
  sides: RecipeCardData[];
  /** Called when the empty main dish slot is clicked */
  onSelectMain: () => void;
  /** Called when the main dish remove button is clicked */
  onRemoveMain: () => void;
  /** Called when a side dish remove button is clicked */
  onRemoveSide: (recipeId: number) => void;
  /** Called when the "Add Sides" button is clicked */
  onAddSides: () => void;
  /** Called when the "Add to Meal Queue" button is clicked */
  onConfirm: () => void;
  /** Whether the add button is in loading/submitting state */
  isSubmitting?: boolean;
  /** Called when a saved meal is added to planner (create mode only) */
  onSavedMealAdded?: (entry: PlannerEntryResponseDTO) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * MealPreviewDialog - Dialog for creating or editing a meal
 *
 * In create mode: shows tabs for "Create Meal" and "Saved Meals"
 * In edit mode: shows MealPreviewPanel directly (no tabs)
 */
export function MealPreviewDialog({
  open,
  onOpenChange,
  mode = "create",
  mainDish,
  sides,
  onSelectMain,
  onRemoveMain,
  onRemoveSide,
  onAddSides,
  onConfirm,
  isSubmitting = false,
  onSavedMealAdded,
}: MealPreviewDialogProps) {
  const isEditMode = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Meal" : "Add Meal"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your meal selection"
              : "Create a new meal or add a saved one"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode ? (
          <div className="mt-2 min-w-0">
            <MealPreviewPanel
              mainDish={mainDish}
              sides={sides}
              onSelectMain={onSelectMain}
              onRemoveMain={onRemoveMain}
              onRemoveSide={onRemoveSide}
              onAddSides={onAddSides}
              onAddToQueue={onConfirm}
              isSubmitting={isSubmitting}
              showHeader={false}
              buttonText="Save Changes"
              submittingText="Saving..."
            />
          </div>
        ) : (
          <Tabs defaultValue="create" className="mt-2 flex flex-col h-[35rem]">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">Create Meal</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">Saved Meals</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="min-w-0 flex-1 overflow-y-auto">
              <MealPreviewPanel
                mainDish={mainDish}
                sides={sides}
                onSelectMain={onSelectMain}
                onRemoveMain={onRemoveMain}
                onRemoveSide={onRemoveSide}
                onAddSides={onAddSides}
                onAddToQueue={onConfirm}
                isSubmitting={isSubmitting}
                showHeader={false}
                buttonText="Add to Meal Queue"
                submittingText="Adding..."
              />
            </TabsContent>

            <TabsContent value="saved" className="min-w-0 flex-1 overflow-y-auto">
              {onSavedMealAdded && (
                <SavedView onEntryCreated={onSavedMealAdded} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
