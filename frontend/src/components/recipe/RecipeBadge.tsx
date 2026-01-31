"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RecipeGroupResponseDTO } from "@/types";

type BadgeType = "category" | "mealType" | "dietary" | "group";
type BadgeSize = "sm" | "md" | "lg";
type BadgeVariant = "overlay" | "inline" | "outline";

interface RecipeBadgeProps {
  label: string;
  type: BadgeType;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
  groups?: RecipeGroupResponseDTO[]; // Only used when type="group"
}

/**
 * RecipeBadge - Reusable badge component for recipe metadata
 *
 * @param label - Text to display in badge
 * @param type - Badge type determines color scheme
 *   - "category": Teal/primary color (e.g., "Pasta", "Seafood")
 *   - "mealType": Purple/secondary color (e.g., "Dinner", "Lunch")
 *   - "dietary": Gray/accent color (e.g., "Vegetarian", "Pescatarian")
 *   - "group": Muted color for recipe groups
 * @param size - Badge size: sm, md, lg
 * @param variant - "overlay" for floating on images, "inline" for content areas, "outline" for bordered style
 * @param className - Additional classes
 * @param groups - Array of RecipeGroupResponseDTO (only used when type="group")
 */
export function RecipeBadge({
  label,
  type,
  size = "md",
  variant = "inline",
  className,
  groups = [],
}: RecipeBadgeProps) {
  // Type-specific color schemes (using CSS variables)
  const typeColors = {
    category: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    mealType: "bg-[var(--secondary)]/90 text-[var(--secondary-foreground)]",
    dietary: "bg-[var(--accent)] text-[var(--accent-foreground)]",
    group: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  };

  // Outline variant uses border + text color instead of filled background
  const outlineTypeColors = {
    category: "bg-transparent border-2 border-[var(--primary)] text-[var(--primary)]",
    mealType: "bg-transparent border-2 border-[var(--secondary)] text-[var(--secondary)]",
    dietary: "bg-transparent border-2 border-[var(--accent)] text-[var(--accent-foreground)]",
    group: "bg-transparent border-2 border-[var(--accent)] text-[var(--accent)]",
  };

  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };

  // Variant-specific styles
  const variantClasses = {
    overlay: "backdrop-blur-md shadow-elevated",
    inline: "",
    outline: "",
  };

  // For group badges with multiple groups, show count with tooltip
  if (type === "group" && groups.length > 0) {
    const primaryGroupName = groups[0].name;
    const additionalCount = groups.length - 1;

    const badgeContent = (
      <span
        className={cn(
          // Base styles
          "rounded-full font-medium inline-flex items-center relative",
          "transition-colors duration-200",

          // Type colors
          variant === "outline" ? outlineTypeColors[type] : typeColors[type],

          // Size
          sizeClasses[size],

          // Variant
          variantClasses[variant],

          // Add right margin when count badge is present to prevent overlap
          additionalCount > 0 && "mr-3",

          // Custom classes
          className
        )}
      >
        {primaryGroupName.toLowerCase()}
        {additionalCount > 0 && (
          <span
            className={cn(
              "absolute -top-2 -right-2",
              "inline-flex items-center justify-center rounded-full font-medium",
              "bg-primary text-primary-foreground border-2 border-card",
              size === "sm" ? "size-5 text-[10px]" : "size-6 text-xs"
            )}
          >
            +{additionalCount}
          </span>
        )}
      </span>
    );

    // If multiple groups, wrap in tooltip
    if (additionalCount > 0) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {groups.map((group) => (
                <div key={group.id} className="text-sm">
                  {group.name}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }

    return badgeContent;
  }

  // Standard badge rendering for non-group types
  return (
    <span
      className={cn(
        // Base styles
        "rounded-full font-medium",
        "transition-colors duration-200",

        // Type colors (outline variant uses border instead of background)
        variant === "outline" ? outlineTypeColors[type] : typeColors[type],

        // Size
        sizeClasses[size],

        // Variant
        variantClasses[variant],

        // Custom classes
        className
      )}
    >
      {type === "group" ? label.toLowerCase() : label}
    </span>
  );
}

/**
 * RecipeBadgeGroup - Wrapper for multiple badges
 * Handles spacing and wrapping
 */
interface RecipeBadgeGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function RecipeBadgeGroup({ children, className }: RecipeBadgeGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}