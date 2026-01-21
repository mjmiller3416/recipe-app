"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

export interface FilterPillOption {
  id: string;
  label: string;
}

export interface FilterBarProps {
  /** Array of filter options to display (can include extra properties beyond id/label) */
  options: readonly FilterPillOption[] | FilterPillOption[];
  /** Set or array of active filter IDs */
  activeIds: Set<string> | readonly string[] | string[];
  /** Callback when a pill is toggled */
  onToggle: (id: string) => void;
  /** Visual variant - "default" for solid, "glass" for transparent/blur effect */
  variant?: "default" | "glass";
  /** Container layout alignment */
  align?: "start" | "center" | "end";
  /** Additional classes for the container */
  className?: string;
}

// ============================================================================
// FilterBar Component
// ============================================================================

/**
 * FilterBar - Reusable row of toggle filter pills
 *
 * @example
 * // Basic usage with Set
 * const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
 *
 * const handleToggle = (id: string) => {
 *   setActiveFilters(prev => {
 *     const next = new Set(prev);
 *     if (next.has(id)) {
 *       next.delete(id);
 *     } else {
 *       next.add(id);
 *     }
 *     return next;
 *   });
 * };
 *
 * <FilterBar
 *   options={[
 *     { id: "breakfast", label: "Breakfast" },
 *     { id: "lunch", label: "Lunch" },
 *     { id: "dinner", label: "Dinner" },
 *   ]}
 *   activeIds={activeFilters}
 *   onToggle={handleToggle}
 * />
 *
 * @example
 * // Glass variant for use over images
 * <FilterBar
 *   options={filterOptions}
 *   activeIds={activeIds}
 *   onToggle={handleToggle}
 *   variant="glass"
 *   align="center"
 * />
 */
export function FilterBar({
  options,
  activeIds,
  onToggle,
  variant = "default",
  align = "start",
  className,
}: FilterBarProps) {

  // Helper to check active state
  const isActive = (id: string) =>
    activeIds instanceof Set ? activeIds.has(id) : activeIds.includes(id);

  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };

  return (
    <div className={cn("flex flex-wrap gap-2", alignClasses[align], className)}>
      {options.map((option) => {
        const active = isActive(option.id);

        return (
          <Button
            key={option.id}
            onClick={() => onToggle(option.id)}
            variant={active ? "default" : "ghost"}
            className={cn(
              "font-medium transition-all rounded-xl",
              // Inactive state: dark solid background with subtle border, muted text
              !active && variant !== "glass" && "bg-elevated border border-border-subtle text-muted-foreground hover:bg-hover hover:border-border hover:text-foreground",
              // Glass variant for overlays
              variant === "glass" && !active && "bg-elevated/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground"
            )}
            size="sm"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

// Backward compatibility alias
export const FilterPillGroup = FilterBar;
export type FilterPillGroupProps = FilterBarProps;
