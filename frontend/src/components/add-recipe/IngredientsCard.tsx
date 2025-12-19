"use client";

import { useRef, useEffect } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IngredientRow, Ingredient } from "./IngredientRow";
import { Ingredient as AutocompleteIngredient } from "./IngredientAutoComplete";

interface IngredientsCardProps {
  ingredients: Ingredient[];
  availableIngredients?: AutocompleteIngredient[];
  onUpdate: (id: string, field: keyof Ingredient, value: string | number | null) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  getError: (field: string) => string | undefined;
}

export function IngredientsCard({
  ingredients,
  availableIngredients = [],
  onUpdate,
  onDelete,
  onAdd,
  getError,
}: IngredientsCardProps) {
  // Track if the add was triggered via keyboard (spacebar)
  const addedViaKeyboardRef = useRef(false);
  const prevIngredientsLengthRef = useRef(ingredients.length);

  // Focus the qty input of the new ingredient row when added via keyboard
  useEffect(() => {
    if (
      ingredients.length > prevIngredientsLengthRef.current &&
      addedViaKeyboardRef.current
    ) {
      // Small delay to ensure the new row is rendered
      setTimeout(() => {
        const qtyInputs = document.querySelectorAll<HTMLInputElement>(
          'input[placeholder="Qty"]'
        );
        const lastInput = qtyInputs[qtyInputs.length - 1];
        lastInput?.focus();
      }, 0);
      addedViaKeyboardRef.current = false;
    }
    prevIngredientsLengthRef.current = ingredients.length;
  }, [ingredients.length]);

  // Detect spacebar press on the Add button
  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Spacebar") {
      addedViaKeyboardRef.current = true;
    }
  };

  return (
    <Card data-field="ingredients">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Ingredients
            </h2>
            <p className="text-sm text-muted mt-0.5">
              List all ingredients needed for this recipe
            </p>
          </div>
        </div>

        {getError("ingredients") && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{getError("ingredients")}</p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              availableIngredients={availableIngredients}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>

        {/* Add Ingredient Button at Bottom */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          onKeyDown={handleAddKeyDown}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </CardContent>
    </Card>
  );
}