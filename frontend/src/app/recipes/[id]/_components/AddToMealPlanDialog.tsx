"use client";

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RecipeResponseDTO, MealSelectionResponseDTO } from "@/types";
import { cn } from "@/lib/utils";

interface AddToMealPlanDialogProps {
  recipe: RecipeResponseDTO;
  mealSelections: MealSelectionResponseDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToMealPlanDialog({ recipe, mealSelections, open, onOpenChange }: AddToMealPlanDialogProps) {
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    // Mock adding to meal plan
    console.log(`Adding ${recipe.recipe_name} to meal plan ${selectedMeal}`);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenChange(false);
      setSelectedMeal(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Meal Plan</DialogTitle>
          <DialogDescription>
            Choose a meal to add "{recipe.recipe_name}" to, or create a new meal.
          </DialogDescription>
        </DialogHeader>

        {added ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-foreground font-medium">Added to Meal Plan!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
              {mealSelections.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    selectedMeal === meal.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-hover"
                  )}
                >
                  <p className="font-medium text-foreground">{meal.meal_name}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {meal.main_recipe ? `Main: ${meal.main_recipe.recipe_name}` : "No main dish"}
                  </p>
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedMeal}
                className="gap-2"
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Meal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
