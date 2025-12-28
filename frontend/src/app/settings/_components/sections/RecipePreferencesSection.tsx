"use client";

import { ChefHat, Filter, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QUICK_FILTERS, DEFAULT_QUICK_FILTER_IDS } from "@/lib/constants";
import { SectionHeader } from "../SectionHeader";

const MAX_FILTERS = 5;

interface RecipePreferencesSectionProps {
  quickFilters: string[];
  onQuickFiltersChange: (filters: string[]) => void;
}

export function RecipePreferencesSection({
  quickFilters,
  onQuickFiltersChange,
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
          {/* Quick Filters Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted" />
                Quick Filters
              </Label>
              <Badge variant="secondary" className="text-xs">
                {selectedCount} of {MAX_FILTERS} selected
              </Badge>
            </div>

            <p className="text-xs text-muted">
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
                        : "border-border bg-card text-muted hover:border-muted hover:bg-hover",
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
