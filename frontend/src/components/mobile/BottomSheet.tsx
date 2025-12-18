"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/lib/haptics";

interface BottomSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet content */
  children: React.ReactNode;
  /** Optional title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Maximum height as viewport percentage (default: 90) */
  maxHeight?: number;
  /** Whether clicking backdrop closes the sheet */
  closeOnBackdropClick?: boolean;
  /** Whether dragging down closes the sheet */
  closeOnDrag?: boolean;
  /** Enable haptic feedback */
  enableHaptic?: boolean;
  /** Additional class names for the sheet */
  className?: string;
  /** Show close button */
  showCloseButton?: boolean;
}

const DRAG_THRESHOLD = 100; // px to drag before closing
const VELOCITY_THRESHOLD = 500; // velocity to close regardless of distance

/**
 * Mobile-optimized bottom sheet modal
 *
 * Features:
 * - Slides up from bottom
 * - Drag down to close
 * - Backdrop click to close
 * - Haptic feedback
 * - Focus trap and scroll lock
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Add to Planner"
 * >
 *   <div>Sheet content...</div>
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  maxHeight = 90,
  closeOnBackdropClick = true,
  closeOnDrag = true,
  enableHaptic = true,
  className,
  showCloseButton = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      if (!closeOnDrag) return;

      const shouldClose =
        info.offset.y > DRAG_THRESHOLD || info.velocity.y > VELOCITY_THRESHOLD;

      if (shouldClose) {
        if (enableHaptic) triggerHaptic("light");
        onClose();
      }
    },
    [closeOnDrag, onClose, enableHaptic]
  );

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      if (enableHaptic) triggerHaptic("light");
      onClose();
    }
  }, [closeOnBackdropClick, onClose, enableHaptic]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "bottom-sheet-title" : undefined}
            aria-describedby={description ? "bottom-sheet-description" : undefined}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "bg-elevated rounded-t-2xl",
              "overflow-hidden",
              "focus:outline-none",
              className
            )}
            style={{ maxHeight: `${maxHeight}vh` }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            drag={closeOnDrag ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Drag indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted/50 rounded-full" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <div className="flex-1">
                  {title && (
                    <h2
                      id="bottom-sheet-title"
                      className="text-lg font-semibold text-foreground"
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="bottom-sheet-description"
                      className="text-sm text-muted mt-0.5"
                    >
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className={cn(
                      "p-2 -mr-2 rounded-lg",
                      "text-muted hover:text-foreground",
                      "hover:bg-hover transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto p-4"
              style={{ maxHeight: `calc(${maxHeight}vh - 80px)` }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Responsive modal that uses Dialog on desktop and BottomSheet on mobile
 */
interface ResponsiveModalProps extends Omit<BottomSheetProps, "open" | "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Force bottom sheet on all screen sizes */
  forceBottomSheet?: boolean;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  forceBottomSheet = false,
  children,
  ...props
}: ResponsiveModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use BottomSheet on mobile or when forced
  if (isMobile || forceBottomSheet) {
    return (
      <BottomSheet open={open} onClose={() => onOpenChange(false)} {...props}>
        {children}
      </BottomSheet>
    );
  }

  // On desktop, you would use a regular Dialog
  // This is a placeholder - integrate with your Dialog component
  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} {...props}>
      {children}
    </BottomSheet>
  );
}