"use client";

import { GripVertical, X } from "lucide-react";
import { Input } from "@/src/public/components/ui/input";
import { Label } from "@/src/public/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/public/components/ui/select";
import { INGREDIENT_UNITS, INGREDIENT_CATEGORIES } from "@/src/lib/constants";
import { cn } from "@/src/lib/utils";

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
          <div className="flex-shrink-0 w-20">
            <Input
              id={`qty-${ingredient.id}`}
              type="text"
              placeholder="1"
              value={ingredient.quantity}
              onChange={(e) => onUpdate(ingredient.id, "quantity", e.target.value)}
              className="h-9"
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

          {/* Ingredient Name */}
          <div className="flex-1 min-w-0">
            <Input
              id={`name-${ingredient.id}`}
              type="text"
              placeholder="Ingredient name"
              value={ingredient.name}
              onChange={(e) => onUpdate(ingredient.id, "name", e.target.value)}
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