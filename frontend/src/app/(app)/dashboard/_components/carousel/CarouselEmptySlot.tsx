import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface CarouselEmptySlotProps {
  className?: string;
}

// ============================================================================
// CAROUSEL EMPTY SLOT COMPONENT
// ============================================================================

/**
 * CarouselEmptySlot — dashed placeholder card for empty carousel positions.
 *
 * Rendered when the current page has fewer than PER_PAGE meals
 * (e.g. last page has 1 meal — remaining 2 slots show this).
 * Matches CarouselMealCard height (h-96) for grid alignment.
 */
export function CarouselEmptySlot({ className }: CarouselEmptySlotProps) {
  return (
    <div
      className={cn(
        "h-96 rounded-xl border border-dashed border-border",
        "flex items-center justify-center",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">All caught up</span>
    </div>
  );
}
