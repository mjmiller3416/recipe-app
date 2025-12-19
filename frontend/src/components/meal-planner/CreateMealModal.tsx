"use client";

import { useState, useMemo } from "react";
import { Search, X, Plus, ChefHat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";

// Simplified recipe type for selection
interface SelectableRecipe {
  id: number;
  name: string;
  imageUrl?: string;
  category?: string;
  mealType?: string;
  prepTime?: number;
  cookTime?: number;
}

interface CreateMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: SelectableRecipe[];
  onSave: (meal: NewMealData) => void;
  onSaveAndAdd: (meal: NewMealData) => void;
}

export interface NewMealData {
  name: string;
  mainRecipeId: number;
  sideRecipeIds: number[];
}

/**
 * CreateMealModal - Modal for composing a new meal from existing recipes
 * 
 * Two-column layout:
 * - Left: Recipe browser with search
 * - Right: Meal composition (main + up to 3 sides)
 */
export function CreateMealModal({
  open,
  onOpenChange,
  recipes,
  onSave,
  onSaveAndAdd,
}: CreateMealModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mealName, setMealName] = useState("");
  const [mainRecipe, setMainRecipe] = useState<SelectableRecipe | null>(null);
  const [sideRecipes, setSideRecipes] = useState<SelectableRecipe[]>([]);

  const MAX_SIDES = 3;

  // Filter recipes based on search
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const query = searchQuery.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query) ||
        r.mealType?.toLowerCase().includes(query)
    );
  }, [recipes, searchQuery]);

  // Check if recipe is already selected
  const isSelected = (recipeId: number) => {
    return mainRecipe?.id === recipeId || sideRecipes.some((s) => s.id === recipeId);
  };

  // Handle recipe click
  const handleRecipeClick = (recipe: SelectableRecipe) => {
    if (isSelected(recipe.id)) return;

    if (!mainRecipe) {
      // First selection becomes main dish
      setMainRecipe(recipe);
      if (!mealName) {
        setMealName(recipe.name);
      }
    } else if (sideRecipes.length < MAX_SIDES) {
      // Subsequent selections become sides
      setSideRecipes([...sideRecipes, recipe]);
    }
  };

  // Remove main recipe
  const removeMain = () => {
    setMainRecipe(null);
    if (mealName === mainRecipe?.name) {
      setMealName("");
    }
  };

  // Remove side recipe
  const removeSide = (recipeId: number) => {
    setSideRecipes(sideRecipes.filter((s) => s.id !== recipeId));
  };

  // Reset form
  const resetForm = () => {
    setSearchQuery("");
    setMealName("");
    setMainRecipe(null);
    setSideRecipes([]);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Handle save
  const handleSave = (addToMenu: boolean) => {
    if (!mainRecipe) return;

    const mealData: NewMealData = {
      name: mealName || mainRecipe.name,
      mainRecipeId: mainRecipe.id,
      sideRecipeIds: sideRecipes.map((s) => s.id),
    };

    if (addToMenu) {
      onSaveAndAdd(mealData);
    } else {
      onSave(mealData);
    }

    handleClose();
  };

  const canSave = !!mainRecipe;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>Create Meal</DialogTitle>
        </DialogHeader>

        {/* Body - Two Column Layout */}
        <div className="flex-1 flex min-h-0">
          {/* Left Column - Recipe Browser */}
          <div className="flex-1 border-r border-border flex flex-col min-h-0">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Recipe Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <p>No recipes found</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredRecipes.map((recipe) => (
                    <RecipeSelectCard
                      key={recipe.id}
                      recipe={recipe}
                      selected={isSelected(recipe.id)}
                      disabled={!mainRecipe ? false : sideRecipes.length >= MAX_SIDES}
                      onClick={() => handleRecipeClick(recipe)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Meal Composition */}
          <div className="w-80 flex flex-col min-h-0 bg-background-subtle">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground mb-3">Your Meal</h3>
              
              {/* Meal Name Input */}
              <div className="space-y-2">
                <Label htmlFor="meal-name" className="text-sm text-muted">
                  Meal Name
                </Label>
                <Input
                  id="meal-name"
                  placeholder="Enter meal name..."
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                />
              </div>
            </div>

            {/* Composition */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Main Dish */}
              <div>
                <Label className="text-xs text-muted uppercase tracking-wider">
                  Main Dish
                </Label>
                <div className="mt-2">
                  {mainRecipe ? (
                    <SelectedRecipeCard
                      recipe={mainRecipe}
                      onRemove={removeMain}
                      variant="main"
                    />
                  ) : (
                    <EmptySlot label="Select a main dish" />
                  )}
                </div>
              </div>

              {/* Side Dishes */}
              <div>
                <Label className="text-xs text-muted uppercase tracking-wider">
                  Side Dishes ({sideRecipes.length}/{MAX_SIDES})
                </Label>
                <div className="mt-2 space-y-2">
                  {sideRecipes.map((recipe) => (
                    <SelectedRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onRemove={() => removeSide(recipe.id)}
                      variant="side"
                    />
                  ))}
                  {sideRecipes.length < MAX_SIDES && mainRecipe && (
                    <EmptySlot label="Add a side dish" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={!canSave}
          >
            Save Meal
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={!canSave}
          >
            Save & Add to Menu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface RecipeSelectCardProps {
  recipe: SelectableRecipe;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

/**
 * RecipeSelectCard - Compact recipe card for selection grid
 */
function RecipeSelectCard({
  recipe,
  selected,
  disabled,
  onClick,
}: RecipeSelectCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={selected || disabled}
      className={cn(
        "relative rounded-xl overflow-hidden text-left transition-all",
        "focus:outline-none focus:ring-2 focus:ring-primary",
        selected
          ? "ring-2 ring-primary opacity-50 cursor-not-allowed"
          : disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:ring-2 hover:ring-primary/50 cursor-pointer"
      )}
    >
      {/* Image */}
      <div className="aspect-square relative">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
        />
        {selected && (
          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="p-2 bg-elevated">
        <p className="text-xs font-medium text-foreground truncate">
          {recipe.name}
        </p>
      </div>
    </button>
  );
}

// Check icon for selected state
function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface SelectedRecipeCardProps {
  recipe: SelectableRecipe;
  onRemove: () => void;
  variant: "main" | "side";
}

/**
 * SelectedRecipeCard - Shows a selected recipe with remove button
 */
function SelectedRecipeCard({
  recipe,
  onRemove,
  variant,
}: SelectedRecipeCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl",
        variant === "main" ? "bg-primary/10" : "bg-elevated"
      )}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Name */}
      <span className="flex-1 text-sm font-medium text-foreground truncate">
        {recipe.name}
      </span>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1 rounded-md text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Remove ${recipe.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface EmptySlotProps {
  label: string;
}

/**
 * EmptySlot - Placeholder for unselected slots
 */
function EmptySlot({ label }: EmptySlotProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-4 rounded-xl",
        "border-2 border-dashed border-border",
        "text-muted"
      )}
    >
      <Plus className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
  );
}