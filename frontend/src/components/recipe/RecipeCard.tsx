"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RecipeCardData } from "@/types";
import { FavoriteButton } from "../common/FavoriteButton";
import { RecipeBadge, RecipeBadgeGroup } from "./RecipeBadge";
import { RecipeCardImage } from "./RecipeImage";

interface RecipeCardBaseProps {
  recipe: RecipeCardData;
  onClick?: (recipe: RecipeCardData) => void;
  onFavoriteToggle?: (recipe: RecipeCardData) => void;
  className?: string;
  size?: "small" | "medium" | "large";
  showCategory?: boolean;
  showFavorite?: boolean;
  maxIngredientsDisplay?: number; // For large card
}

// ============================================================================
// UNIFIED RECIPE CARD - Supports all 3 sizes
// ============================================================================

export function RecipeCard({
  recipe,
  onClick,
  onFavoriteToggle,
  className,
  size = "medium",
  showCategory = true,
  showFavorite = true,
  maxIngredientsDisplay = 8,
}: RecipeCardBaseProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      // Use custom onClick handler if provided
      onClick(recipe);
    } else {
      // Default behavior: navigate to recipe detail page
      router.push(`/recipes/${recipe.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(recipe);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Format total time
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render different sizes
  if (size === "small") {
    return <RecipeCardSmall
      recipe={recipe}
      onClick={handleClick}
      onFavoriteClick={handleFavoriteClick}
      onKeyDown={handleKeyDown}
      formatTime={formatTime}
      className={className}
      showCategory={showCategory}
      showFavorite={showFavorite}
    />;
  }

  if (size === "large") {
    return <RecipeCardLarge
      recipe={recipe}
      onClick={handleClick}
      onFavoriteClick={handleFavoriteClick}
      onKeyDown={handleKeyDown}
      formatTime={formatTime}
      className={className}
      showCategory={showCategory}
      showFavorite={showFavorite}
      maxIngredientsDisplay={maxIngredientsDisplay}
    />;
  }

  // Medium (default)
  return <RecipeCardMedium
    recipe={recipe}
    onClick={handleClick}
    onFavoriteClick={handleFavoriteClick}
    onKeyDown={handleKeyDown}
    formatTime={formatTime}
    className={className}
    showCategory={showCategory}
    showFavorite={showFavorite}
  />;
}

// ============================================================================
// SMALL CARD - Compact horizontal layout
// ============================================================================

interface CardVariantProps {
  recipe: RecipeCardData;
  onClick: () => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  formatTime: (minutes: number) => string;
  className?: string;
  showCategory: boolean;
  showFavorite: boolean;
  maxIngredientsDisplay?: number;
}

function RecipeCardSmall({
  recipe,
  onClick,
  onFavoriteClick,
  onKeyDown,
  formatTime,
  className,
  showFavorite,
}: CardVariantProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200 ease-in-out",
        "hover:shadow-lg hover:shadow-primary/5 hover:bg-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "pb-0 pt-0 gap-0",
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${recipe.name} recipe`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
          <RecipeCardImage
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            iconSize="sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {recipe.name}
          </h3>

          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{recipe.servings}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(recipe.totalTime)}</span>
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        {showFavorite && (
          <FavoriteButton
            isFavorite={recipe.isFavorite || false}
            onToggle={onFavoriteClick}
            variant="inline"
            size="sm"
          />
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// MEDIUM CARD - Standard featured card
// ============================================================================

function RecipeCardMedium({ 
  recipe, 
  onClick, 
  onFavoriteClick,
  onKeyDown,
  formatTime,
  className,
  showCategory,
}: CardVariantProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 ease-in-out",
        "hover:shadow-2xl hover:shadow-primary/15 hover:-translate-y-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "pb-0 pt-0 gap-0",
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${recipe.name} recipe`}
    >
      {/* Image Container - Fixed hover glitch */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-elevated">
        <RecipeCardImage
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
          iconSize="lg"
        />
        {/* Hover Overlay - Scales with image */}
        {recipe.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out group-hover:scale-105"
               style={{ transformOrigin: 'center center' }}
          />
        )}
        
        {/* Favorite Button */}
        <div className="absolute top-4 right-4">
          <FavoriteButton
            isFavorite={recipe.isFavorite || false}
            onToggle={onFavoriteClick}
            variant="overlay"
            size="md"
          />
        </div>

        {/* Meal Type Badge - Now at top-left, no category badge */}
        {showCategory && recipe.mealType && (
          <div className="absolute top-4 left-4">
            <RecipeBadge
              label={recipe.mealType}
              type="mealType"
              size="md"
              variant="overlay"
            />
          </div>
        )}
      </div>

      {/* Recipe Info */}
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {recipe.name}
        </h3>

        {/* Metadata Row */}
        <div className="flex items-center gap-6 text-base text-muted">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
            <div>
              <span className="font-semibold text-foreground">{recipe.servings}</span>
              <span className="text-sm ml-1">serving{recipe.servings !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
            <div>
              <span className="font-semibold text-foreground">{formatTime(recipe.totalTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// LARGE CARD - Traditional Recipe Card with Ingredients
// ============================================================================

function RecipeCardLarge({ 
  recipe, 
  onClick, 
  onFavoriteClick,
  onKeyDown,
  formatTime,
  className,
  showCategory,
  maxIngredientsDisplay = 8,
}: CardVariantProps) {
  const ingredients = recipe.ingredients || [];
  const displayedIngredients = ingredients.slice(0, maxIngredientsDisplay);
  const remainingCount = Math.max(0, ingredients.length - maxIngredientsDisplay);

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 ease-in-out",
        "hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "pb-0 pt-0 gap-0",
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${recipe.name} recipe`}
    >
      {/* Main Layout - Side by side */}
      <div className="flex flex-col md:flex-row">
        {/* Left: Image */}
        <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto overflow-hidden bg-elevated">
          <RecipeCardImage
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            iconSize="xl"
          />
        </div>

        {/* Right: Recipe Details */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          {/* Header Section */}
          <div className="space-y-4 mb-6">
            {/* Recipe Name + Favorite */}
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 flex-1">
                {recipe.name}
              </h3>
              
              {/* Favorite Button - Inline variant */}
              <FavoriteButton
                isFavorite={recipe.isFavorite || false}
                onToggle={onFavoriteClick}
                variant="inline"
                size="lg"
              />
            </div>

            {/* Badges Row */}
            {showCategory && (
              <RecipeBadgeGroup>
                {recipe.category && (
                  <RecipeBadge
                    label={recipe.category}
                    type="category"
                    size="md"
                  />
                )}
                {recipe.mealType && (
                  <RecipeBadge
                    label={recipe.mealType}
                    type="mealType"
                    size="md"
                  />
                )}
                {recipe.dietaryPreference && (
                  <RecipeBadge
                    label={recipe.dietaryPreference}
                    type="dietary"
                    size="md"
                  />
                )}
              </RecipeBadgeGroup>
            )}
          </div>

          {/* Ingredients Section */}
          <div className="flex-1 space-y-3 mb-6">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Ingredients
              {ingredients.length > 0 && (
                <span className="text-sm font-normal text-muted">
                  ({ingredients.length})
                </span>
              )}
            </h4>
            
            {ingredients.length > 0 ? (
              <div className="space-y-2">
                {/* Two column layout for ingredients */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-1.5">
                  {displayedIngredients.map((ingredient, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary mt-1">•</span>
                      <span className="flex-1">
                        <span className="font-medium">{ingredient.quantity} {ingredient.unit || ''}</span>
                        <span className="text-muted ml-1">{ingredient.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Overflow indicator */}
                {remainingCount > 0 && (
                  <div className="text-sm text-muted italic pt-2 border-t border-border">
                    ... and {remainingCount} more ingredient{remainingCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted italic">No ingredients listed</p>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Total Time</p>
                <p className="text-lg font-semibold text-foreground">{formatTime(recipe.totalTime)}</p>
              </div>
            </div>

            <div className="h-12 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted">Servings</p>
                <p className="text-lg font-semibold text-foreground">{recipe.servings}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// GRID LAYOUTS FOR DIFFERENT SIZES
// ============================================================================

interface RecipeCardGridProps {
  children: React.ReactNode;
  className?: string;
  size?: "small" | "medium" | "large";
}

export function RecipeCardGrid({ children, className, size = "medium" }: RecipeCardGridProps) {
  const gridClasses = {
    small: "grid grid-cols-1 gap-3",
    medium: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6",
    large: "grid grid-cols-1 gap-6",
  };

  return (
    <div className={cn(gridClasses[size], className)}>
      {children}
    </div>
  );
}