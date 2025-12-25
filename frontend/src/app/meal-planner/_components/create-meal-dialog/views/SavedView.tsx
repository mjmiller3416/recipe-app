"use client";

import { Bookmark } from "lucide-react";

// ============================================================================
// SAVED VIEW COMPONENT (PLACEHOLDER)
// ============================================================================

/**
 * SavedView - Placeholder for the "Saved Meals" tab
 *
 * This will eventually display a list of saved meal combinations
 * that users can quickly add to their meal plan.
 */
export function SavedView() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-muted">
        <Bookmark className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Saved Meals
      </h3>
      <p className="text-muted-foreground mt-1">Coming soon...</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">
        Save your favorite meal combinations for quick access later.
      </p>
    </div>
  );
}
