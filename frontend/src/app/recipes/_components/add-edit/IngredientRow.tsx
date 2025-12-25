"use client";

import { GripVertical, X } from "lucide-react";
import { QuantityInput } from "@/components/forms/QuantityInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import {
  IngredientAutocomplete,
  Ingredient as AutocompleteIngredient,
} from "./IngredientAutocomplete";

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

export function IngredientRow({
  ingredient,
  availableIngredients = [],
  onUpdate,
  onDelete,
  showLabels = false,
}: IngredientRowProps) {
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
    <div className="group bg-elevated hover:bg-hover transition-colors rounded-lg p-3 border border-border">
      <div className="flex items-center gap-3">
        {/* Drag Handle - Vertically Centered */}
        <button
          type="button"
          className="p-1 text-muted hover:text-foreground transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Form Fields Container */}
        <div className="flex-1 flex items-center gap-2">
          {/* Quantity */}
          <div className="flex-shrink-0 w-24">
            <QuantityInput
              value={ingredient.quantity}
              onChange={(value) => onUpdate(ingredient.id, "quantity", value)}
              placeholder="Qty"
            />
          </div>

          {/* Unit */}
          <div className="flex-shrink-0 w-28">
            <Select
              value={ingredient.unit}
              onValueChange={(value) => onUpdate(ingredient.id, "unit", value)}
            >
              <SelectTrigger id={`unit-${ingredient.id}`} className="h-9">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {INGREDIENT_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ingredient Name with Autocomplete */}
          <div className="flex-1 min-w-0">
            <IngredientAutocomplete
              ingredients={availableIngredients}
              value={ingredient.name}
              onValueChange={(value) => onUpdate(ingredient.id, "name", value)}
              onIngredientSelect={handleIngredientSelect}
              onNewIngredient={handleNewIngredient}
              placeholder="Ingredient name"
              className="h-9"
            />
          </div>

          {/* Category */}
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

        {/* Delete Button - Vertically Centered */}
        <button
          type="button"
          onClick={() => onDelete(ingredient.id)}
          className="p-1 text-muted hover:text-error transition-colors flex-shrink-0"
          aria-label="Delete ingredient"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
