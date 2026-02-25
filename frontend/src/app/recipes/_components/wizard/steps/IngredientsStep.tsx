"use client";

import { useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Info, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  IngredientRow,
  type Ingredient,
} from "@/app/recipes/_components/add-edit/IngredientRow";
import { useSortableDnd } from "@/hooks/ui/useSortableDnd";
import type { AutocompleteIngredient } from "@/hooks/forms/useIngredientAutocomplete";
import type { WizardIngredient } from "@/types/recipe";

interface IngredientsStepProps {
  ingredients: WizardIngredient[];
  availableIngredients: AutocompleteIngredient[];
  onAdd: () => void;
  onUpdate: (id: string, field: string, value: string | number | null) => void;
  onDelete: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onClearAll: () => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
  getIngredientError: (id: string, field: string) => string | undefined;
}

/**
 * Adapts WizardIngredient shape to the Ingredient shape expected by IngredientRow.
 */
function toRowIngredient(wi: WizardIngredient): Ingredient {
  return {
    id: wi.id,
    quantity: wi.quantity ? parseFloat(wi.quantity) : null,
    unit: wi.unit,
    name: wi.ingredientName,
    category: wi.ingredientCategory,
  };
}

export function IngredientsStep({
  ingredients,
  availableIngredients,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
  onClearAll,
  hasError,
  getError,
  getIngredientError,
}: IngredientsStepProps) {
  const { sensors, modifiers } = useSortableDnd();

  const sortableIds = useMemo(
    () => ingredients.map((ing) => ing.id),
    [ingredients]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorder(String(active.id), String(over.id));
      }
    },
    [onReorder]
  );

  /**
   * Adapts IngredientRow's onUpdate callback to the wizard's field naming convention.
   * IngredientRow calls with Ingredient field keys (name, category, quantity, unit),
   * but the wizard uses WizardIngredient keys (ingredientName, ingredientCategory, etc.).
   */
  const handleRowUpdate = useCallback(
    (id: string, field: keyof Ingredient, value: string | number | null) => {
      const fieldMap: Record<string, string> = {
        name: "ingredientName",
        category: "ingredientCategory",
        quantity: "quantity",
        unit: "unit",
      };
      const wizardField = fieldMap[field] || field;
      onUpdate(id, wizardField, value);
    },
    [onUpdate]
  );

  /**
   * Adapts the wizard's getIngredientError to the IngredientRow's expected signature.
   * IngredientRow calls with 'name' | 'quantity', wizard uses 'ingredientName' etc.
   */
  const handleGetIngredientError = useCallback(
    (ingredientId: string, field: "name" | "quantity") => {
      const fieldMap: Record<string, string> = {
        name: "ingredientName",
        quantity: "quantity",
      };
      return getIngredientError(ingredientId, fieldMap[field] || field);
    },
    [getIngredientError]
  );

  return (
    <div className="space-y-6">
      {/* Pro Tip Banner */}
      <div className="flex gap-3 bg-info/10 border border-info/20 rounded-lg p-4">
        <Info
          className="size-5 text-info shrink-0 mt-0.5"
          strokeWidth={1.5}
        />
        <div>
          <p className="text-sm font-medium text-foreground">Pro Tip</p>
          <p className="text-sm text-muted-foreground">
            You can paste a full list of ingredients and our parser will
            automatically separate quantities and units.
          </p>
        </div>
      </div>

      {/* Section header with Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Ingredients ({ingredients.length})
        </h3>
        {ingredients.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onClearAll}
          >
            <Trash2 className="size-4 mr-1.5" strokeWidth={1.5} />
            Clear All
          </Button>
        )}
      </div>

      {/* Column headers (desktop only) */}
      {ingredients.length > 0 && (
        <div className="hidden md:flex items-center gap-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="w-7 shrink-0">Drag</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-24 shrink-0">Amount</div>
            <div className="w-28 shrink-0">Unit</div>
            <div className="flex-1 min-w-0">Ingredient Name</div>
            <div className="w-32 shrink-0">Category</div>
          </div>
          <div className="w-7 shrink-0">Action</div>
        </div>
      )}

      {/* Ingredient rows with drag and drop */}
      <DndContext
        sensors={sensors}
        modifiers={modifiers}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={toRowIngredient(ingredient)}
                availableIngredients={availableIngredients}
                onUpdate={handleRowUpdate}
                onDelete={onDelete}
                getIngredientError={handleGetIngredientError}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Error message for the ingredient list */}
      {hasError("ingredients") && (
        <p className="text-sm text-destructive" role="alert">
          {getError("ingredients")}
        </p>
      )}

      {/* Add Ingredient button */}
      <Button
        type="button"
        variant="dashed"
        className="w-full"
        onClick={onAdd}
      >
        <Plus className="size-4 mr-2" strokeWidth={1.5} />
        Add Ingredient
      </Button>
    </div>
  );
}
