"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MealGenieChatContent } from "./MealGenieChatContent";

type DisplayMode = "minimized" | "normal" | "expanded";

interface MealGeniePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealGeniePopup({ open, onOpenChange }: MealGeniePopupProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("minimized");

  // Track viewport size to determine mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset display mode when popup is closed
  useEffect(() => {
    if (!open) {
      setDisplayMode("minimized");
    }
  }, [open]);

  // Handle escape key for desktop: expanded → normal → minimized → close
  useEffect(() => {
    if (!open || isMobile) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (displayMode === "expanded") {
          setDisplayMode("normal");
        } else if (displayMode === "normal") {
          setDisplayMode("minimized");
        } else {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isMobile, displayMode, onOpenChange]);

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <div className="print:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] p-0 rounded-t-2xl"
          >
            {/* Noise texture background */}
            <div
              className="absolute inset-0 bg-elevated rounded-t-2xl opacity-60"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute inset-0 bg-elevated/[0.97] rounded-t-2xl" />

            {/* Content */}
            <div className="relative h-full">
              <MealGenieChatContent 
                onClose={() => onOpenChange(false)} 
                isMobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Compute dimensions and position based on display mode
  const getDimensions = () => {
    switch (displayMode) {
      case "minimized":
        return { width: 56, height: 56, borderRadius: 28 };
      case "normal":
        return { width: 384, height: 500, borderRadius: 16 };
      case "expanded":
        return { width: 672, height: "min(80vh, 700px)", borderRadius: 12 };
    }
  };

  const dimensions = getDimensions();
  const isExpanded = displayMode === "expanded";
  const isMinimized = displayMode === "minimized";

  // Desktop: Floating popup with circular minimized state
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay for expanded mode */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="fixed inset-0 z-40 bg-black/80 print:hidden"
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
                ? "inset-0 m-auto"
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
            style={{
              maxWidth: isExpanded ? "calc(100vw - 48px)" : undefined,
              maxHeight: isExpanded ? "calc(100vh - 48px)" : undefined,
            }}
          >
            {/* Outer glow effect for minimized state */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={false}
              animate={{
                opacity: isMinimized ? 1 : 0,
                scale: isMinimized ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
              }}
            />

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
              <div
                className="absolute inset-0 bg-elevated opacity-60"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  borderRadius: "inherit",
                }}
              />
              <div
                className="absolute inset-0 bg-elevated/[0.97]"
                style={{ borderRadius: "inherit" }}
              />

              {/* Content */}
              <div className="relative flex-1 min-h-0">
                {/* Minimized state - circular button with icon */}
                <AnimatePresence mode="wait">
                  {isMinimized ? (
                    <motion.div
                      key="minimized"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      className="w-full h-full"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setDisplayMode("normal")}
                        className="w-full h-full rounded-full group"
                        aria-label="Open Meal Genie chat"
                      >
                        <motion.div
                          animate={{
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut"
                          }}
                        >
                          <Sparkles className="size-7 text-primary" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: 0.1 }}
                      className="h-full"
                    >
                      <MealGenieChatContent
                        onClose={() => onOpenChange(false)}
                        isMinimized={isMinimized}
                        isExpanded={isExpanded}
                        onMinimize={() => setDisplayMode("minimized")}
                        onExpand={() => setDisplayMode("expanded")}
                        onCollapse={() => setDisplayMode("normal")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}