"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterPillGroup } from "@/components/common/FilterPillGroup";
import { QUICK_FILTERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface FilterBarProps {
  /** Current search term */
  searchTerm: string;
  /** Called when search term changes */
  onSearchChange: (term: string) => void;
  /** Set of active filter IDs */
  activeFilters: Set<string>;
  /** Called when a filter pill is toggled */
  onFilterToggle: (id: string) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Filter pills shown in Create Meal dialog (meal types + new)
const DIALOG_FILTER_IDS = ["breakfast", "lunch", "dinner", "dessert", "sides", "sauce", "new"];
const DIALOG_FILTERS = QUICK_FILTERS.filter(
  (f) => DIALOG_FILTER_IDS.includes(f.id)
);

// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

/**
 * FilterBar - Search input with filter pills for recipe filtering
 *
 * Features:
 * - Search input with icon prefix
 * - Meal type filter pills (Breakfast, Lunch, Dinner, Dessert)
 * - Vertically stacked layout
 */
export function FilterBar({
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterToggle,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search recipes by name"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Pills */}
      <FilterPillGroup
        options={DIALOG_FILTERS}
        activeIds={activeFilters}
        onToggle={onFilterToggle}
        variant="default"
        align="start"
      />
    </div>
  );
}
