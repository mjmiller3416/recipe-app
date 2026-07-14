"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CarouselMealCard } from "./CarouselMealCard";
import { CarouselEmptySlot } from "./CarouselEmptySlot";
import type { PlannerEntryResponseDTO } from "@/types/planner";

// ============================================================================
// TYPES
// ============================================================================

interface CarouselCardGridProps {
  entries: (PlannerEntryResponseDTO | null)[];
  pageOffset: number;
  completingId: number | null;
  onComplete: (entryId: number) => void;
  onViewRecipe: (recipeId: number) => void;
  /** Number of grid columns. Defaults to 3. */
  columns?: number;
  /** Inline style overrides (width, CSS custom properties, etc.). */
  style?: React.CSSProperties;
  /** Additional class names (animation, z-index, pointer-events). */
  className?: string;
}

// ============================================================================
// CAROUSEL CARD GRID COMPONENT
// ============================================================================

/**
 * CarouselCardGrid — absolutely-positioned grid layer for carousel cards.
 *
 * Renders cards in a CSS grid. Supports two modes:
 * - **Static** (default): 3-column grid filling its parent.
 * - **Strip**: Variable columns with explicit width for transition animations.
 */
export const CarouselCardGrid = forwardRef<HTMLDivElement, CarouselCardGridProps>(
  function CarouselCardGrid(
    {
      entries,
      pageOffset,
      completingId,
      onComplete,
      onViewRecipe,
      columns = 3,
      style,
      className,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-0 left-0 h-full grid gap-3.5",
          className
        )}
        style={{
          width: "100%",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          ...style,
        }}
      >
        {entries.map((entry, i) =>
          entry ? (
            <CarouselMealCard
              key={entry.id}
              entry={entry}
              slotNumber={pageOffset + i + 1}
              isCompleting={completingId === entry.id}
              onComplete={onComplete}
              onViewRecipe={onViewRecipe}
            />
          ) : (
            <CarouselEmptySlot key={`empty-${i}`} />
          )
        )}
      </div>
    );
  }
);
