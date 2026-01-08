"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecipeEmoji } from "@/lib/recipeEmoji";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

interface SideChipProps {
  /** The name of the side dish (omit for empty slot) */
  name?: string;
  /** Optional category for more accurate emoji matching */
  category?: string;
  /** Called when the chip is clicked */
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// SIDE CHIP COMPONENT
// ============================================================================

export function SideChip({ name, category, onClick, className }: SideChipProps) {
  // 1. EMPTY SLOT VARIANT (Uses your new 'dashed' variant)
  if (!name) {
    return (
      <Button
        variant="dashed"
        onClick={onClick}
        className={cn("font-normal", className)} // Chips often look better with regular weight
      >
        <Plus strokeWidth={1.5} />
        Add Side
      </Button>
    );
  }

  // 2. FILLED SLOT VARIANT (Uses 'outline' variant)
  const emoji = getRecipeEmoji(name, category);

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn("font-normal justify-start", className)}
    >
      <span className="text-base shrink-0">{emoji}</span>
      <span className="truncate">{name}</span>
    </Button>
  );
}