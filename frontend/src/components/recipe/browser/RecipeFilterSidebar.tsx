"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { RecipeFilters } from "@/components/recipe/RecipeFilters";
import type { RecipeFilters as RecipeFilterState, FilterOption } from "@/lib/filterUtils";

export interface RecipeFilterSidebarProps {
  filters: RecipeFilterState;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onCategoryChange: (value: string, checked: boolean) => void;
  onMealTypeChange: (value: string, checked: boolean) => void;
  onDietaryChange: (value: string, checked: boolean) => void;
  onGroupChange: (value: number, checked: boolean) => void;
  onFavoritesChange: (checked: boolean) => void;
  onClearAll: () => void;
  categoryOptions: FilterOption[];
  mealTypeOptions: FilterOption[];
  dietaryOptions: FilterOption[];
  groupOptions: FilterOption[];
}

export function RecipeFilterSidebar({
  filters,
  filtersOpen,
  onFiltersOpenChange,
  onCategoryChange,
  onMealTypeChange,
  onDietaryChange,
  onGroupChange,
  onFavoritesChange,
  onClearAll,
  categoryOptions,
  mealTypeOptions,
  dietaryOptions,
  groupOptions,
}: RecipeFilterSidebarProps) {
  return (
    <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-80 sm:w-96 flex flex-col top-16 h-auto"
        overlayClassName="top-16 bg-transparent pointer-events-none"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("[data-filter-toggle]")) {
            e.preventDefault();
          }
        }}
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" strokeWidth={1.5} />
            Filters
          </SheetTitle>
        </SheetHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-4">
          <RecipeFilters
            filters={filters}
            showHeader={false}
            onCategoryChange={onCategoryChange}
            onMealTypeChange={onMealTypeChange}
            onDietaryChange={onDietaryChange}
            onGroupChange={onGroupChange}
            onFavoritesChange={onFavoritesChange}
            onClearAll={onClearAll}
            categoryOptions={categoryOptions}
            mealTypeOptions={mealTypeOptions}
            dietaryOptions={dietaryOptions}
            groupOptions={groupOptions}
            showGroups={groupOptions.length > 0}
          />
        </div>

        <SheetFooter className="border-t border-border">
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onClearAll}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => onFiltersOpenChange(false)}>
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}