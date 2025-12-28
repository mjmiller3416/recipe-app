"use client";

import { Check } from "lucide-react";
import type { RecipeResponseDTO } from "@/types";
import { cn, formatQuantity } from "@/lib/utils";
import { INGREDIENT_UNITS } from "@/lib/constants";

interface IngredientItemProps {
  ingredient: RecipeResponseDTO["ingredients"][0];
  checked: boolean;
  onToggle: () => void;
}

export function IngredientItem({ ingredient, checked, onToggle }: IngredientItemProps) {
  const quantity = formatQuantity(ingredient.quantity);
  const unit = INGREDIENT_UNITS.find(u => u.value === ingredient.unit)?.label || ingredient.unit || "";

  return (
    <>
      {/* Web version - interactive checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-all",
          "hover:bg-hover group print:hidden",
          checked && "opacity-50"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all",
          checked
            ? "border-primary bg-primary"
            : "border-muted group-hover:border-primary"
        )}>
          {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <span className={cn(
          "flex-1 text-foreground transition-all",
          checked && "line-through"
        )}>
          <span className="font-semibold">{quantity} {unit}</span>
          {(quantity || unit) && " "}
          {ingredient.ingredient_name}
        </span>
      </button>

      {/* Print version - simple text */}
      <div className="hidden print:block py-0.5 text-sm text-black">
        <span className="font-semibold">{quantity} {unit}</span>
        {(quantity || unit) && " "}
        {ingredient.ingredient_name}
      </div>
    </>
  );
}
