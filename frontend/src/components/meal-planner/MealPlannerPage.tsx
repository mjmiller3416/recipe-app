"use client";

import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { WeeklyMenuSidebar } from "./WeeklyMenu";
import { CreateMealModal, type NewMealData } from "./CreateMealModal";
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
      fixedViewport
    >
      <div className="flex gap-6 h-full">
        {/* Main Content Area - placeholder for now */}
        <div className="flex-1">
          {/* Content will go here */}
        </div>

        {/* Weekly Menu - Right Sidebar */}
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
