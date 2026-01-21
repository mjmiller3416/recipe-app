"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MealPreviewPanel } from "./meal-dialog/components/MealPreviewPanel";
import type { RecipeCardData } from "@/types";

// ============================================================================
// Types
// ============================================================================

export interface MealPreviewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
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
}

// ============================================================================
// Component
// ============================================================================

/**
 * MealPreviewDialog - Dialog for previewing and confirming a meal selection
 *
 * Wraps MealPreviewPanel inside a dialog for the meal creation flow.
 * Shows main dish, side dishes, and allows adding more sides.
 */
export function MealPreviewDialog({
  open,
  onOpenChange,
  mainDish,
  sides,
  onSelectMain,
  onRemoveMain,
  onRemoveSide,
  onAddSides,
  onConfirm,
  isSubmitting = false,
}: MealPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Your Meal</DialogTitle>
          <DialogDescription>
            Review your selection and add to the meal queue
          </DialogDescription>
        </DialogHeader>

        {/* Meal Preview Panel */}
        <div className="mt-2">
          <MealPreviewPanel
            mainDish={mainDish}
            sides={sides}
            onSelectMain={onSelectMain}
            onRemoveMain={onRemoveMain}
            onRemoveSide={onRemoveSide}
            onAddToQueue={onConfirm}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Add Sides Button - shown when main is selected and fewer than 3 sides */}
        {mainDish && sides.length < 3 && (
          <Button
            variant="outline"
            onClick={onAddSides}
            className="w-full mt-2 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Side Dishes ({sides.length}/3)
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
