"use client";

import { memo, useEffect, useRef } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IngredientRow, Ingredient } from "./IngredientRow";
import type { AutocompleteIngredient } from "@/components/forms/IngredientAutocomplete";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortableDnd } from "@/hooks/ui";

interface IngredientsCardProps {
  ingredients: Ingredient[];
  availableIngredients?: AutocompleteIngredient[];
  onUpdate: (id: string, field: keyof Ingredient, value: string | number | null) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onReorder: (activeId: string, overId: string) => void;
  getError: (field: string) => string | undefined;
  getIngredientError?: (ingredientId: string, field: 'name' | 'quantity') => string | undefined;
}

export const IngredientsCard = memo(function IngredientsCard({
  ingredients,
  availableIngredients = [],
  onUpdate,
  onDelete,
  onAdd,
  onReorder,
  getError,
  getIngredientError,
}: IngredientsCardProps) {
  // Track previous ingredients length to detect new additions
  const prevIngredientsLengthRef = useRef(ingredients.length);

  // Drag and drop setup
  const { sensors, modifiers } = useSortableDnd();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  // Focus the qty input of the new ingredient row when any new ingredient is added
  useEffect(() => {
    if (ingredients.length > prevIngredientsLengthRef.current) {
      // Small delay to ensure the new row is rendered
      setTimeout(() => {
        const qtyInputs = document.querySelectorAll<HTMLInputElement>(
          'input[placeholder="Qty"]'
        );
        const lastInput = qtyInputs[qtyInputs.length - 1];
        lastInput?.focus();
      }, 0);
    }
    prevIngredientsLengthRef.current = ingredients.length;
  }, [ingredients.length]);

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
            <p className="text-sm text-muted-foreground mt-0.5">
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

        <DndContext
          sensors={sensors}
          modifiers={modifiers}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ingredients.map((ing) => ing.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mb-4">
              {ingredients.map((ingredient) => (
                <IngredientRow
                  key={ingredient.id}
                  ingredient={ingredient}
                  availableIngredients={availableIngredients}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  getIngredientError={getIngredientError}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Ingredient Button at Bottom */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onAdd}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </CardContent>
    </Card>
  );
});
