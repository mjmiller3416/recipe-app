"use client";

import { useMemo, useCallback } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
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
import { useUnits } from "@/hooks/api";
import { useIngredientCategoryOptions } from "@/hooks/api/useIngredientCategories";
import type { AutocompleteIngredient } from "@/hooks/forms/useIngredientAutocomplete";
import { createEmptyIngredient } from "../useRecipeWizard";
import type { WizardFormValues } from "../wizardSchema";

// ============================================================================
// Props (only external data — form data via useFormContext)
// ============================================================================

interface IngredientsStepProps {
  availableIngredients: AutocompleteIngredient[];
}

// ============================================================================
// Component
// ============================================================================

export function IngredientsStep({
  availableIngredients,
}: IngredientsStepProps) {
  const form = useFormContext<WizardFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { sensors, modifiers } = useSortableDnd();

  // ── Lift data-fetching hooks to the parent ──────────────────
  const { data: units = [] } = useUnits();
  const { options: ingredientCategories } = useIngredientCategoryOptions();

  // ── Memoize the WizardIngredient → Ingredient adaptation ────
  const rowIngredients = useMemo(
    () =>
      fields.map(
        (f): Ingredient => ({
          id: f.id,
          quantity: f.quantity ? parseFloat(f.quantity) : null,
          unit: f.unit,
          name: f.ingredientName,
          category: f.ingredientCategory,
        })
      ),
    [fields]
  );

  const sortableIds = useMemo(
    () => fields.map((f) => f.id),
    [fields]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = fields.findIndex((f) => f.id === String(active.id));
        const newIndex = fields.findIndex((f) => f.id === String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) {
          move(oldIndex, newIndex);
        }
      }
    },
    [fields, move]
  );

  /**
   * Adapts IngredientRow's onUpdate callback to the wizard's field naming.
   * IngredientRow calls with Ingredient field keys (name, category, …),
   * but the wizard uses WizardIngredient keys (ingredientName, …).
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
      const index = fields.findIndex((f) => f.id === id);
      if (index === -1) return;

      const stringValue = value === null ? "" : String(value);
      form.setValue(
        `ingredients.${index}.${wizardField}` as `ingredients.${number}.ingredientName`,
        stringValue
      );
    },
    [fields, form]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const index = fields.findIndex((f) => f.id === id);
      if (index !== -1) remove(index);
    },
    [fields, remove]
  );

  const handleClearAll = useCallback(() => {
    form.setValue("ingredients", [createEmptyIngredient()]);
  }, [form]);

  /**
   * Adapts the wizard's per-row errors to the IngredientRow's
   * expected field names ('name' | 'quantity').
   */
  const handleGetIngredientError = useCallback(
    (ingredientId: string, field: "name" | "quantity") => {
      const fieldMap: Record<string, string> = {
        name: "ingredientName",
        quantity: "quantity",
      };
      const wizardField = fieldMap[field] || field;
      const index = fields.findIndex((f) => f.id === ingredientId);
      if (index === -1) return undefined;

      const errors = form.formState.errors.ingredients;
      const rowErrors = errors?.[index] as Record<string, { message?: string }> | undefined;
      return rowErrors?.[wizardField]?.message;
    },
    [fields, form.formState.errors.ingredients]
  );

  // Root-level error (e.g. "At least one ingredient is required")
  const rootError = (form.formState.errors.ingredients as { root?: { message?: string } } | undefined)?.root?.message
    ?? form.formState.errors.ingredients?.message;

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
          Ingredients ({fields.length})
        </h3>
        {fields.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleClearAll}
          >
            <Trash2 className="size-4 mr-1.5" strokeWidth={1.5} />
            Clear All
          </Button>
        )}
      </div>

      {/* Column headers (desktop only) */}
      {fields.length > 0 && (
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
            {rowIngredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                availableIngredients={availableIngredients}
                units={units}
                ingredientCategories={ingredientCategories}
                onUpdate={handleRowUpdate}
                onDelete={handleDelete}
                getIngredientError={handleGetIngredientError}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Error message for the ingredient list */}
      {rootError && (
        <p className="text-sm text-destructive" role="alert">
          {rootError}
        </p>
      )}

      {/* Add Ingredient button */}
      <Button
        type="button"
        variant="dashed"
        className="w-full"
        onClick={() => append(createEmptyIngredient())}
      >
        <Plus className="size-4 mr-2" strokeWidth={1.5} />
        Add Ingredient
      </Button>
    </div>
  );
}
