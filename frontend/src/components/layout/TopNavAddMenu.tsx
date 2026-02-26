"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, UtensilsCrossed, ChevronDown } from "lucide-react";
import { useRecipeWizardDialog } from "@/lib/providers/RecipeWizardProvider";
import { cn } from "@/lib/utils";

export function TopNavAddMenu() {
  const router = useRouter();
  const { openWizard, isOpen: wizardOpen } = useRecipeWizardDialog();
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddRecipe = () => {
    setOpen(false);
    openWizard();
  };

  const handleAddMeal = () => {
    setOpen(false);
    router.push("/meal-planner?action=create");
  };

  const cancelClose = useCallback(() => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimeout.current = setTimeout(() => setOpen(false), 150);
  }, [cancelClose]);

  const handleMouseEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
          "transition-colors duration-200",
          wizardOpen
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-hover/50"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Plus className="h-4 w-4" strokeWidth={wizardOpen ? 2 : 1.5} />
        <span>Add</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 z-50",
            "min-w-[8rem] rounded-lg p-1",
            "bg-card text-popover-foreground shadow-floating",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
          role="menu"
        >
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              "cursor-pointer select-none transition-colors duration-150 ease-out",
              "hover:bg-accent hover:text-accent-foreground active:bg-accent/80"
            )}
            role="menuitem"
            onClick={handleAddRecipe}
          >
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
            Add Recipe
          </button>
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              "cursor-pointer select-none transition-colors duration-150 ease-out",
              "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
              "[&_svg:not([class*='text-'])]:text-muted-foreground"
            )}
            role="menuitem"
            onClick={handleAddMeal}
          >
            <UtensilsCrossed className="h-4 w-4" strokeWidth={1.5} />
            Add Meal
          </button>
        </div>
      )}
    </div>
  );
}
