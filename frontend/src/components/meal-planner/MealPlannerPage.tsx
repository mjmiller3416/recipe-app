"use client";

import { useState } from "react";
import { SelectedMealHero } from "./SelectedMealHero";
import { WeeklyMenuSidebar } from "./WeeklyMenuSidebar";
import { EmptyMenuState } from "./EmptyMenuState";
import { CreateMealModal, type NewMealData } from "./CreateMealModal";
import { useMealQueue } from "@/hooks/useMealQueue";

/**
 * MealPlannerPage - Main layout orchestrator for the Meal Planner feature
 * 
 * Layout: Hero section (selected meal) + Right sidebar (weekly menu queue)
 * 
 * Uses existing patterns:
 * - CSS variables for theming
 * - cn() for class merging
 * - Follows page layout conventions from Settings page
 */
export function MealPlannerPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    meals,
    selectedId,
    activeMeals,
    completedMeals,
    selectedMeal,
    savedMeals,
    recipes,
    createMeal,
    actions: {
      setSelectedId,
      toggleShoppingList,
      toggleComplete,
      removeFromMenu,
      clearCompleted,
      addMealToQueue,
    },
  } = useMealQueue();

  // Handle save meal (library only)
  const handleSaveMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, false);
  };

  // Handle save and add to menu
  const handleSaveAndAddMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, true);
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Hero Section - Selected Meal */}
      <main className="flex-1 overflow-y-auto p-6">
        {selectedMeal ? (
          <SelectedMealHero
            meal={selectedMeal}
            onToggleComplete={() => toggleComplete(selectedMeal.id)}
            onRemove={() => removeFromMenu(selectedMeal.id)}
          />
        ) : (
          <EmptyMenuState
            onCreateMeal={() => setIsCreateModalOpen(true)}
            onBrowseSaved={() => {/* TODO: Scroll to saved meals in sidebar */}}
          />
        )}
      </main>

      {/* Right Sidebar - Weekly Menu Queue */}
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

      {/* Create Meal Modal */}
      <CreateMealModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        recipes={recipes}
        onSave={handleSaveMeal}
        onSaveAndAdd={handleSaveAndAddMeal}
      />
    </div>
  );
}