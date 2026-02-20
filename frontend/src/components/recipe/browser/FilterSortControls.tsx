"use client";

import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Calendar,
  Clock,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActiveFilter } from "@/lib/filterUtils";

// ============================================================================
// Types
// ============================================================================

export type SortOption = "alphabetical" | "cookTime" | "createdAt";
export type SortDirection = "asc" | "desc";

// ============================================================================
// Constants
// ============================================================================

export const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: "alphabetical", label: "Alphabetical", icon: SortAsc },
  { value: "cookTime", label: "Cook Time", icon: Clock },
  { value: "createdAt", label: "Date Added", icon: Calendar },
];

// ============================================================================
// Filter Chip Component
// ============================================================================

interface FilterChipProps {
  label: string;
  type: string;
  onRemove: () => void;
}

function FilterChip({ label, type, onRemove }: FilterChipProps) {
  const typeColors: Record<string, string> = {
    category: "bg-primary/20 text-primary-on-surface border-primary/30",
    mealType: "bg-secondary/20 text-secondary border-secondary/30",
    dietary: "bg-accent/50 text-foreground border-accent",
    favorite: "bg-destructive/20 text-destructive border-destructive/30",
    time: "bg-secondary/20 text-secondary border-secondary/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 px-3 py-1 rounded-full transition-colors",
        typeColors[type] || "bg-elevated text-foreground border-border"
      )}
    >
      {label}
      <Button
        variant="ghost"
        size="icon"
        className="size-5 p-0 rounded-full hover:bg-background/50"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" strokeWidth={1.5} />
      </Button>
    </Badge>
  );
}

// ============================================================================
// Sticky Header Bar Component
// ============================================================================

export interface RecipeSortControlsProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (value: SortOption) => void;
  onSortDirectionToggle: () => void;
  onOpenFilters: () => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearAllFilters: () => void;
  onBack?: () => void;
  actionButton?: React.ReactNode;
}

export function RecipeSortControls({
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  onOpenFilters,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  onBack,
  actionButton,
}: RecipeSortControlsProps) {
  const filterCount = activeFilters.length;

  return (
    <div className="py-3 border-b border-border">
      <div className="flex items-center gap-2.5 flex-wrap">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back"
            className="rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="size-5" strokeWidth={1.5} />
          </Button>
        )}

        <Button
          variant="outline"
          size="default"
          onClick={onOpenFilters}
          data-filter-toggle
          className={cn(
            "gap-2",
            filterCount > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.5} />
          Filters
          {filterCount > 0 && (
            <span className="min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center px-1.5">
              {filterCount}
            </span>
          )}
        </Button>

        {/* Active filter chips */}
        {activeFilters.map((filter, index) => (
          <FilterChip
            key={`${filter.type}-${filter.value}-${index}`}
            label={filter.label}
            type={filter.type}
            onRemove={() => onRemoveFilter(filter)}
          />
        ))}

        {/* Clear all (when multiple filters active) */}
        {filterCount > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          >
            Clear all
          </Button>
        )}

        {/* Sort controls — pushed right */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <label htmlFor="sort-select" className="text-sm text-muted-foreground hidden md:inline">Sort by:</label>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger id="sort-select" className="w-40 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <option.icon className="size-4" strokeWidth={1.5} />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={onSortDirectionToggle}
            aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="size-4" strokeWidth={1.5} />
            ) : (
              <ArrowDown className="size-4" strokeWidth={1.5} />
            )}
          </Button>
          {actionButton}
        </div>
      </div>
    </div>
  );
}
