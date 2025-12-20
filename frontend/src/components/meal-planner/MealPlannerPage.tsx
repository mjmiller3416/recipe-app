"use client";

import { useState } from "react";
import { SelectedMealHero } from "./SelectedMealHero";
import { WeeklyMenuSidebar } from "./WeeklyMenuSidebar";
import { EmptyMenuState } from "./EmptyMenuState";
import { CreateMealModal, type NewMealData } from "./CreateMealModal";
import { useMealQueue } from "@/hooks/useMealQueue";

/**
 * MealPlannerPage - Main layout for Meal Planner
 * 
 * CRITICAL: This page should NEVER scroll. Only the sidebar meal list scrolls.
 * Uses absolute positioning to guarantee height constraints.
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

  const handleSaveMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, false);
  };

  const handleSaveAndAddMeal = (mealData: NewMealData) => {
    createMeal(mealData.name, mealData.mainRecipeId, mealData.sideRecipeIds, true);
  };

  return (
    // Absolute fill to guarantee we take exactly the parent's space, no more
    <div className="absolute inset-0 flex overflow-hidden p-6 gap-6">
      {/* Main Content - fills remaining space, never scrolls */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {selectedMeal ? (
          <SelectedMealHero
            meal={selectedMeal}
            onToggleComplete={() => toggleComplete(selectedMeal.id)}
            onRemove={() => removeFromMenu(selectedMeal.id)}
          />
        ) : (
          <EmptyMenuState
            onCreateMeal={() => setIsCreateModalOpen(true)}
            onBrowseSaved={() => {}}
          />
        )}
      </main>

      {/* Sidebar - fixed width, has its own internal scroll */}
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