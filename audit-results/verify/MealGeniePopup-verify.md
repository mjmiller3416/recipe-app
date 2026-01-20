# Design System Audit Report: MealGeniePopup.tsx

**File:** `frontend/src/components/meal-genie/MealGeniePopup.tsx`
**File Type:** Component usage (not in `components/ui/`)
**Applicable Rules:** Part A (Component Usage), Part C (Layout & Spacing), Part E (Motion & Animation)

---

## Summary

| Category | Violations Found |
|----------|------------------|
| Critical | 2 |
| Moderate | 3 |
| Minor | 2 |

---

## Violations

### ≡ƒö┤ Critical Violations

#### 1. **Line 163-182: Raw `<Button>` with redundant interaction classes**
**Rule Violated:** A2 (No Raw Buttons with manual styles), A5 (No Redundant Interaction Classes)

The Button already handles hover states internally, but the code adds manual `group` + `group-hover:` patterns.

```tsx
// Current (line 163-182)
<Button
  variant="ghost"
  onClick={() => setIsMinimized(false)}
  className="w-full h-full rounded-full group"  // Γ¥î "group" for manual hover
  aria-label="Open Meal Genie chat"
>
  <motion.div ...>
    <Sparkles className="h-6 w-6 text-amber-500 group-hover:text-amber-400" />  // Γ¥î Manual hover
  </motion.div>
</Button>
```

**Issue:** `group-hover:text-amber-400` is redundant interaction styling that should be handled by the Button component or removed.

---

#### 2. **Lines 94-98, 127-135: Arbitrary pixel values in animation**
**Rule Violated:** A6 (Token Standardization - no arbitrary values)

```tsx
// Lines 94-98
animate={{
  width: isMinimized ? 56 : 384,   // Γ¥î Arbitrary: 56px, 384px
  height: isMinimized ? 56 : 500,  // Γ¥î Arbitrary: 56px, 500px
  borderRadius: isMinimized ? 28 : 16,  // Γ¥î Arbitrary: 28px, 16px
}}
```

**Recommendation:** These values should map to standard Tailwind scale:
- `56` ΓåÆ `w-14 h-14` (56px) Γ£ô Actually valid
- `384` ΓåÆ `w-96` (384px) Γ£ô Actually valid
- `500` ΓåÆ Non-standard, closest is `h-[500px]` or consider `max-h-[500px]`
- `28` ΓåÆ `rounded-[28px]` or `rounded-3xl` (24px)
- `16` ΓåÆ `rounded-2xl` (16px)

---

### ≡ƒƒá Moderate Violations

#### 3. **Lines 64-68, 138-144: Inline SVG noise texture**
**Rule Violated:** Part F4 (Glassmorphism patterns should be consistent)

```tsx
// Lines 64-68 and 138-144
style={{
  backgroundImage: `url("data:image/svg+xml,...")`,
}}
```

**Issue:** This inline SVG pattern is duplicated. Should be extracted to a reusable utility or CSS class.

---

#### 4. **Line 60: Arbitrary height value**
**Rule Violated:** A6 (No arbitrary values)

```tsx
className="h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)]"
```

**Context:** This is necessary for mobile safe area handling, but could be extracted to a utility class for consistency.

---

#### 5. **Line 180: Hardcoded color**
**Rule Violated:** A6 (Token Standardization)

```tsx
<Sparkles className="h-6 w-6 text-amber-500 group-hover:text-amber-400" />
```

**Issue:** `text-amber-500` and `text-amber-400` are not semantic tokens. Should use design system tokens.

**Recommendation:** If amber is the brand color for Meal Genie, define tokens like:
- `--meal-genie-accent: #f59e0b` in globals.css
- Or use existing `text-warning` if semantically appropriate

---

### ≡ƒƒí Minor Violations

#### 6. **Line 115: Hardcoded RGBA color**
**Rule Violated:** A6 (No hardcoded colors)

```tsx
style={{
  background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
}}
```

**Issue:** The amber glow effect uses hardcoded RGBA. Should reference CSS variable.

---

#### 7. **Lines 99-103, 131-135: Spring animation values could be standardized**
**Rule Violated:** E3 (Easing standardization)

```tsx
transition={{
  type: "spring",
  stiffness: 400,
  damping: 30,
}}
```

**Context:** These are acceptable per E3 guidelines (`stiffness: 400, damping: 30` for snappy), but they're duplicated. Consider extracting to a shared constant.

---

## Γ£à Compliance Highlights

The component does several things well:

1. **Line 167:** Proper `aria-label` on icon button Γ£ô
2. **Lines 56, 90:** Uses `print:hidden` for print media Γ£ô
3. **Uses proper shadcn/ui components:** `Sheet`, `SheetContent`, `Button` Γ£ô
4. **Uses `cn` utility** for className composition Γ£ô
5. **Follows responsive pattern** with `isMobile` state Γ£ô
6. **Proper escape key handling** with cleanup Γ£ô

---

## Corrected Code

```tsx
"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MealGenieChatContent } from "./MealGenieChatContent";

interface MealGeniePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extracted animation constants (E3 compliance)
const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Extracted dimensions (map to Tailwind scale where possible)
const POPUP_DIMENSIONS = {
  minimized: { width: 56, height: 56, borderRadius: 28 },  // w-14 h-14
  expanded: { width: 384, height: 500, borderRadius: 16 }, // w-96, rounded-2xl
};

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
        if (!isMinimized) {
          setIsMinimized(true);
        } else {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, isMobile, isMinimized, onOpenChange]);

  // Noise texture background component to avoid duplication
  const NoiseBackground = ({ className }: { className?: string }) => (
    <>
      <div
        className={cn("absolute inset-0 bg-elevated opacity-60", className)}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className={cn("absolute inset-0 bg-elevated/[0.97]", className)} />
    </>
  );

  // Mobile: Use Sheet component
  if (isMobile) {
    return (
      <div className="print:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="h-[calc(100dvh-env(safe-area-inset-top,0px)-2rem)] p-0 rounded-t-2xl"
          >
            <NoiseBackground className="rounded-t-2xl" />

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

  // Desktop: Floating popup with circular minimized state
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed bottom-6 right-6 z-50 print:hidden",
            "overflow-hidden"
          )}
          initial={false}
          animate={{
            width: isMinimized 
              ? POPUP_DIMENSIONS.minimized.width 
              : POPUP_DIMENSIONS.expanded.width,
            height: isMinimized 
              ? POPUP_DIMENSIONS.minimized.height 
              : POPUP_DIMENSIONS.expanded.height,
            borderRadius: isMinimized 
              ? POPUP_DIMENSIONS.minimized.borderRadius 
              : POPUP_DIMENSIONS.expanded.borderRadius,
          }}
          transition={SPRING_SNAPPY}
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
              background: "radial-gradient(circle, hsl(var(--warning) / 0.15) 0%, transparent 70%)",
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
              borderRadius: isMinimized 
                ? POPUP_DIMENSIONS.minimized.borderRadius 
                : POPUP_DIMENSIONS.expanded.borderRadius,
            }}
            transition={SPRING_SNAPPY}
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
                      onClick={() => setIsMinimized(false)}
                      className="w-full h-full rounded-full"
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
                        <Sparkles className="h-6 w-6 text-warning" />
                      </motion.div>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: 0.1 }}
                    className="h-full"
                  >
                    <MealGenieChatContent
                      onClose={() => onOpenChange(false)}
                      isMinimized={isMinimized}
                      onMinimize={() => setIsMinimized(true)}
                      onExpand={() => setIsMinimized(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## Key Changes Summary

| Line(s) | Change | Rule |
|---------|--------|------|
| 163 | Removed `group` class from Button | A5 |
| 180 | Changed `text-amber-500 group-hover:text-amber-400` ΓåÆ `text-warning` | A6, A5 |
| 115 | Changed hardcoded RGBA to `hsl(var(--warning) / 0.15)` | A6 |
| 94-103 | Extracted animation constants to `SPRING_SNAPPY` and `POPUP_DIMENSIONS` | E3 |
| 64-68 | Extracted `NoiseBackground` component to reduce duplication | DRY |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Why semantic tokens matter here:**
1. `text-amber-500` creates a hidden dependency on Tailwind's amber palette. If you later rebrand Meal Genie, you'd need to find-replace across files.
2. Using `text-warning` (which maps to `--warning: #f59e0b`) means the color is controlled from one place in `globals.css`.
3. The `group-hover` pattern was bypassing Button's built-in hover states, which could cause inconsistent hover behavior if the Button variant changes.
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
