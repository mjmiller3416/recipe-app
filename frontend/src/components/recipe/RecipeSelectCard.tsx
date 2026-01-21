"use client";

import { Check, Heart, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface RecipeSelectCardProps {
  /** Recipe data to display */
  recipe: RecipeCardData;

  /** Whether this card is currently selected */
  isSelected?: boolean;

  /** Called when the card is clicked */
  onSelect?: (recipe: RecipeCardData) => void;

  /** The type of selection - affects badge label ("Main" vs "Side") */
  selectionType?: "main" | "side";

  /** Additional class names */
  className?: string;
}

// ============================================================================
// RECIPE SELECT CARD COMPONENT
// ============================================================================

/**
 * RecipeSelectCard - Recipe card with selection state indicator
 *
 * Features:
 * - Displays recipe image with RecipeImage fallback
 * - Shows recipe name, servings, and time
 * - Selection checkmark overlay when selected
 * - "Main" or "Side" badge indicator
 * - Favorite heart indicator
 * - Hover zoom animation on image
 * - Uses existing design tokens from globals.css
 */
export function RecipeSelectCard({
  recipe,
  isSelected = false,
  onSelect,
  selectionType = "main",
  className,
}: RecipeSelectCardProps) {
  const handleClick = () => {
    onSelect?.(recipe);
  };

  return (
    <Card
      interactive
      onClick={handleClick}
      className={cn(
        "overflow-hidden group p-0 gap-0",
        isSelected && "ring-2 ring-primary shadow-glow-primary",
        isSelected && "animate-bounce-subtle",
        className
      )}
    >
      {/* Image Section */}
      <div className="relative h-32 bg-gradient-to-br from-hover to-elevated overflow-hidden">
        {/* Recipe Image with hover zoom */}
        <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300">
          <RecipeImage
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            iconSize="md"
            showLoadingState={false}
          />
        </div>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Selection checkmark indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in z-10">
            <Check className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
        )}

        {/* Favorite heart indicator */}
        {recipe.isFavorite && (
          <div className="absolute top-3 left-3 w-7 h-7 bg-overlay backdrop-blur-sm rounded-full flex items-center justify-center z-10">
            <Heart className="w-4 h-4 text-error fill-current" />
          </div>
        )}

        {/* Type badge (Main/Side) */}
        <div className="absolute bottom-3 left-3 z-10">
          <Badge variant={selectionType === "side" ? "secondary" : "default"} size="sm">
            {selectionType === "side" ? "Side" : "Main"}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-base mb-2 truncate group-hover:text-primary transition-colors">
          {recipe.name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {recipe.servings}
          </span>
          {recipe.totalTime > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {recipe.totalTime}m
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
