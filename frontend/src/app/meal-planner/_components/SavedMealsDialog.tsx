"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SavedView } from "./SavedView";
import type { PlannerEntryResponseDTO } from "@/types/planner";

// ============================================================================
// Types
// ============================================================================

export interface SavedMealsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called when a meal is added to the planner */
  onEntryCreated: (entry: PlannerEntryResponseDTO) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * SavedMealsDialog - Dialog for browsing and quick-adding saved meals
 *
 * Wraps SavedView inside a dialog for easy access from the planner header.
 * One-click to add any saved meal to the planner.
 */
export function SavedMealsDialog({
  open,
  onOpenChange,
  onEntryCreated,
}: SavedMealsDialogProps) {
  // When a meal is added, close the dialog and notify parent
  const handleEntryCreated = (entry: PlannerEntryResponseDTO) => {
    onEntryCreated(entry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Saved Meals</DialogTitle>
          <DialogDescription>
            Quick-add a saved meal to your planner
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2">
          <SavedView onEntryCreated={handleEntryCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
