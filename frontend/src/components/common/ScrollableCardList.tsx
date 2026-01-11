"use client";

import { cn } from "@/lib/utils";

interface ScrollableCardListProps {
  children: React.ReactNode;
  /** Additional classes for the outer scrollable container */
  className?: string;
  /** Additional classes for the inner content wrapper */
  innerClassName?: string;
}

/**
 * ScrollableCardList - A scrollable container that preserves card shadows
 *
 * Problem: When using `overflow-y-auto`, card shadows get clipped at container edges.
 * Solution: This component adds padding inside the scroll area so shadows have room to render.
 *
 * The default p-4 (16px) padding accommodates shadow-elevated which has up to 32px blur.
 * For cards with smaller shadows (like shadow-lg), p-2 may be sufficient.
 *
 * Usage:
 * ```tsx
 * <ScrollableCardList className="max-h-[40vh]">
 *   <div className="space-y-2">
 *     {items.map(item => <Card key={item.id}>...</Card>)}
 *   </div>
 * </ScrollableCardList>
 * ```
 */
export function ScrollableCardList({
  children,
  className,
  innerClassName,
}: ScrollableCardListProps) {
  return (
    <div className={cn("overflow-y-auto", className)}>
      <div className={cn("p-4", innerClassName)}>{children}</div>
    </div>
  );
}
