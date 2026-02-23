/**
 * Recipe filter content component with collapsible filter sections.
 *
 * Features:
 * - Collapsible filter sections (Category, Meal Type, Dietary)
 * - Favorites toggle with heart icon
 * - Reset button when filters are active
 * - Configurable sections (show/hide individual filter types)
 */

"use client";

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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/common/FilterBar";
import { MEAL_TYPE_OPTIONS, DIETARY_PREFERENCES } from "@/lib/constants";
import type { FilterOption } from "@/lib/filterUtils";

// ============================================================================
// Types
// ============================================================================

export interface RecipeFiltersState {
  categories: string[];
  mealTypes: string[];
  dietaryPreferences: string[];
  groupIds: number[];
  favoritesOnly: boolean;
}

export interface RecipeFiltersProps {
  /** Current filter state */
  filters: RecipeFiltersState;

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

  /** Show the header with title and reset button (default true) */
  showHeader?: boolean;

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
  return (
    <Collapsible defaultOpen={defaultOpen} className="py-6">
      <CollapsibleTrigger
        className="flex items-center justify-between w-full h-auto p-0 text-sm font-medium text-foreground hover:text-primary hover:bg-transparent pressable"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
          {title}
          {selected.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180"
          strokeWidth={1.5}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">
          <FilterBar
            options={options.map((o) => ({ id: o.value, label: o.label }))}
            activeIds={selected}
            onToggle={(id) => {
              const isActive = selected.includes(id);
              onChange(id, !isActive);
            }}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================================
// RecipeFilters Component
// ============================================================================

export function RecipeFilters({
  filters,
  onCategoryChange,
  onMealTypeChange,
  onDietaryChange,
  onGroupChange,
  onFavoritesChange,
  onClearAll,
  showHeader = true,
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
}: RecipeFiltersProps) {
  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.mealTypes.length > 0 ||
    filters.dietaryPreferences.length > 0 ||
    filters.groupIds.length > 0 ||
    filters.favoritesOnly;

  return (
    <div className={className}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" strokeWidth={1.5} />
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
      )}

      {/* All filter sections in a single divide-y container */}
      <div className="divide-y divide-border">
        {/* Favorites Toggle */}
        {showFavorites && (
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2">
              <Heart
                className={cn(
                  "size-4 transition-colors",
                  filters.favoritesOnly
                    ? "text-destructive fill-current"
                    : "text-muted-foreground"
                )}
                strokeWidth={1.5}
              />
              <label htmlFor="favorites-only-switch" className="text-sm text-foreground">Favorites Only</label>
            </div>
            <Switch
              id="favorites-only-switch"
              checked={filters.favoritesOnly}
              onCheckedChange={(checked) => onFavoritesChange(checked)}
              size="sm"
            />
          </div>
        )}

        {/* Filter Sections */}
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