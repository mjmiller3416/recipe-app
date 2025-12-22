"use client";

import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MealSelection } from "./meal-display/MealSelection";
import { WeeklyMenu, MenuListItem } from "./meal-display/WeeklyMenu";
import { plannerApi } from "@/lib/api";
import { MealSelectionResponseDTO } from "@/types";

export function MealPlannerPage() {
  // State for meals list
  const [meals, setMeals] = useState<MealSelectionResponseDTO[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch meals on mount
  useEffect(() => {
    async function fetchMeals() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await plannerApi.getMeals();
        setMeals(data);

        // Auto-select first meal if available
        if (data.length > 0 && selectedMealId === null) {
          setSelectedMealId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meals");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMeals();
  }, []);

  // Transform API data to MenuListItem format for WeeklyMenu
  const menuItems: MenuListItem[] = meals.map((meal) => ({
    id: meal.id,
    name: meal.meal_name,
    imageUrl: meal.main_recipe?.reference_image_path ?? null,
  }));

  // Handle meal selection from WeeklyMenu
  const handleMealSelect = (item: MenuListItem) => {
    setSelectedMealId(item.id);
  };

  // Handle Add Meal button click (placeholder for now)
  const handleAddMealClick = () => {
    console.log("Add Meal clicked - to be implemented");
  };

  // Placeholder handlers for footer buttons
  const handleMarkComplete = () => {
    console.log("Mark Complete clicked - to be implemented");
  };

  const handleEditMeal = () => {
    console.log("Edit Meal clicked - to be implemented");
  };

  const handleRemoveFromMenu = () => {
    console.log("Remove from Menu clicked - to be implemented");
  };

  return (
    <PageLayout
      title="Meal Planner"
      description="Plan your weekly meals"
      fillViewport
    >
      {/* GRID CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 h-full min-h-0">

        {/* LEFT COLUMN: SELECTED MEAL */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex-shrink-0">
            Selected Meal
          </h2>

          {/* Scrollable Area for the meal display */}
          <ScrollArea className="flex-1 -mr-4 pr-4">
            {/* Keep mealId hardcoded for now as requested */}
            <MealSelection mealId={selectedMealId ?? 10} />
            <div className="h-4" />
          </ScrollArea>

          {/* Footer - Action Buttons */}
          <div className="flex-shrink-0 pt-6 flex gap-4">
            <Button
              onClick={handleMarkComplete}
              size="xl"
              className="flex-1"
            >
              Mark Complete
            </Button>
            <Button
              onClick={handleEditMeal}
              variant="outline"
              size="xl"
              className="flex-1"
            >
              Edit Meal
            </Button>
            <Button
              onClick={handleRemoveFromMenu}
              variant="outline"
              size="xl"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            >
              Remove from Menu
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: WEEKLY MENU */}
        <div className="hidden lg:flex flex-col min-h-0">
          <WeeklyMenu
            items={menuItems}
            selectedId={selectedMealId}
            onItemClick={handleMealSelect}
            onAddMealClick={handleAddMealClick}
            className="h-full"
          />
        </div>
      </div>
    </PageLayout>
  );
}