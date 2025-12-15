"use client";

import { cn } from "@/lib/utils";

type BadgeType = "category" | "mealType" | "dietary";
type BadgeSize = "sm" | "md" | "lg";
type BadgeVariant = "overlay" | "inline";

interface RecipeBadgeProps {
  label: string;
  type: BadgeType;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * RecipeBadge - Reusable badge component for recipe metadata
 * 
 * @param label - Text to display in badge
 * @param type - Badge type determines color scheme
 *   - "category": Teal/primary color (e.g., "Pasta", "Seafood")
 *   - "mealType": Purple/secondary color (e.g., "Dinner", "Lunch")
 *   - "dietary": Gray/accent color (e.g., "Vegetarian", "Pescatarian")
 * @param size - Badge size: sm, md, lg
 * @param variant - "overlay" for floating on images, "inline" for content areas
 * @param className - Additional classes
 */
export function RecipeBadge({
  label,
  type,
  size = "md",
  variant = "inline",
  className,
}: RecipeBadgeProps) {
  // Type-specific color schemes (using CSS variables)
  const typeColors = {
    category: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    mealType: "bg-[var(--secondary)]/90 text-[var(--secondary-foreground)]",
    dietary: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  };

  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
  };

  // Variant-specific styles
  const variantClasses = {
    overlay: "backdrop-blur-md shadow-lg",
    inline: "",
  };

  return (
    <span
      className={cn(
        // Base styles
        "rounded-full font-medium",
        "transition-colors duration-200",
        
        // Type colors
        typeColors[type],
        
        // Size
        sizeClasses[size],
        
        // Variant
        variantClasses[variant],
        
        // Custom classes
        className
      )}
    >
      {label}
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