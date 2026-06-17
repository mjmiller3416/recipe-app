"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AssistantChatContent } from "./AssistantChatContent";

type DisplayMode = "normal" | "expanded";

interface AssistantPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantPopup({ open, onOpenChange }: AssistantPopupProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("normal");

  // Track viewport size to determine mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setDisplayMode("normal");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  // Handle escape key for desktop: expanded → normal → minimized → close
  useEffect(() => {
    if (!open || isMobile) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (displayMode === "expanded") {
          setDisplayMode("normal");
        } else {
          handleOpenChange(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isMobile, displayMode, handleOpenChange]);

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <div className="print:hidden">
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent
            side="bottom"
            className="h-sheet-mobile p-0 rounded-t-2xl [&>button[data-slot=sheet-close]]:hidden"
          >
            <SheetTitle className="sr-only">AI Assistant</SheetTitle>
            {/* Noise texture background */}
            <div className="absolute inset-0 bg-elevated noise-texture rounded-t-2xl opacity-60" />
            <div className="absolute inset-0 bg-elevated/95 rounded-t-2xl" />

            {/* Content */}
            <div className="relative h-full">
              <AssistantChatContent
                onClose={() => handleOpenChange(false)}
                isMobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  const getDimensions = () => {
    switch (displayMode) {
      case "normal":
        return { width: 384, height: 500, borderRadius: 16 };
      case "expanded":
        return { width: 672, height: "min(80vh, 700px)", borderRadius: 12 };
    }
  };

  const dimensions = getDimensions();
  const isExpanded = displayMode === "expanded";

  // Desktop: Floating popup with circular minimized state
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay for expanded mode */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="fixed inset-0 z-40 bg-background-intense/80 print:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDisplayMode("normal")}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>

          <motion.div
            className={cn(
              "fixed z-50 print:hidden overflow-hidden",
              isExpanded
                ? "inset-6 m-auto"
                : "bottom-6 right-6"
            )}
            initial={false}
            animate={{
              width: dimensions.width,
              height: dimensions.height,
              borderRadius: dimensions.borderRadius,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            {/* Main container */}
            <motion.div
              className={cn(
                "relative w-full h-full",
                "bg-elevated border border-border",
                "shadow-lg",
                "flex flex-col"
              )}
              initial={false}
              animate={{
                borderRadius: dimensions.borderRadius,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
            >
              {/* Noise texture background */}
              <div className="absolute inset-0 bg-elevated noise-texture opacity-60 rounded-[inherit]" />
              <div className="absolute inset-0 bg-elevated/95 rounded-[inherit]" />

              {/* Content */}
              <div className="relative flex-1 min-h-0">
                <AssistantChatContent
                  onClose={() => handleOpenChange(false)}
                  isExpanded={isExpanded}
                  onMinimize={() => handleOpenChange(false)}
                  onExpand={() => setDisplayMode("expanded")}
                  onCollapse={() => setDisplayMode("normal")}
                />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}