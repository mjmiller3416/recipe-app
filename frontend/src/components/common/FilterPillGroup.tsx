"use client";

import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface FilterPillOption {
  id: string;
  label: string;
}

interface FilterPillProps {
  option: FilterPillOption;
  isActive: boolean;
  onToggle: (id: string) => void;
  variant?: "default" | "glass";
}

export interface FilterPillGroupProps {
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
// FilterPill Component
// ============================================================================

/**
 * FilterPill - Individual toggle pill button
 */
function FilterPill({ option, isActive, onToggle, variant = "default" }: FilterPillProps) {
  // Variant-specific styles for inactive state
  const inactiveStyles = {
    default: "bg-elevated text-foreground border-border hover:bg-hover hover:border-border",
    glass: "bg-elevated/80 text-foreground border-border/50 hover:bg-elevated hover:border-border",
  };

  return (
    <button
      onClick={() => onToggle(option.id)}
      className={cn(
        // Base styles - py-2.5 ensures minimum 44px touch target on mobile
        "px-4 py-2.5 rounded-full text-sm font-medium",
        "transition-all duration-200",
        "border",

        // Glass variant gets backdrop blur
        variant === "glass" && "backdrop-blur-sm",

        // Active vs inactive states
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
          : inactiveStyles[variant]
      )}
    >
      {option.label}
    </button>
  );
}

// ============================================================================
// FilterPillGroup Component
// ============================================================================

/**
 * FilterPillGroup - Reusable group of toggle filter pills
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
 * <FilterPillGroup
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
 * <FilterPillGroup
 *   options={filterOptions}
 *   activeIds={activeIds}
 *   onToggle={handleToggle}
 *   variant="glass"
 *   align="center"
 * />
 */
export function FilterPillGroup({
  options,
  activeIds,
  onToggle,
  variant = "default",
  align = "start",
  className,
}: FilterPillGroupProps) {
  // Normalize activeIds to work with both Set and array
  const isActive = (id: string): boolean => {
    if (activeIds instanceof Set) {
      return activeIds.has(id);
    }
    return activeIds.includes(id);
  };

  // Alignment classes
  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        alignClasses[align],
        className
      )}
    >
      {options.map((option) => (
        <FilterPill
          key={option.id}
          option={option}
          isActive={isActive(option.id)}
          onToggle={onToggle}
          variant={variant}
        />
      ))}
    </div>
  );
}
