"use client";

import {
  UtensilsCrossed,
  ChefHat,
  Salad,
  Plus,
  X,
  Clock,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircularImage } from "@/components/common/CircularImage";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface MealPreviewPanelProps {
  /** Currently selected main dish (null if empty) */
  mainDish: RecipeCardData | null;

  /** Currently selected side dishes (max 3) */
  sides: RecipeCardData[];

  /** Called when the empty main dish slot is clicked */
  onSelectMain?: () => void;

  /** Called when the main dish remove button is clicked */
  onRemoveMain?: () => void;

  /** Called when a side dish remove button is clicked */
  onRemoveSide?: (recipeId: number) => void;

  /** Called when the "Add to Meal Queue" button is clicked */
  onAddToQueue?: () => void;

  /** Whether the add button is in loading/submitting state */
  isSubmitting?: boolean;

  /** Whether to show the header (default true, set false when inside a dialog with its own title) */
  showHeader?: boolean;

  /** Additional class names */
  className?: string;
}

// ============================================================================
// MEAL PREVIEW PANEL COMPONENT
// ============================================================================

/**
 * MealPreviewPanel - Vertical sidebar for building a meal (main + sides)
 *
 * Features:
 * - Header with icon and title ("Meal Preview")
 * - Main dish slot (large, with image, name, time, remove button)
 * - Side dish slots (3 compact slots, filled or empty placeholder)
 * - Stats summary (total time, avg servings) - shown when main is selected
 * - "Add to Meal Queue" button (disabled until main is selected)
 * - Empty slot placeholders with dashed border and "Add a side dish" text
 * - Remove buttons on filled slots (X icon, destructive hover state)
 */
export function MealPreviewPanel({
  mainDish,
  sides,
  onSelectMain,
  onRemoveMain,
  onRemoveSide,
  onAddToQueue,
  isSubmitting = false,
  showHeader = true,
  className,
}: MealPreviewPanelProps) {
  // Computed values
  const isComplete = !!mainDish;
  const emptySlotCount = 3 - sides.length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header - hidden when inside a dialog with its own title */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Meal Preview</h2>
            <p className="text-sm text-muted-foreground">Build your perfect meal</p>
          </div>
        </div>
      )}

      {/* Main Dish Section */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <ChefHat className="w-4 h-4" />
          Main Dish
          {!mainDish && <span className="text-primary">*required</span>}
        </label>

        {mainDish ? (
          <div className="animate-scale-in">
            <Card className="p-4 border-primary-muted bg-primary-surface">
              <div className="flex items-center gap-4">
                <CircularImage
                  src={mainDish.imageUrl}
                  alt={mainDish.name}
                  size="xl"
                  zoom={1.2}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {mainDish.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {mainDish.servings}
                    </span>
                    {mainDish.totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {mainDish.totalTime}m
                      </span>
                    )}
                  </div>
                </div>
                {onRemoveMain && (
                  <button
                    onClick={onRemoveMain}
                    className="w-8 h-8 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <button
            onClick={onSelectMain}
            className="w-full border-2 border-dashed border-border rounded-2xl p-6 text-center animate-pulse-soft hover:border-primary hover:bg-primary-surface/50 transition-colors cursor-pointer"
          >
            <ChefHat className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground/60">
              Click to select a main dish
            </p>
          </button>
        )}
      </div>

      {/* Sides Section */}
      <div className="flex-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Salad className="w-4 h-4" />
          Sides
          <span className="text-muted-foreground/60 font-normal">
            ({sides.length}/3)
          </span>
        </label>

        <div className="space-y-2">
          {/* Filled side slots */}
          {sides.map((side, index) => (
            <div
              key={side.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="p-3 border-secondary-muted bg-secondary-surface">
                <div className="flex items-center gap-3">
                  <CircularImage
                    src={side.imageUrl}
                    alt={side.name}
                    size="sm"
                    zoom={1.2}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {side.name}
                    </h4>
                    {side.totalTime > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {side.totalTime}m
                      </p>
                    )}
                  </div>
                  {onRemoveSide && (
                    <button
                      onClick={() => onRemoveSide(Number(side.id))}
                      className="w-7 h-7 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center text-error transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            </div>
          ))}

          {/* Empty side slots */}
          {Array.from({ length: emptySlotCount }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border border-dashed border-border rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground/60">Add a side dish</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-4">
        <Button
          variant="default"
          size="lg"
          onClick={onAddToQueue}
          disabled={!isComplete || isSubmitting}
          className="w-full"
        >
          <Plus className="w-5 h-5" />
          {isSubmitting ? "Adding..." : "Add to Meal Queue"}
        </Button>

        {!isComplete && (
          <p className="text-xs text-center text-muted-foreground/60 mt-2">
            Select a main dish to continue
          </p>
        )}
      </div>
    </div>
  );
}
