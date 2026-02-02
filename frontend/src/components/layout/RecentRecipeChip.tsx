"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useRecentRecipes } from "@/hooks/persistence";
import { cn } from "@/lib/utils";
import { RecipeIcon, type RecipeIconData } from "@/components/common/RecipeIcon";

interface RecentRecipesSectionProps {
  onNavigate?: () => void;
}

/**
 * Displays recently viewed recipes as clickable chips in the sidebar.
 * Shows up to 3 most recent recipes with emoji and truncated name.
 */
export function RecentRecipesSection({ onNavigate }: RecentRecipesSectionProps) {
  const { recentRecipes, isLoaded } = useRecentRecipes();

  // Don't render if not loaded or no recent recipes
  if (!isLoaded || recentRecipes.length === 0) {
    return null;
  }

  return (
    <div className="px-3 py-4 border-t border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Recent
        </span>
      </div>

      {/* Recipe chips - vertical stack */}
      <div className="grid grid-cols-1 gap-2">
        {recentRecipes.map((recipe) => (
          <RecentRecipeChip
            key={recipe.id}
            id={recipe.id}
            name={recipe.name}
            icon={recipe.icon}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

interface RecentRecipeChipProps {
  id: number;
  name: string;
  icon: RecipeIconData;
  onClick?: () => void;
}

function RecentRecipeChip({ id, name, icon, onClick }: RecentRecipeChipProps) {
  return (
    <Link
      href={`/recipes/${id}`}
      onClick={onClick}
      className={cn(
        // Base styles
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        // Background and border
        "bg-elevated/50 border border-border",
        // Text
        "text-sm text-muted-foreground",
        // Hover effects
        "hover:bg-hover hover:border-border-strong hover:text-foreground",
        // Interactive utility for lift + press feedback
        "interactive-subtle"
      )}
    >
      <RecipeIcon icon={icon} className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </Link>
  );
}
