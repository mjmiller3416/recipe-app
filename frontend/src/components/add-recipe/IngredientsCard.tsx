"use client";

import { Plus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IngredientRow,
  Ingredient,
} from "@/components/forms/IngredientRow";

interface IngredientsCardProps {
  ingredients: Ingredient[];
  onUpdate: (id: string, field: keyof Ingredient, value: string | number | null) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  getError: (field: string) => string | undefined;
}

export function IngredientsCard({
  ingredients,
  onUpdate,
  onDelete,
  onAdd,
  getError,
}: IngredientsCardProps) {
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
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </Button>
      </CardContent>
    </Card>
  );
}
