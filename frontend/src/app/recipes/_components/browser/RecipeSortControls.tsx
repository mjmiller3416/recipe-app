import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  X,
  SlidersHorizontal,
  Sparkles,
  Calendar,
  Clock,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type SortOption = "alphabetical" | "cookTime" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface ActiveFilter {
  type: "category" | "mealType" | "dietary" | "group" | "favorite" | "time" | "new";
  value: string;
  label: string;
}

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
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
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
        typeColors[type] || "bg-elevated text-foreground border-border"
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-background/50 rounded-full p-1 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ============================================================================
// Sticky Header Bar Component
// ============================================================================

export interface RecipeSortControlsProps {
  resultCount: number;
  totalCount: number;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (value: SortOption) => void;
  onSortDirectionToggle: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onOpenMobileFilters: () => void;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filter: ActiveFilter) => void;
  onClearAllFilters: () => void;
  onBack?: () => void;
  actionButton?: React.ReactNode;
}

export function RecipeSortControls({
  resultCount,
  totalCount,
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  showFilters,
  onToggleFilters,
  onOpenMobileFilters,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  onBack,
  actionButton,
}: RecipeSortControlsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
      {/* Section Header with Sort */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Back"
              className="rounded-xl flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Your Recipes</h2>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {resultCount === totalCount
              ? `${totalCount} recipes`
              : `${resultCount} of ${totalCount}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden md:inline">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-32 md:w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
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
            className="h-9 w-9"
            aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="gap-2 ml-2 hidden md:flex"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMobileFilters}
            className="gap-2 ml-2 md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {activeFilters.length}
              </span>
            )}
          </Button>
          {actionButton}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="p-4 bg-elevated rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <span className="text-sm font-medium text-foreground shrink-0 py-1.5">Active Filters</span>
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {activeFilters.map((filter, index) => (
                <FilterChip
                  key={`${filter.type}-${filter.value}-${index}`}
                  label={filter.label}
                  type={filter.type}
                  onRemove={() => onRemoveFilter(filter)}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2 shrink-0"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
