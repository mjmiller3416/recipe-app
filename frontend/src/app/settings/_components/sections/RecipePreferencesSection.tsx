"use client";

import { ChefHat, Filter, RotateCcw, ArrowUpDown, SortAsc, Clock, CalendarPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { QUICK_FILTERS, DEFAULT_QUICK_FILTER_IDS } from "@/lib/constants";
import { SectionHeader } from "../SectionHeader";

const MAX_FILTERS = 5;

type SortOrder = "alphabetical" | "recent" | "cookTime";

const sortOptions = [
  {
    value: "alphabetical" as SortOrder,
    label: "A-Z",
    icon: SortAsc,
    description: "Sort alphabetically by name",
  },
  {
    value: "recent" as SortOrder,
    label: "Recent",
    icon: CalendarPlus,
    description: "Most recently added first",
  },
  {
    value: "cookTime" as SortOrder,
    label: "Cook Time",
    icon: Clock,
    description: "Shortest cook time first",
  },
] as const;

interface RecipePreferencesSectionProps {
  quickFilters: string[];
  onQuickFiltersChange: (filters: string[]) => void;
  defaultSortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

export function RecipePreferencesSection({
  quickFilters,
  onQuickFiltersChange,
  defaultSortOrder,
  onSortOrderChange,
}: RecipePreferencesSectionProps) {
  const selectedCount = quickFilters.length;
  const isAtLimit = selectedCount >= MAX_FILTERS;

  const toggleFilter = (filterId: string) => {
    const isSelected = quickFilters.includes(filterId);

    if (isSelected) {
      // Remove filter
      onQuickFiltersChange(quickFilters.filter((id) => id !== filterId));
    } else if (!isAtLimit) {
      // Add filter (only if under limit)
      onQuickFiltersChange([...quickFilters, filterId]);
    }
  };

  const resetToDefaults = () => {
    onQuickFiltersChange([...DEFAULT_QUICK_FILTER_IDS]);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={ChefHat}
          title="Recipe Preferences"
          description="Customize how you browse and discover recipes"
          accentColor="primary"
        />

        <div className="space-y-6">
          {/* Default Sort Order */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              Default Sort Order
            </Label>
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              {sortOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = defaultSortOrder === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => onSortOrderChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:border-muted hover:bg-hover"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isSelected ? "bg-primary/20" : "bg-elevated"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Choose how recipes are sorted by default in the browser
            </p>
          </div>

          <Separator />

          {/* Quick Filters Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                Quick Filters
              </Label>
              <Badge variant="secondary" className="text-xs">
                {selectedCount} of {MAX_FILTERS} selected
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Choose up to {MAX_FILTERS} filters to display in the recipe browser
            </p>

            {/* Filter Toggle Grid */}
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => {
                const isSelected = quickFilters.includes(filter.id);
                const isDisabled = !isSelected && isAtLimit;

                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    disabled={isDisabled}
                    className={cn(
                      "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-muted hover:bg-hover",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Reset Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="mt-2"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
