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
 * WeeklyMenuSidebar - Right sidebar showing the meal queue
 * 
 * Sections:
 * - Active meals (ordered list)
 * - Completed meals (greyed, below divider)
 * - Add Meal button
 * - Browse Saved Meals expandable section
 * - Shopping list legend
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
    <aside className="w-80 bg-sidebar border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          This Week's Menu
        </h2>
      </div>

      {/* Scrollable Queue Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
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

        {/* Empty state for active */}
        {activeMeals.length === 0 && completedMeals.length === 0 && (
          <div className="text-center py-8 text-muted">
            <p className="text-sm">No meals planned yet</p>
          </div>
        )}

        {/* Completed Section */}
        {completedMeals.length > 0 && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-2 py-3">
              <div className="flex-1 border-t border-dashed border-border" />
              <span className="text-xs text-muted uppercase tracking-wider">
                Completed
              </span>
              <div className="flex-1 border-t border-dashed border-border" />
            </div>

            {/* Completed Meals */}
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

            {/* Clear Completed Button */}
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

      {/* Footer - Add Meal Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Button
          onClick={onCreateMeal}
          className="w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Meal
        </Button>

        {/* Browse Saved Meals Toggle */}
        <button
          onClick={() => setShowSavedMeals(!showSavedMeals)}
          className={cn(
            "w-full py-2 px-4 text-sm",
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

        {/* Saved Meals Dropdown */}
        {showSavedMeals && (
          <SavedMealsDropdown meals={savedMeals} onAddMeal={onAddMeal} />
        )}
      </div>

      {/* Shopping List Legend */}
      <div className="p-4 border-t border-border">
        <ShoppingListLegend />
      </div>
    </aside>
  );
}