"use client";

import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShoppingListIndicatorProps {
  included: boolean;
  disabled?: boolean;
  onToggle: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
}

/**
 * ShoppingListIndicator - Toggle for including/excluding meals from shopping list
 * 
 * Visual states:
 * - Included: Teal cart icon
 * - Excluded: Grey cart icon with red X overlay
 * - Disabled: Muted, non-interactive (for completed meals)
 * 
 * Uses secondary (teal) for included state per design spec
 */
export function ShoppingListIndicator({
  included,
  disabled = false,
  onToggle,
  size = "md",
}: ShoppingListIndicatorProps) {
  const sizeClasses = {
    sm: "p-1",
    md: "p-1.5",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
  };

  const xSizes = {
    sm: "h-2.5 w-2.5 -top-0.5 -right-0.5",
    md: "h-3 w-3 -top-1 -right-1",
  };

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "rounded-md transition-all flex-shrink-0",
        sizeClasses[size],
        disabled
          ? "text-muted cursor-not-allowed"
          : included
            ? "text-secondary hover:bg-secondary/20"
            : "text-muted hover:bg-hover"
      )}
      title={included ? "Included in shopping list" : "Excluded from shopping list"}
      aria-label={included ? "Remove from shopping list" : "Add to shopping list"}
    >
      <div className="relative">
        <ShoppingCart className={iconSizes[size]} />
        {!included && (
          <X
            className={cn(
              "absolute text-destructive",
              xSizes[size]
            )}
            strokeWidth={3}
          />
        )}
      </div>
    </button>
  );
}

/**
 * ShoppingListLegend - Legend explaining the shopping list indicators
 */
export function ShoppingListLegend() {
  return (
    <div>
      <p className="text-xs text-muted mb-2">Shopping List:</p>
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 text-xs">
          <ShoppingCart className="h-3.5 w-3.5 text-secondary" />
          <span className="text-muted">Included</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="relative">
            <ShoppingCart className="h-3.5 w-3.5 text-muted" />
            <X
              className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-destructive"
              strokeWidth={3}
            />
          </div>
          <span className="text-muted">Excluded</span>
        </div>
      </div>
    </div>
  );
}