import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/common/FilterSidebar";

export interface FilterState {
  categories: string[];
  mealTypes: string[];
  dietaryPreferences: string[];
  groupIds: number[];
  favoritesOnly: boolean;
  maxCookTime: number | null;
  newDays: number | null;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface RecipeFiltersProps {
  filters: FilterState;
  showFilters: boolean;
  mobileFiltersOpen: boolean;
  onMobileFiltersChange: (open: boolean) => void;
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

export function RecipeFilters({
  filters,
  showFilters,
  mobileFiltersOpen,
  onMobileFiltersChange,
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
}: RecipeFiltersProps) {
  return (
    <>
      {/* Desktop Filter Sidebar */}
      {showFilters && (
        <aside className="hidden md:block w-64 flex-shrink-0">
          <Card>
            <CardContent className="pt-6">
              <FilterSidebar
                filters={filters}
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
            </CardContent>
          </Card>
        </aside>
      )}

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={onMobileFiltersChange}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Refine Results
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <FilterSidebar
              filters={filters}
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
        </SheetContent>
      </Sheet>
    </>
  );
}
