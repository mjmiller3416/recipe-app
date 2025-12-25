"use client";

import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecipeCardImage } from "@/components/recipe/RecipeImage";
import { Card } from "@/components/ui/card";

// ============================================================================
// TYPES (No changes)
// ============================================================================

interface MainDishCardProps {
  name: string;
  imageUrl?: string | null;
  servings?: number | null;
  totalTime?: number | null;
  category?: string | null;
  mealType?: string | null;
  dietaryPreference?: string | null;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS (No changes)
// ============================================================================

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================================================
// MEAL BADGE COMPONENT
// ============================================================================

interface MealBadgeProps {
  children: React.ReactNode;
}

function MealBadge({ children }: MealBadgeProps) {
  return (
    <span className="px-2 py-1 text-base font-medium rounded-xl border-2 border-border-strong bg-transparent text-foreground-subtle capitalize">
      {children}
    </span>
  );
}

// ============================================================================
// METADATA ITEM COMPONENT (Updated)
// ============================================================================

interface MetadataItemProps {
  icon: React.ReactNode;
  label: string;
}

function MetadataItem({ icon, label }: MetadataItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-primary-light [&>svg]:h-[24px] [&>svg]:w-[24px]">
        {icon}
      </span>
      <span className="text-base font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// ============================================================================
// MAIN DISH CARD COMPONENT (Updated)
// ============================================================================

export function MainDishCard({
  name,
  imageUrl,
  servings,
  totalTime,
  category,
  mealType,
  dietaryPreference,
  onClick,
  className,
}: MainDishCardProps) {
  const hasBadges = mealType || category || dietaryPreference;

  return (
    <Card
      className={cn(
        "overflow-hidden bg-card border-border pt-0 pb-0 gap-0",
        "group relative",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {/* 1. IMAGE ASPECT RATIO: 
         Changed to aspect-[2.4/1]. This makes the image shorter and wider,
         closer to the "cinematic" banner look in the mock.
      */}
      <div className="relative aspect-[2.4/1] w-full overflow-hidden bg-muted">
        <RecipeCardImage
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          iconSize="xl"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
      </div>

      {/* 2. DETAILS SECTION:
         Increased padding to p-6 to give the larger text room to breathe.
      */}
      <div className="p-6 space-y-5">
        {/* Title - Increased from text-2xl to text-4xl for more visual impact */}
        <h3 className="text-4xl font-bold text-foreground leading-none tracking-tight">
          {name}
        </h3>

        {/* Metadata + Badges Row */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Metadata (Larger now) */}
          <div className="flex items-center gap-6">
            {servings != null && (
              <MetadataItem
                icon={<Users />}
                label={`${servings} servings`}
              />
            )}
            {totalTime != null && (
              <MetadataItem
                icon={<Clock />}
                label={`${formatTime(totalTime)} total`} 
              />
            )}
          </div>

          {/* Right: Badges */}
          {hasBadges && (
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {mealType && <MealBadge>{mealType}</MealBadge>}
              {category && <MealBadge>{category}</MealBadge>}
              {dietaryPreference && <MealBadge>{dietaryPreference}</MealBadge>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}