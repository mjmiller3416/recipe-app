"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCompletionCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox is toggled */
  onToggle: () => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-7 h-7",
};

const checkmarkSizes = {
  sm: "p-0.5",
  md: "p-1",
  lg: "p-1.5",
};

/**
 * Animated completion checkbox with satisfying draw effect
 *
 * Features:
 * - Checkmark draws in with SVG path animation
 * - Background color transition
 * - Ring pulse animation on check
 * - Reduced motion support
 *
 * @example
 * ```tsx
 * <AnimatedCompletionCheckbox
 *   checked={entry.is_completed}
 *   onToggle={() => handleToggle(entry.id)}
 *   disabled={isLoading}
 * />
 * ```
 */
export function AnimatedCompletionCheckbox({
  checked,
  onToggle,
  disabled = false,
  className,
  size = "md",
}: AnimatedCompletionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        sizeStyles[size],
        checked
          ? "border-success bg-success"
          : "border-border bg-transparent hover:border-muted",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && !checked && "hover:bg-hover",
        className
      )}
    >
      {/* Checkmark with draw animation */}
      <AnimatePresence mode="wait">
        {checked && (
          <motion.svg
            key="checkmark"
            viewBox="0 0 24 24"
            className={cn(
              "absolute inset-0 w-full h-full text-white",
              checkmarkSizes[size]
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.path
              d="M5 12l5 5L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Success ring pulse */}
      <AnimatePresence>
        {checked && (
          <motion.span
            className="absolute inset-0 rounded-md ring-2 ring-success"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * CSS-only version for reduced motion or when Framer Motion isn't available
 */
export function CompletionCheckboxSimple({
  checked,
  onToggle,
  disabled = false,
  className,
  size = "md",
}: AnimatedCompletionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onToggle();
      }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        sizeStyles[size],
        checked
          ? "border-success bg-success"
          : "border-border bg-transparent hover:border-muted",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && !checked && "hover:bg-hover",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn(
          "w-full h-full text-white transition-all duration-200",
          checkmarkSizes[size],
          checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
        )}
      >
        <path
          d="M5 12l5 5L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}