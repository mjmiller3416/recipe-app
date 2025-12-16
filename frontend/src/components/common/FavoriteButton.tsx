"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent) => void;
  variant?: "overlay" | "inline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * FavoriteButton - Reusable favorite toggle button with animations
 * 
 * @param isFavorite - Whether item is favorited
 * @param onToggle - Click handler (must call e.stopPropagation() internally)
 * @param variant - "overlay" for floating on images, "inline" for content areas
 * @param size - Button size: sm (small cards), md (medium cards), lg (large cards)
 * @param className - Additional classes
 */
export function FavoriteButton({
  isFavorite,
  onToggle,
  variant = "overlay",
  size = "md",
  className,
}: FavoriteButtonProps) {
  // Size variants for the button
  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-2",
  };

  // Size variants for the heart icon
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-6 w-6",
  };

  // Variant-specific styles
  const variantClasses = {
    overlay: cn(
      "rounded-full backdrop-blur-md shadow-lg",
      "bg-background/70 hover:bg-background/90"
    ),
    inline: cn(
      "rounded-lg",
      "hover:bg-elevated"
    ),
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        // Base styles
        "transition-all duration-200 flex-shrink-0",
        
        // Hover scale effect
        "hover:scale-110 active:scale-95",
        
        // Color states
        isFavorite 
          ? "text-[var(--error)]" 
          : "text-muted hover:text-[var(--error)]",
        
        // Size
        sizeClasses[size],
        
        // Variant
        variantClasses[variant],
        
        // Custom classes
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          // Icon size
          iconSizes[size],
          
          // Transition
          "transition-all duration-200",
          
          // Fill when favorited
          isFavorite && "fill-current",
          
          // Pulse animation on favorite
          isFavorite && "animate-pulse-once"
        )}
      />
    </button>
  );
}