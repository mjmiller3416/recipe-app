"use client";

import { GripVertical, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
  category: string;
}

interface IngredientRowProps {
  ingredient: Ingredient;
  onUpdate: (id: string, field: keyof Ingredient, value: string) => void;
  onDelete: (id: string) => void;
  showLabels?: boolean;
}

export function IngredientRow({
  ingredient,
  onUpdate,
  onDelete,
  showLabels = false,
}: IngredientRowProps) {
  return (
    <div className="group bg-elevated hover:bg-hover transition-colors rounded-lg p-3 border border-border">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="flex items-center pt-2">
          <button
            type="button"
            className="p-1 text-muted hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Form Fields Container */}
        <div className="flex-1 flex items-end gap-2">
          {/* Quantity */}
          <div className="flex-shrink-0 w-20">
            {showLabels && (
              <Label htmlFor={`qty-${ingredient.id}`} className="text-xs text-muted mb-1.5">
                Qty
              </Label>
            )}
            <Input
              id={`qty-${ingredient.id}`}
              type="text"
              placeholder="1"
              value={ingredient.quantity}
              onChange={(e) => onUpdate(ingredient.id, "quantity", e.target.value)}
              className="h-9 bg-background border-border"
            />
          </div>

          {/* Unit */}
          <div className="flex-shrink-0 w-28">
            {showLabels && (
              <Label htmlFor={`unit-${ingredient.id}`} className="text-xs text-muted mb-1.5">
                Unit
              </Label>
            )}
            <Select
              value={ingredient.unit}
              onValueChange={(value) => onUpdate(ingredient.id, "unit", value)}
            >
              <SelectTrigger id={`unit-${ingredient.id}`} className="h-9 bg-background border-border">
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

          {/* Ingredient Name */}
          <div className="flex-1 min-w-0">
            {showLabels && (
              <Label htmlFor={`name-${ingredient.id}`} className="text-xs text-muted mb-1.5">
                Ingredient
              </Label>
            )}
            <Input
              id={`name-${ingredient.id}`}
              type="text"
              placeholder="Ingredient name"
              value={ingredient.name}
              onChange={(e) => onUpdate(ingredient.id, "name", e.target.value)}
              className="h-9 bg-background border-border"
            />
          </div>

          {/* Category */}
          <div className="flex-shrink-0 w-32">
            {showLabels && (
              <Label
                htmlFor={`category-${ingredient.id}`}
                className="text-xs text-muted mb-1.5"
              >
                Category
              </Label>
            )}
            <Select
              value={ingredient.category}
              onValueChange={(value) => onUpdate(ingredient.id, "category", value)}
            >
              <SelectTrigger id={`category-${ingredient.id}`} className="h-9 bg-background border-border">
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

        {/* Delete Button */}
        <div className="flex items-center pt-2">
          <button
            type="button"
            onClick={() => onDelete(ingredient.id)}
            className="p-1 text-muted hover:text-error transition-colors"
            aria-label="Delete ingredient"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}