"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface PullToRefreshProps {
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Content to wrap with pull-to-refresh */
  children: React.ReactNode;
  /** Distance needed to trigger refresh (default: 80) */
  threshold?: number;
  /** Maximum pull distance (default: 120) */
  maxPull?: number;
  /** Enable haptic feedback */
  enableHaptic?: boolean;
  /** Whether refresh is currently disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Pull-to-refresh wrapper for mobile interfaces
 *
 * @example
 * ```tsx
 * <PullToRefresh onRefresh={async () => await fetchData()}>
 *   <div className="space-y-4">
 *     {items.map(item => <ItemCard key={item.id} item={item} />)}
 *   </div>
 * </PullToRefresh>
 * ```
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  enableHaptic = true,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    // Only allow pull when scrolled to top
    return window.scrollY === 0;
  }, [disabled, isRefreshing]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!canPull()) return;

      startY.current = e.touches[0].clientY;
      currentY.current = e.touches[0].clientY;
      hasTriggeredHaptic.current = false;
      setIsPulling(true);
    },
    [canPull]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || !canPull()) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      // Only track downward pulls
      if (diff > 0) {
        // Apply resistance as we pull further
        const resistance = 0.5;
        const distance = Math.min(diff * resistance, maxPull);
        setPullDistance(distance);

        // Haptic feedback when crossing threshold
        if (enableHaptic && distance >= threshold && !hasTriggeredHaptic.current) {
          triggerHaptic("medium");
          hasTriggeredHaptic.current = true;
        }
      }
    },
    [isPulling, canPull, maxPull, threshold, enableHaptic]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold while refreshing

      if (enableHaptic) triggerHaptic("success");

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, enableHaptic]);

  // Progress percentage for visual feedback
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex justify-center items-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance }}
      >
        <motion.div
          className="flex flex-col items-center gap-1"
          animate={{
            scale: isReady ? 1.1 : 1,
            opacity: progress > 0.2 ? 1 : progress * 5,
          }}
        >
          {isRefreshing ? (
            <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          ) : isReady ? (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown className="h-6 w-6 text-primary" />
            </motion.div>
          ) : (
            <motion.div
              style={{ rotate: progress * 180 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ArrowDown className="h-6 w-6 text-muted" />
            </motion.div>
          )}

          <span
            className={cn(
              "text-xs font-medium transition-colors",
              isReady || isRefreshing ? "text-primary" : "text-muted"
            )}
          >
            {isRefreshing
              ? "Refreshing..."
              : isReady
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </motion.div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? "none" : "transform 200ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Simple refresh indicator for loading states
 */
export function RefreshIndicator({
  isRefreshing,
  className,
}: {
  isRefreshing: boolean;
  className?: string;
}) {
  if (!isRefreshing) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center py-4",
        className
      )}
    >
      <RefreshCw className="h-5 w-5 text-primary animate-spin" />
      <span className="ml-2 text-sm text-muted">Refreshing...</span>
    </div>
  );
}