"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { WeeklyMenuSidebar } from "./WeeklyMenu";
import { CreateMealModal, type NewMealData } from "./CreateMealModal";
import { EmptyMenuState } from "./EmptyMenuState";
import { useMealQueue } from "@/hooks/useMealQueue";

/**
 * MealPlannerPage - Main layout for Meal Planner
 *
 * Uses PageLayout for consistent structure with other pages.
 * WeeklyMenu sidebar aligned to the right.
 */
export function MealPlannerPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    selectedId,
    activeMeals,
    completedMeals,
    savedMeals,
    recipes,
    createMeal,
    actions: {
      setSelectedId,
      toggleShoppingList,
      toggleComplete,
      clearCompleted,
      addMealToQueue,
    },
  } = useMealQueue();

  const handleSaveMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, false);
  };

  const handleSaveAndAddMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, true);
  };

  return (
    <PageLayout
      title="Meal Planner"
      description="Plan your weekly meals"
    >
      <div className="flex gap-6">
        {/* Main Content Area (scrolls with page) */}
        <div className="flex-1">
          {activeMeals.length === 0 ? (
            <EmptyMenuState onCreateMeal={() => setIsCreateModalOpen(true)} />
          ) : (
            /* Future: Selected meal hero, side dishes, etc. */
            null
          )}
        </div>

        {/* Weekly Menu - Right Sidebar (sticky - stays visible while scrolling) */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24">
            <WeeklyMenuSidebar
              activeMeals={activeMeals}
              completedMeals={completedMeals}
              selectedId={selectedId}
              savedMeals={savedMeals}
              onSelectMeal={setSelectedId}
              onToggleShoppingList={toggleShoppingList}
              onToggleComplete={toggleComplete}
              onClearCompleted={clearCompleted}
              onAddMeal={addMealToQueue}
              onCreateMeal={() => setIsCreateModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <CreateMealModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        recipes={recipes}
        onSave={handleSaveMeal}
        onSaveAndAdd={handleSaveAndAddMeal}
      />
    </PageLayout>
  );
}
