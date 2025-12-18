"use client";

import { BookOpen, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MealLibraryEmptyProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateMeal?: () => void;
}

export function MealLibraryEmpty({
  hasFilters = false,
  onClearFilters,
  onCreateMeal,
}: MealLibraryEmptyProps) {
  // No results due to filters
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No meals found
        </h3>
        <p className="text-sm text-muted mb-4 max-w-[200px]">
          Try adjusting your search or filters
        </p>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  // Empty library state
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-muted" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        No saved meals yet!
      </h3>
      <p className="text-sm text-muted mb-4 max-w-[220px]">
        Create your first meal to start building your meal library.
      </p>
      {onCreateMeal ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={onCreateMeal}
        >
          <Plus className="h-4 w-4" />
          Create Meal
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2 opacity-60 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Create Meal
          </Button>
          <p className="text-xs text-muted mt-2">Coming soon!</p>
        </>
      )}
    </div>
  );
}