"use client";

import { cn } from "@/lib/utils";
import { getRecipeEmoji } from "@/lib/recipeEmoji";

// ============================================================================
// TYPES
// ============================================================================

interface SideChipProps {
  /** The name of the side dish */
  name: string;
  /** Optional category for more accurate emoji matching */
  category?: string;
  /** Called when the chip is clicked */
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// SIDE CHIP COMPONENT
// ============================================================================

/**
 * A compact chip displaying an emoji + side dish name.
 * Uses the getRecipeEmoji system to auto-assign relevant emojis.
 */
export function SideChip({ name, category, onClick, className }: SideChipProps) {
  const emoji = getRecipeEmoji(name, category);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-elevated border border-border",
        "hover:bg-hover hover:border-border-strong",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <span className="flex-shrink-0 text-base">{emoji}</span>
      <span className="text-sm text-foreground truncate">{name}</span>
    </button>
  );
}
