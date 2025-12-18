"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, Trash2, Undo } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface SwipeableEntryProps {
  /** The content to make swipeable */
  children: React.ReactNode;
  /** Callback when swiped left (e.g., complete) */
  onSwipeLeft?: () => void;
  /** Callback when swiped right (e.g., delete) */
  onSwipeRight?: () => void;
  /** Label for left swipe action */
  leftLabel?: string;
  /** Label for right swipe action */
  rightLabel?: string;
  /** Icon for left swipe action */
  leftIcon?: React.ReactNode;
  /** Icon for right swipe action */
  rightIcon?: React.ReactNode;
  /** Background color for left action */
  leftColor?: string;
  /** Background color for right action */
  rightColor?: string;
  /** Whether the entry is in completed state (changes left action) */
  isCompleted?: boolean;
  /** Whether to enable haptic feedback */
  enableHaptic?: boolean;
  /** Disable swipe gestures */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

const SWIPE_THRESHOLD = 80; // px required to trigger action
const MAX_SWIPE = 120; // maximum swipe distance

/**
 * Swipeable entry wrapper for mobile touch interactions
 *
 * Swipe left to complete/uncomplete, swipe right to delete
 *
 * @example
 * ```tsx
 * <SwipeableEntry
 *   onSwipeLeft={() => handleToggleComplete(entry.id)}
 *   onSwipeRight={() => handleRemove(entry.id)}
 *   isCompleted={entry.is_completed}
 * >
 *   <PlannerEntryCard entry={entry} />
 * </SwipeableEntry>
 * ```
 */
export function SwipeableEntry({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel,
  rightLabel = "Remove",
  leftIcon,
  rightIcon = <Trash2 className="h-5 w-5" />,
  leftColor = "bg-success",
  rightColor = "bg-error",
  isCompleted = false,
  enableHaptic = true,
  disabled = false,
  className,
}: SwipeableEntryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);

  // Motion values for tracking swipe
  const x = useMotionValue(0);

  // Derive opacity from swipe distance
  const leftOpacity = useTransform(x, [-MAX_SWIPE, -20, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 20, MAX_SWIPE], [0, 0.5, 1]);

  // Derive scale for action icons
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, -20, 0], [1.2, 1, 0.8]);
  const rightScale = useTransform(x, [0, 20, SWIPE_THRESHOLD], [0.8, 1, 1.2]);

  // Dynamic labels based on completed state
  const effectiveLeftLabel = leftLabel ?? (isCompleted ? "Undo" : "Complete");
  const effectiveLeftIcon =
    leftIcon ?? (isCompleted ? <Undo className="h-5 w-5" /> : <Check className="h-5 w-5" />);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    hasTriggeredHaptic.current = false;
  }, []);

  const handleDrag = useCallback(
    (_: any, info: PanInfo) => {
      // Trigger haptic when crossing threshold
      if (enableHaptic && !hasTriggeredHaptic.current) {
        const offset = info.offset.x;
        if (Math.abs(offset) >= SWIPE_THRESHOLD) {
          triggerHaptic("medium");
          hasTriggeredHaptic.current = true;
        }
      }
    },
    [enableHaptic]
  );

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      setIsDragging(false);

      const offset = info.offset.x;
      const velocity = info.velocity.x;

      // Determine if swipe was fast enough or far enough
      const shouldTrigger =
        Math.abs(offset) >= SWIPE_THRESHOLD || Math.abs(velocity) >= 500;

      if (shouldTrigger) {
        if (offset < 0 && onSwipeLeft) {
          // Swipe left - complete/uncomplete
          if (enableHaptic) triggerHaptic("success");
          onSwipeLeft();
        } else if (offset > 0 && onSwipeRight) {
          // Swipe right - delete
          if (enableHaptic) triggerHaptic("medium");
          onSwipeRight();
        }
      }
    },
    [onSwipeLeft, onSwipeRight, enableHaptic]
  );

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={constraintsRef}
      className={cn("relative overflow-hidden rounded-lg", className)}
    >
      {/* Left action background (swipe left reveals) */}
      <motion.div
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end px-4",
          leftColor
        )}
        style={{ opacity: leftOpacity }}
      >
        <motion.div
          className="flex items-center gap-2 text-white"
          style={{ scale: leftScale }}
        >
          <span className="font-medium text-sm">{effectiveLeftLabel}</span>
          {effectiveLeftIcon}
        </motion.div>
      </motion.div>

      {/* Right action background (swipe right reveals) */}
      <motion.div
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start px-4",
          rightColor
        )}
        style={{ opacity: rightOpacity }}
      >
        <motion.div
          className="flex items-center gap-2 text-white"
          style={{ scale: rightScale }}
        >
          {rightIcon}
          <span className="font-medium text-sm">{rightLabel}</span>
        </motion.div>
      </motion.div>

      {/* Main content - draggable */}
      <motion.div
        className={cn("relative bg-elevated", isDragging && "cursor-grabbing")}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hook to detect if touch is available
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints for older IE
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
}