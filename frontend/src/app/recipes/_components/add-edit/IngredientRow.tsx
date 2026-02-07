"use client";

import { memo } from "react";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuantityInput } from "@/components/forms/QuantityInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_CATEGORIES } from "@/lib/constants";
import {
  IngredientAutocomplete,
  type AutocompleteIngredient,
} from "@/components/forms/IngredientAutocomplete";
import { useUnits } from "@/hooks/api";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string;
  name: string;
  category: string;
}

interface IngredientRowProps {
  ingredient: Ingredient;
  availableIngredients?: AutocompleteIngredient[];
  onUpdate: (id: string, field: keyof Ingredient, value: string | number | null) => void;
  onDelete: (id: string) => void;
  showLabels?: boolean;
  getIngredientError?: (ingredientId: string, field: 'name' | 'quantity') => string | undefined;
}

// Helper to find matching category value from INGREDIENT_CATEGORIES
const findCategoryValue = (categoryFromDb: string): string => {
  // Try exact match first
  const exactMatch = INGREDIENT_CATEGORIES.find(
    (cat) => cat.value === categoryFromDb
  );
  if (exactMatch) return exactMatch.value;

  // Try case-insensitive match on value
  const caseInsensitiveValue = INGREDIENT_CATEGORIES.find(
    (cat) => cat.value.toLowerCase() === categoryFromDb.toLowerCase()
  );
  if (caseInsensitiveValue) return caseInsensitiveValue.value;

  // Try case-insensitive match on label
  const labelMatch = INGREDIENT_CATEGORIES.find(
    (cat) => cat.label.toLowerCase() === categoryFromDb.toLowerCase()
  );
  if (labelMatch) return labelMatch.value;

  // Return original if no match (Select will show placeholder)
  return categoryFromDb;
};

export const IngredientRow = memo(function IngredientRow({
  ingredient,
  availableIngredients = [],
  onUpdate,
  onDelete,
  // showLabels is available but not currently used
  getIngredientError,
}: IngredientRowProps) {
  const { data: units = [] } = useUnits();

  // Get field errors
  const quantityError = getIngredientError?.(ingredient.id, 'quantity');
  const nameError = getIngredientError?.(ingredient.id, 'name');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle selecting an existing ingredient from autocomplete
  const handleIngredientSelect = (selected: AutocompleteIngredient) => {
    onUpdate(ingredient.id, "name", selected.name);
    // Auto-fill category from the selected ingredient (normalized to match Select values)
    if (selected.category) {
      const normalizedCategory = findCategoryValue(selected.category);
      onUpdate(ingredient.id, "category", normalizedCategory);
    }
  };

  // Handle creating a new ingredient (just updates the name)
  const handleNewIngredient = (name: string) => {
    onUpdate(ingredient.id, "name", name);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-elevated hover:bg-hover transition-colors rounded-lg p-3 border border-border ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      {/* Mobile Layout: Grid with drag/delete on top row */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
            tabIndex={-1}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(ingredient.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete ingredient"
            tabIndex={-1}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <QuantityInput
              value={ingredient.quantity}
              onChange={(value) => onUpdate(ingredient.id, "quantity", value)}
              placeholder="Qty"
              className={cn(quantityError && "border-destructive")}
            />
            {quantityError && (
              <p className="text-xs text-destructive mt-1">{quantityError}</p>
            )}
          </div>
          <Select
            value={ingredient.unit}
            onValueChange={(value) => onUpdate(ingredient.id, "unit", value)}
          >
            <SelectTrigger id={`unit-mobile-${ingredient.id}`} className="h-9">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-2">
          <IngredientAutocomplete
            ingredients={availableIngredients}
            value={ingredient.name}
            onValueChange={(value) => onUpdate(ingredient.id, "name", value)}
            onIngredientSelect={handleIngredientSelect}
            onNewIngredient={handleNewIngredient}
            placeholder="Ingredient name"
            className={cn("h-9", nameError && "border-destructive")}
          />
          {nameError && (
            <p className="text-xs text-destructive mt-1">{nameError}</p>
          )}
        </div>
        <Select
          value={ingredient.category}
          onValueChange={(value) => onUpdate(ingredient.id, "category", value)}
        >
          <SelectTrigger id={`category-mobile-${ingredient.id}`} className="h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {INGREDIENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Layout: Horizontal row */}
      <div className="hidden md:flex items-center gap-3">
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          tabIndex={-1}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 flex items-start gap-2">
          <div className="flex-shrink-0 w-24">
            <QuantityInput
              value={ingredient.quantity}
              onChange={(value) => onUpdate(ingredient.id, "quantity", value)}
              placeholder="Qty"
              className={cn(quantityError && "border-destructive")}
            />
            {quantityError && (
              <p className="text-xs text-destructive mt-1">{quantityError}</p>
            )}
          </div>

          <div className="flex-shrink-0 w-28">
            <Select
              value={ingredient.unit}
              onValueChange={(value) => onUpdate(ingredient.id, "unit", value)}
            >
              <SelectTrigger id={`unit-${ingredient.id}`} className="h-9">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <IngredientAutocomplete
              ingredients={availableIngredients}
              value={ingredient.name}
              onValueChange={(value) => onUpdate(ingredient.id, "name", value)}
              onIngredientSelect={handleIngredientSelect}
              onNewIngredient={handleNewIngredient}
              placeholder="Ingredient name"
              className={cn("h-9", nameError && "border-destructive")}
            />
            {nameError && (
              <p className="text-xs text-destructive mt-1">{nameError}</p>
            )}
          </div>

          <div className="flex-shrink-0 w-32">
            <Select
              value={ingredient.category}
              onValueChange={(value) => onUpdate(ingredient.id, "category", value)}
            >
              <SelectTrigger id={`category-${ingredient.id}`} className="h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(ingredient.id)}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          aria-label="Delete ingredient"
          tabIndex={-1}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
});
