/**
 * Reusable filter sidebar component for recipe filtering.
 * Used in Recipe Browser and can be used in Meal Planner.
 *
 * Features:
 * - Collapsible filter sections (Category, Meal Type, Dietary)
 * - Favorites toggle with heart icon
 * - Reset button when filters are active
 * - Configurable sections (show/hide individual filter types)
 */

"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  ChefHat,
  Clock,
  BookOpen,
  Heart,
  ChevronDown,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FilterBar } from "./FilterBar";
import { MEAL_TYPE_OPTIONS, DIETARY_PREFERENCES } from "@/lib/constants";

// ============================================================================
// Types
// ============================================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSidebarFilters {
  categories: string[];
  mealTypes: string[];
  dietaryPreferences: string[];
  groupIds: number[];
  favoritesOnly: boolean;
}

export interface FilterSidebarProps {
  /** Current filter state */
  filters: FilterSidebarFilters;

  /** Change handlers */
  onCategoryChange: (value: string, checked: boolean) => void;
  onMealTypeChange: (value: string, checked: boolean) => void;
  onDietaryChange: (value: string, checked: boolean) => void;
  onGroupChange?: (value: number, checked: boolean) => void;
  onFavoritesChange: (checked: boolean) => void;
  onClearAll: () => void;

  /** Section visibility (all default to true) */
  showFavorites?: boolean;
  showCategories?: boolean;
  showMealTypes?: boolean;
  showDietary?: boolean;
  showGroups?: boolean;

  /** Custom options */
  categoryOptions: readonly FilterOption[] | FilterOption[];
  mealTypeOptions?: readonly FilterOption[] | FilterOption[];
  dietaryOptions?: readonly FilterOption[] | FilterOption[];
  groupOptions?: FilterOption[];

  /** Custom header title */
  headerTitle?: string;

  /** Additional class name */
  className?: string;
}

// ============================================================================
// FilterSection Sub-component
// ============================================================================

interface FilterSectionProps {
  title: string;
  icon: React.ElementType;
  options: readonly FilterOption[] | FilterOption[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
  defaultOpen?: boolean;
}

function FilterSection({
  title,
  icon: Icon,
  options,
  selected,
  onChange,
  defaultOpen = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors pressable"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
          {selected.length > 0 && (
            <span className="ml-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="pt-2 pb-4">
          <FilterBar
            options={options.map((o) => ({ id: o.value, label: o.label }))}
            activeIds={selected}
            onToggle={(id) => {
              const isActive = selected.includes(id);
              onChange(id, !isActive);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FilterSidebar Component
// ============================================================================

export function FilterSidebar({
  filters,
  onCategoryChange,
  onMealTypeChange,
  onDietaryChange,
  onGroupChange,
  onFavoritesChange,
  onClearAll,
  showFavorites = true,
  showCategories = true,
  showMealTypes = true,
  showDietary = true,
  showGroups = false,
  categoryOptions,
  mealTypeOptions = MEAL_TYPE_OPTIONS,
  dietaryOptions = DIETARY_PREFERENCES.filter((d) => d.value !== "none"),
  groupOptions = [],
  headerTitle = "Refine Results",
  className,
}: FilterSidebarProps) {
  // Check if any filters are active
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.mealTypes.length > 0 ||
    filters.dietaryPreferences.length > 0 ||
    filters.groupIds.length > 0 ||
    filters.favoritesOnly;

  return (
    <div className={className}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">{headerTitle}</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-0 text-xs"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Favorites Toggle */}
      {showFavorites && (
        <div className="flex items-center justify-between py-3 px-2 mb-2 rounded-md">
          <div className="flex items-center gap-2">
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                filters.favoritesOnly ? "text-destructive fill-current" : "text-muted-foreground"
              )}
            />
            <span className="text-sm text-foreground">Favorites Only</span>
          </div>
          <Switch
            checked={filters.favoritesOnly}
            onCheckedChange={(checked) => onFavoritesChange(checked)}
            size="sm"
          />
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-2 divide-y divide-border">
        {showCategories && (
          <FilterSection
            title="Category"
            icon={ChefHat}
            options={categoryOptions}
            selected={filters.categories}
            onChange={onCategoryChange}
          />
        )}
        {showMealTypes && (
          <FilterSection
            title="Meal Type"
            icon={Clock}
            options={mealTypeOptions}
            selected={filters.mealTypes}
            onChange={onMealTypeChange}
          />
        )}
        {showDietary && dietaryOptions.length > 0 && (
          <FilterSection
            title="Dietary Preference"
            icon={BookOpen}
            options={dietaryOptions}
            selected={filters.dietaryPreferences}
            onChange={onDietaryChange}
          />
        )}
        {showGroups && groupOptions.length > 0 && onGroupChange && (
          <FilterSection
            title="Recipe Groups"
            icon={FolderOpen}
            options={groupOptions}
            selected={filters.groupIds.map(String)}
            onChange={(value, checked) => onGroupChange(Number(value), checked)}
          />
        )}
      </div>
    </div>
  );
}

// Re-export FilterSection for use cases that need it separately
export { FilterSection };
