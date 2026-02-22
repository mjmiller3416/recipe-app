"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/quantityUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeBannerImage } from "@/components/recipe/RecipeBannerImage";
import { RecipeBadge, RecipeBadgeGroup } from "@/components/recipe/RecipeBadge";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { Clock, Check, ExternalLink, Loader2, UtensilsCrossed } from "lucide-react";
import type { PlannerEntryResponseDTO } from "@/types/planner";

// ============================================================================
// TYPES
// ============================================================================

interface CarouselMealCardProps {
  entry: PlannerEntryResponseDTO;
  slotNumber: number;
  isCompleting?: boolean;
  onComplete: (entryId: number) => void;
  onViewRecipe?: (recipeId: number) => void;
  className?: string;
}

// ============================================================================
// CAROUSEL MEAL CARD COMPONENT
// ============================================================================

/**
 * CarouselMealCard — fixed-height meal card for the dashboard carousel.
 *
 * Displays a recipe hero image with position/favorite/cook-time overlays,
 * recipe badges, side count, and Mark Done / Recipe action buttons.
 * The flex-col body with a spacer keeps actions pinned to the bottom
 * regardless of content height.
 */
export function CarouselMealCard({
  entry,
  slotNumber,
  isCompleting = false,
  onComplete,
  onViewRecipe,
  className,
}: CarouselMealCardProps) {
  const recipe = entry.main_recipe;
  const sideCount = entry.side_recipe_ids?.length ?? 0;
  const hasBadges = recipe?.recipe_category || recipe?.meal_type;

  return (
    <Card
      className={cn(
        // Fixed height for carousel grid alignment
        "h-96 gap-0 p-0",

        // Interactive card behavior
        "group cursor-pointer overflow-hidden",
        "liftable hover:bg-hover",

        // Completion fade animation (matches MealQueueItem pattern)
        "transition-all duration-300",
        isCompleting && "opacity-0 scale-[0.97]",

        className
      )}
    >
      {/* ── Hero Section ── */}
      <div className="relative w-full overflow-hidden">
        <RecipeBannerImage
          bannerSrc={recipe?.banner_image_path}
          fallbackSrc={recipe?.reference_image_path}
          alt={entry.meal_name || "Meal"}
          aspectRatio="16/9"
          className="transition-transform duration-300 group-hover:scale-105"
        />

        {/* Position Badge — top left */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-background/70 backdrop-blur-md text-xs font-semibold text-foreground">
            #{slotNumber}
          </span>
        </div>

        {/* Favorite Indicator — top right */}
        {recipe?.is_favorite && (
          <div className="absolute top-2 right-2">
            <FavoriteButton
              isFavorite
              onToggle={() => {}}
              readOnly
              variant="overlay"
              size="sm"
            />
          </div>
        )}

        {/* Cook Time — bottom right */}
        {recipe?.total_time != null && (
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/70 backdrop-blur-md text-xs font-medium text-foreground">
              <Clock className="size-3" strokeWidth={1.5} />
              {formatTime(recipe.total_time)}
            </span>
          </div>
        )}
      </div>

      {/* ── Body Section ── */}
      <div className="flex-1 flex flex-col p-3 pt-2.5 gap-2">
        {/* Meal Name */}
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {entry.meal_name || "Unnamed Meal"}
        </h3>

        {/* Recipe Badges */}
        {hasBadges && (
          <RecipeBadgeGroup className="gap-1.5">
            {recipe?.recipe_category && (
              <RecipeBadge
                label={recipe.recipe_category}
                type="category"
                size="sm"
              />
            )}
            {recipe?.meal_type && (
              <RecipeBadge
                label={recipe.meal_type}
                type="mealType"
                size="sm"
              />
            )}
          </RecipeBadgeGroup>
        )}

        {/* Side Count */}
        {sideCount > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <UtensilsCrossed className="size-3.5" strokeWidth={1.5} />
            + {sideCount} side{sideCount > 1 ? "s" : ""}
          </p>
        )}

        {/* Spacer — pushes actions to the bottom */}
        <div className="flex-1" />

        {/* ── Actions Footer ── */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(entry.id);
            }}
            disabled={isCompleting}
            className="flex-1"
            aria-label="Mark meal as completed"
          >
            {isCompleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" strokeWidth={1.5} />
            )}
            Mark Done
          </Button>

          {entry.main_recipe_id && onViewRecipe && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const recipeId = entry.main_recipe_id;
                if (recipeId) onViewRecipe(recipeId);
              }}
              disabled={isCompleting}
              aria-label="View recipe details"
            >
              <ExternalLink className="size-4" strokeWidth={1.5} />
              Recipe
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
