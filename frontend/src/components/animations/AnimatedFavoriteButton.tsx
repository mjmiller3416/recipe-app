"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface AnimatedFavoriteButtonProps {
  /** Whether the item is favorited */
  isFavorite: boolean;
  /** Callback when favorite is toggled */
  onToggle: () => void | Promise<void>;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
  /** Show particle burst effect */
  showParticles?: boolean;
  /** Enable haptic feedback on mobile */
  enableHaptic?: boolean;
}

const sizeStyles = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const particleSizes = {
  sm: "w-1 h-1",
  md: "w-1.5 h-1.5",
  lg: "w-2 h-2",
};

/**
 * Animated favorite button with heart fill and particle burst
 *
 * Features:
 * - Heart fills with scale animation
 * - Particle burst effect on favorite
 * - Background pulse
 * - Haptic feedback on mobile
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * <AnimatedFavoriteButton
 *   isFavorite={recipe.is_favorite}
 *   onToggle={() => handleToggleFavorite(recipe.id)}
 * />
 * ```
 */
export function AnimatedFavoriteButton({
  isFavorite,
  onToggle,
  disabled = false,
  size = "md",
  className,
  showParticles = true,
  enableHaptic = true,
}: AnimatedFavoriteButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (disabled) return;

      // Trigger haptic on mobile
      if (enableHaptic && !isFavorite) {
        triggerHaptic("success");
      }

      setIsAnimating(true);
      await onToggle();

      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 400);
    },
    [disabled, isFavorite, onToggle, enableHaptic]
  );

  // Calculate particle positions (6 particles in a circle)
  const particles = showParticles
    ? Array.from({ length: 6 }, (_, i) => ({
        angle: i * 60, // 60 degrees apart
        delay: i * 0.02,
      }))
    : [];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative transition-transform",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
        "active:scale-90",
        disabled && "cursor-not-allowed opacity-50",
        sizeStyles[size],
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
    >
      {/* Background burst effect */}
      <AnimatePresence>
        {isAnimating && isFavorite && (
          <motion.div
            className="absolute inset-0 rounded-full bg-error/30"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Heart icon with scale animation */}
      <motion.div
        animate={
          isAnimating
            ? { scale: [1, 1.3, 0.9, 1.1, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Heart
          className={cn(
            "transition-colors duration-200",
            iconSizes[size],
            isFavorite ? "fill-error text-error" : "text-muted hover:text-error"
          )}
        />
      </motion.div>

      {/* Particle burst */}
      <AnimatePresence>
        {isAnimating && isFavorite && showParticles && (
          <>
            {particles.map((particle, i) => {
              const radians = (particle.angle * Math.PI) / 180;
              const distance = size === "lg" ? 24 : size === "md" ? 20 : 16;

              return (
                <motion.div
                  key={i}
                  className={cn(
                    "absolute rounded-full bg-error",
                    particleSizes[size]
                  )}
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: size === "lg" ? -4 : size === "md" ? -3 : -2,
                    marginTop: size === "lg" ? -4 : size === "md" ? -3 : -2,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: Math.cos(radians) * distance,
                    y: Math.sin(radians) * distance,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: particle.delay,
                  }}
                />
              );
            })}
          </>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * CSS-only version for reduced motion or simpler needs
 */
export function FavoriteButtonSimple({
  isFavorite,
  onToggle,
  disabled = false,
  size = "md",
  className,
}: Omit<AnimatedFavoriteButtonProps, "showParticles" | "enableHaptic">) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) onToggle();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
        "active:scale-90 hover:scale-110",
        disabled && "cursor-not-allowed opacity-50",
        sizeStyles[size],
        className
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
    >
      <Heart
        className={cn(
          "transition-all duration-200",
          iconSizes[size],
          isFavorite ? "fill-error text-error" : "text-muted hover:text-error"
        )}
      />
    </button>
  );
}