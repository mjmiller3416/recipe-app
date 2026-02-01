import "./print-styles.css";
import { formatQuantity } from "@/lib/utils";
import { formatTime, sortCategoryEntries } from "../recipe-utils";
import type { PrintOptions } from "./PrintPreviewDialog";
import type { RecipeResponseDTO } from "@/types/recipe";

interface RecipePrintLayoutProps {
  recipe: RecipeResponseDTO;
  directions: string[];
  groupedIngredients: Map<string, RecipeResponseDTO["ingredients"]>;
  printOptions: PrintOptions;
}

/**
 * Print-only layout component for recipes.
 * Hidden on screen, visible only during print.
 * Renders a clean, two-column format optimized for paper.
 */
export function RecipePrintLayout({
  recipe,
  directions,
  groupedIngredients,
  printOptions,
}: RecipePrintLayoutProps) {
  return (
    <div className="hidden p-6 print:block">
      {/* Wrap entire recipe to prevent page breaks */}
      <div className="print-recipe-content">
        {/* Header: Title and Meta */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-black uppercase">
              {recipe.recipe_name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {[recipe.meal_type, recipe.recipe_category, recipe.diet_pref].filter(Boolean).join(" • ")}
            </p>
          </div>
          {printOptions.showMeta && (
            <div className="text-sm text-right text-gray-700">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span>{recipe.servings || "—"} servings</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <span>{formatTime(recipe.total_time)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recipe Image */}
        {printOptions.showImage && recipe.reference_image_path && (
          <div className="mb-4">
            <img
              src={recipe.reference_image_path}
              alt={recipe.recipe_name}
              className="object-cover w-full rounded-lg max-h-48"
            />
          </div>
        )}

        {/* Two Column: Ingredients & Directions */}
        <div className="flex gap-6">
          {/* Ingredients Column */}
          <div className="w-1/3 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <h2 className="pb-1 mb-2 text-base font-bold tracking-wide text-black uppercase border-b border-gray-300">
              Ingredients
            </h2>
            <div className="space-y-1 text-sm">
              {sortCategoryEntries(Array.from(groupedIngredients.entries())).map(([category, ingredients]) => (
                <div key={category}>
                  {groupedIngredients.size > 1 && (
                    <p className="mt-3 mb-1 text-xs font-semibold text-gray-700 uppercase first:mt-0">
                      {category}
                    </p>
                  )}
                  {ingredients.map((ingredient: RecipeResponseDTO["ingredients"][0]) => (
                    <p key={ingredient.id} className="text-black py-0.5">
                      <span className="font-medium">{formatQuantity(ingredient.quantity)} {ingredient.unit || ""}</span>
                      {(ingredient.quantity || ingredient.unit) && " "}
                      {ingredient.ingredient_name}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Directions Column */}
          <div className="w-2/3 p-3 border border-gray-200 rounded-lg">
            <h2 className="pb-1 mb-2 text-base font-bold tracking-wide text-black uppercase border-b border-gray-300">
              Directions
            </h2>
            <ol className="ml-4 space-y-2 text-sm list-decimal list-outside">
              {directions.map((step, index) => (
                <li key={index} className="pl-1 leading-relaxed text-black">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Chef's Notes */}
        {printOptions.showNotes && recipe.notes && (
          <div className="p-3 mt-3 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="mb-1 text-sm font-bold text-black">Chef's Notes</h3>
            <p className="text-xs text-gray-800">{recipe.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
