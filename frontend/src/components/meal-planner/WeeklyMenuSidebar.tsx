"use client";

import { useState } from "react";
import { Plus, Bookmark, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MealQueueCard } from "./MealQueueCard";
import { SavedMealsDropdown } from "./SavedMealsDropdown";
import { ShoppingListLegend } from "./ShoppingListIndicator";
import type { MealQueueEntry, SavedMeal } from "./types";

interface WeeklyMenuSidebarProps {
  activeMeals: MealQueueEntry[];
  completedMeals: MealQueueEntry[];
  selectedId: number | null;
  savedMeals: SavedMeal[];
  onSelectMeal: (id: number) => void;
  onToggleShoppingList: (id: number) => void;
  onToggleComplete: (id: number) => void;
  onClearCompleted: () => void;
  onAddMeal: (savedMealId: number) => void;
  onCreateMeal?: () => void;
}

/**
 * WeeklyMenuSidebar - Sidebar with independently scrolling meal list
 * 
 * Structure:
 * - Fixed header (shrink-0)
 * - Scrollable meal list (flex-1 with overflow-y-auto)
 * - Fixed footer (shrink-0)
 * 
 * The sidebar itself has overflow-hidden to contain everything.
 */
export function WeeklyMenuSidebar({
  activeMeals,
  completedMeals,
  selectedId,
  savedMeals,
  onSelectMeal,
  onToggleShoppingList,
  onToggleComplete,
  onClearCompleted,
  onAddMeal,
  onCreateMeal,
}: WeeklyMenuSidebarProps) {
  const [showSavedMeals, setShowSavedMeals] = useState(false);

  return (
    <aside className="w-[320px] shrink-0 bg-sidebar border-l border-border flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="px-4 py-5 shrink-0">
        <h2 className="text-lg font-semibold text-foreground">
          This Week's Menu
        </h2>
      </div>

      {/* Scrollable Meal List - THIS is the only thing that scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {/* Active Meals */}
          {activeMeals.map((meal) => (
            <MealQueueCard
              key={meal.id}
              meal={meal}
              isSelected={meal.id === selectedId}
              onSelect={() => onSelectMeal(meal.id)}
              onToggleShoppingList={() => onToggleShoppingList(meal.id)}
              onToggleComplete={() => onToggleComplete(meal.id)}
            />
          ))}

          {/* Empty state */}
          {activeMeals.length === 0 && completedMeals.length === 0 && (
            <div className="text-center py-8 text-muted">
              <p className="text-sm">No meals planned yet</p>
            </div>
          )}

          {/* Completed Section */}
          {completedMeals.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-3">
                <div className="flex-1 border-t border-dashed border-border" />
                <span className="text-xs text-muted uppercase tracking-wider">
                  Completed
                </span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>

              {completedMeals.map((meal) => (
                <MealQueueCard
                  key={meal.id}
                  meal={meal}
                  isSelected={meal.id === selectedId}
                  isCompleted
                  onSelect={() => onSelectMeal(meal.id)}
                  onToggleShoppingList={() => onToggleShoppingList(meal.id)}
                  onToggleComplete={() => onToggleComplete(meal.id)}
                />
              ))}

              <button
                onClick={onClearCompleted}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "py-2 px-3 rounded-lg text-sm",
                  "text-muted hover:text-destructive hover:bg-destructive/10",
                  "transition-colors"
                )}
              >
                <Trash2 className="h-4 w-4" />
                Clear Completed
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer - Always visible at bottom */}
      <div className="shrink-0 p-4 border-t border-border">
        <Button
          onClick={onCreateMeal}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Meal
        </Button>

        <button
          onClick={() => setShowSavedMeals(!showSavedMeals)}
          className={cn(
            "w-full py-2 mt-2 text-sm",
            "text-primary hover:text-primary-hover",
            "flex items-center justify-center gap-2",
            "transition-colors"
          )}
        >
          <Bookmark className="h-4 w-4" />
          Browse Saved Meals
          {showSavedMeals ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showSavedMeals && (
          <SavedMealsDropdown meals={savedMeals} onAddMeal={onAddMeal} className="mt-2" />
        )}
      </div>
    </aside>
  );
}