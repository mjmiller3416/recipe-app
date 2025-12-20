"use client";

import { useState, useMemo } from "react";
import { Search, X, Plus, ChefHat, Clock, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { cn } from "@/lib/utils";
import type { SelectableRecipe } from "./types";

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
 * - Left: Recipe browser with search (list view for readability)
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

  // Get selection state for a recipe
  const getSelectionState = (recipeId: number): "main" | "side" | null => {
    if (mainRecipe?.id === recipeId) return "main";
    if (sideRecipes.some((s) => s.id === recipeId)) return "side";
    return null;
  };

  // Check if recipe is already selected
  const isSelected = (recipeId: number) => {
    return getSelectionState(recipeId) !== null;
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
  const canAddSides = mainRecipe && sideRecipes.length < MAX_SIDES;

  // Format time helper
  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          // Override the default sm:max-w-lg with our larger size
          "sm:max-w-[950px] w-[95vw] h-[85vh]",
          "flex flex-col p-0 gap-0 overflow-hidden"
        )}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-xl">Create Meal</DialogTitle>
        </DialogHeader>

        {/* Body - Two Column Layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Column - Recipe Browser */}
          <div className="flex-[3] min-w-0 border-r border-border flex flex-col bg-background">
            {/* Search */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Results count */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{filteredRecipes.length} recipes</span>
                {!canAddSides && mainRecipe && (
                  <span className="text-amber-500">• Max sides reached</span>
                )}
              </div>
            </div>

            {/* Recipe List with ScrollArea */}
            <ScrollArea className="flex-1">
              {filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ChefHat className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No recipes found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredRecipes.map((recipe) => {
                    const selectionState = getSelectionState(recipe.id);
                    const isDisabled = !selectionState && !canAddSides && mainRecipe !== null;
                    
                    return (
                      <RecipeListItem
                        key={recipe.id}
                        recipe={recipe}
                        selectionState={selectionState}
                        disabled={isDisabled}
                        onClick={() => handleRecipeClick(recipe)}
                        formatTime={formatTime}
                      />
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Column - Meal Composition */}
          <div className="flex-[2] min-w-0 flex flex-col bg-elevated/50">
            {/* Meal Name Section */}
            <div className="p-5 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground text-lg mb-4">Your Meal</h3>
              
              <div className="space-y-2">
                <Label htmlFor="meal-name" className="text-sm text-muted-foreground">
                  Meal Name
                </Label>
                <Input
                  id="meal-name"
                  placeholder="Enter meal name..."
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Composition - Scrollable */}
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Main Dish */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Main Dish
                  </Label>
                  <div className="mt-3">
                    {mainRecipe ? (
                      <SelectedRecipeCard
                        recipe={mainRecipe}
                        onRemove={removeMain}
                        variant="main"
                      />
                    ) : (
                      <EmptySlot 
                        label="Select a main dish" 
                        hint="Click a recipe from the list"
                      />
                    )}
                  </div>
                </div>

                {/* Side Dishes */}
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Side Dishes ({sideRecipes.length}/{MAX_SIDES})
                  </Label>
                  <div className="mt-3 space-y-2">
                    {sideRecipes.map((recipe, index) => (
                      <SelectedRecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onRemove={() => removeSide(recipe.id)}
                        variant="side"
                        sideNumber={index + 1}
                      />
                    ))}
                    {sideRecipes.length < MAX_SIDES && mainRecipe && (
                      <EmptySlot 
                        label={`Add side dish ${sideRecipes.length + 1}`}
                        hint="Optional"
                        subtle
                      />
                    )}
                    {!mainRecipe && (
                      <p className="text-xs text-muted-foreground italic py-2">
                        Select a main dish first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Summary */}
            {mainRecipe && (
              <div className="p-5 border-t border-border bg-background/50 shrink-0">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {1 + sideRecipes.length}
                  </span>
                  {" "}recipe{1 + sideRecipes.length !== 1 ? "s" : ""} selected
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-background">
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

interface RecipeListItemProps {
  recipe: SelectableRecipe;
  selectionState: "main" | "side" | null;
  disabled: boolean;
  onClick: () => void;
  formatTime: (minutes?: number) => string | null;
}

/**
 * RecipeListItem - Horizontal list item for recipe selection
 * Shows full name, category, time, and selection state
 */
function RecipeListItem({
  recipe,
  selectionState,
  disabled,
  onClick,
  formatTime,
}: RecipeListItemProps) {
  const isSelectedState = selectionState !== null;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const timeDisplay = formatTime(totalTime);
  
  // Build metadata string
  const metadata: string[] = [];
  if (recipe.category) metadata.push(recipe.category);
  if (recipe.mealType && recipe.mealType !== recipe.category) {
    metadata.push(recipe.mealType);
  }

  return (
    <button
      onClick={onClick}
      disabled={isSelectedState || disabled}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors",
        "focus:outline-none focus-visible:bg-accent",
        isSelectedState
          ? "bg-primary/10"
          : disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-hover cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "w-12 h-12 rounded-lg overflow-hidden shrink-0 relative bg-elevated",
        isSelectedState && "ring-2 ring-primary ring-offset-1 ring-offset-background"
      )}>
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content - grows to fill space */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm leading-tight",
          isSelectedState ? "text-primary" : "text-foreground"
        )}>
          {recipe.name}
        </p>
        
        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {metadata.length > 0 && (
            <span>{metadata.join(" • ")}</span>
          )}
          {timeDisplay && (
            <>
              {metadata.length > 0 && <span className="opacity-50">|</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeDisplay}
              </span>
            </>
          )}
          {!metadata.length && !timeDisplay && (
            <span className="italic opacity-70">No details</span>
          )}
        </div>
      </div>

      {/* Selection State Badge */}
      <div className="shrink-0">
        {selectionState === "main" && (
          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
            <Check className="h-3 w-3 mr-1" />
            Main
          </Badge>
        )}
        {selectionState === "side" && (
          <Badge className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
            <Check className="h-3 w-3 mr-1" />
            Side
          </Badge>
        )}
        {!isSelectedState && !disabled && (
          <Plus className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

interface SelectedRecipeCardProps {
  recipe: SelectableRecipe;
  onRemove: () => void;
  variant: "main" | "side";
  sideNumber?: number;
}

/**
 * SelectedRecipeCard - Shows a selected recipe with remove button
 */
function SelectedRecipeCard({
  recipe,
  onRemove,
  variant,
  sideNumber,
}: SelectedRecipeCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all",
        variant === "main" 
          ? "bg-primary/15 border border-primary/30" 
          : "bg-secondary/20 border border-secondary/30"
      )}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-elevated">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground block truncate">
          {recipe.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {variant === "main" ? "Main dish" : `Side ${sideNumber}`}
        </span>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className={cn(
          "p-1.5 rounded-md transition-colors shrink-0",
          "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        )}
        aria-label={`Remove ${recipe.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface EmptySlotProps {
  label: string;
  hint?: string;
  subtle?: boolean;
}

/**
 * EmptySlot - Placeholder for unselected slots
 */
function EmptySlot({ label, hint, subtle }: EmptySlotProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-5 rounded-xl",
        "border-2 border-dashed",
        subtle 
          ? "border-border/50" 
          : "border-border bg-background/30"
      )}
    >
      <div className={cn(
        "flex items-center gap-2",
        subtle ? "text-muted-foreground/60" : "text-muted-foreground"
      )}>
        <Plus className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      {hint && (
        <span className="text-xs text-muted-foreground/50">{hint}</span>
      )}
    </div>
  );
}