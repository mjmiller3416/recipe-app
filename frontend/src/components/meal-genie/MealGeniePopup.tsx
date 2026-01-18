"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MealGenieChatContent } from "./MealGenieChatContent";

interface MealGeniePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MealGeniePopup({ open, onOpenChange }: MealGeniePopupProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Track viewport size to determine mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reset minimized state when popup is closed
  useEffect(() => {
    if (!open) {
      setIsMinimized(true);
    }
  }, [open]);

  // Handle escape key for desktop
  useEffect(() => {
    if (!open || isMobile) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isMobile, onOpenChange]);

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} className="print:hidden">
        <SheetContent
          side="bottom"
          className="h-[calc(100dvh-env(safe-area-inset-top,0px))] p-0 rounded-t-xl"
        >
          {/* Noise texture background */}
          <div
            className="absolute inset-0 bg-elevated rounded-t-xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-elevated/[0.97] rounded-t-xl" />

          {/* Content */}
          <div className="relative h-full">
            <MealGenieChatContent onClose={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Floating popup
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 print:hidden",
        "w-96",
        isMinimized ? "h-11" : "h-[500px]",
        "bg-elevated rounded-xl border border-border",
        "shadow-lg",
        "flex flex-col overflow-hidden",
        // Animation
        "transition-all duration-200 ease-out",
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      {/* Noise texture background */}
      <div
        className="absolute inset-0 bg-elevated rounded-xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-elevated/[0.97] rounded-xl" />

      {/* Content */}
      <div className="relative flex-1 min-h-0">
        {open && (
          <MealGenieChatContent
            onClose={() => onOpenChange(false)}
            isMinimized={isMinimized}
            onMinimize={() => setIsMinimized(true)}
            onExpand={() => setIsMinimized(false)}
          />
        )}
      </div>
    </div>
  );
}
