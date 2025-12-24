"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Users,
  ChefHat,
  ArrowLeft,
  Edit3,
  Trash2,
  Printer,
  CalendarPlus,
  BookOpen,
  Lightbulb,
  UtensilsCrossed,
  Heart,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecipeBadge, RecipeBadgeGroup } from "@/components/recipe/RecipeBadge";
import { FavoriteButton } from "@/components/common/FavoriteButton";
import { RecipeHeroImage } from "@/components/recipe/RecipeImage";
import { recipeApi, plannerApi } from "@/lib/api";
import type { RecipeResponseDTO, MealSelectionResponseDTO } from "@/types";
import { cn, formatQuantity } from "@/lib/utils";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function parseDirections(directions: string | null): string[] {
  if (!directions) return [];
  
  // Split by numbered steps (1. 2. etc.) or by newlines
  const steps = directions
    .split(/\n/)
    .map(step => step.trim())
    .filter(step => step.length > 0)
    .map(step => {
      // Remove leading numbers like "1." or "1)"
      return step.replace(/^\d+[\.\)]\s*/, "");
    });
  
  return steps;
}

// Group ingredients by category for better organization
function groupIngredientsByCategory(
  ingredients: RecipeResponseDTO["ingredients"]
): Map<string, RecipeResponseDTO["ingredients"]> {
  const grouped = new Map<string, RecipeResponseDTO["ingredients"]>();
  
  ingredients.forEach(ing => {
    const category = ing.ingredient_category || "Other";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(ing);
  });
  
  return grouped;
}

// ============================================================================
// SKELETON LOADING COMPONENT
// ============================================================================

function RecipeDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative h-[300px] md:h-[400px] bg-elevated" />
      
      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
        {/* Header Card Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="h-10 w-3/4 bg-hover rounded-lg mb-4" />
            <div className="flex gap-3 mb-6">
              <div className="h-8 w-24 bg-hover rounded-full" />
              <div className="h-8 w-20 bg-hover rounded-full" />
              <div className="h-8 w-28 bg-hover rounded-full" />
            </div>
            <div className="flex gap-8">
              <div className="h-6 w-32 bg-hover rounded" />
              <div className="h-6 w-32 bg-hover rounded" />
            </div>
          </CardContent>
        </Card>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="h-8 w-32 bg-hover rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-6 bg-hover rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="h-8 w-32 bg-hover rounded mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-hover rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 404 NOT FOUND COMPONENT
// ============================================================================

function RecipeNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-elevated flex items-center justify-center">
          <ChefHat className="h-12 w-12 text-muted" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Recipe Not Found
        </h1>
        <p className="text-muted mb-8">
          Sorry, we couldn't find the recipe you're looking for. It may have been
          deleted or the link might be incorrect.
        </p>
        <Link href="/recipes">
          <Button size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Recipes
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// ADD TO MEAL PLAN DIALOG
// ============================================================================

interface AddToMealPlanDialogProps {
  recipe: RecipeResponseDTO;
  mealSelections: MealSelectionResponseDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddToMealPlanDialog({ recipe, mealSelections, open, onOpenChange }: AddToMealPlanDialogProps) {
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    // Mock adding to meal plan
    console.log(`Adding ${recipe.recipe_name} to meal plan ${selectedMeal}`);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onOpenChange(false);
      setSelectedMeal(null);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Meal Plan</DialogTitle>
          <DialogDescription>
            Choose a meal to add "{recipe.recipe_name}" to, or create a new meal.
          </DialogDescription>
        </DialogHeader>

        {added ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <p className="text-foreground font-medium">Added to Meal Plan!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[300px] overflow-y-auto py-2">
              {mealSelections.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    selectedMeal === meal.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-hover"
                  )}
                >
                  <p className="font-medium text-foreground">{meal.meal_name}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {meal.main_recipe ? `Main: ${meal.main_recipe.recipe_name}` : "No main dish"}
                  </p>
                </button>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedMeal}
                className="gap-2"
              >
                <CalendarPlus className="h-4 w-4" />
                Add to Meal
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// INGREDIENT ITEM COMPONENT
// ============================================================================

interface IngredientItemProps {
  ingredient: RecipeResponseDTO["ingredients"][0];
  checked: boolean;
  onToggle: () => void;
}

function IngredientItem({ ingredient, checked, onToggle }: IngredientItemProps) {
  const quantity = formatQuantity(ingredient.quantity);
  const unit = ingredient.unit || "";

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

// ============================================================================
// DIRECTION STEP COMPONENT
// ============================================================================

interface DirectionStepProps {
  step: string;
  index: number;
  completed: boolean;
  onToggle: () => void;
}

function DirectionStep({ step, index, completed, onToggle }: DirectionStepProps) {
  return (
    <>
      {/* Web version - interactive step */}
      <button
        onClick={onToggle}
        className={cn(
          "flex gap-4 w-full text-left p-4 rounded-lg transition-all",
          "hover:bg-hover group print:hidden",
          completed && "opacity-50"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm transition-all",
          completed
            ? "bg-primary text-primary-foreground"
            : "bg-elevated text-muted group-hover:bg-primary/20 group-hover:text-primary"
        )}>
          {completed ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        <p className={cn(
          "flex-1 text-foreground leading-relaxed pt-1",
          completed && "line-through"
        )}>
          {step}
        </p>
      </button>

      {/* Print version - numbered text */}
      <div className="hidden print:block py-1 text-sm text-black leading-relaxed">
        <span className="font-semibold mr-2">{index + 1}.</span>
        {step}
      </div>
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = Number(params.id);
  
  // State
  const [recipe, setRecipe] = useState<RecipeResponseDTO | null>(null);
  const [mealSelections, setMealSelections] = useState<MealSelectionResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load recipe data
  useEffect(() => {
    async function fetchData() {
      try {
        const [foundRecipe, meals] = await Promise.all([
          recipeApi.get(recipeId),
          plannerApi.getMeals(),
        ]);
        setRecipe(foundRecipe);
        setIsFavorite(foundRecipe.is_favorite);
        setMealSelections(meals);
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [recipeId]);
  
  // Parse directions
  const directions = useMemo(() => {
    return parseDirections(recipe?.directions || null);
  }, [recipe?.directions]);
  
  // Group ingredients
  const groupedIngredients = useMemo(() => {
    if (!recipe?.ingredients) return new Map();
    return groupIngredientsByCategory(recipe.ingredients);
  }, [recipe?.ingredients]);
  
  // Handlers
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // In production: await fetch(`/api/recipes/${recipeId}/favorite`, { method: 'POST' })
  };
  
  const handleIngredientToggle = (ingredientId: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) {
        next.delete(ingredientId);
      } else {
        next.add(ingredientId);
      }
      return next;
    });
  };
  
  const handleStepToggle = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  };
  
  const handleDelete = async () => {
    try {
      await recipeApi.delete(recipeId);
      router.push("/recipes");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  // Loading state
  if (loading) {
    return <RecipeDetailSkeleton />;
  }
  
  // Not found state
  if (!recipe) {
    return <RecipeNotFound />;
  }
  
  // Progress calculations
  const ingredientProgress = recipe.ingredients.length > 0
    ? Math.round((checkedIngredients.size / recipe.ingredients.length) * 100)
    : 0;
  const stepProgress = directions.length > 0
    ? Math.round((completedSteps.size / directions.length) * 100)
    : 0;

  return (
    <>
      <div className="min-h-screen bg-background print:bg-white">
        {/* Hero Image Section - Hidden for Print */}
        <div className="print:hidden">
          <RecipeHeroImage
            src={recipe.reference_image_path}
            alt={recipe.recipe_name}
          >
            {/* Back Button - Fixed Position */}
            <div className="absolute top-6 left-6">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            {/* Favorite Button - Fixed Position */}
            <div className="absolute top-6 right-6">
              <FavoriteButton
                isFavorite={isFavorite}
                onToggle={handleFavoriteToggle}
                variant="overlay"
                size="lg"
              />
            </div>
          </RecipeHeroImage>
        </div>

        {/* Print-Only Layout */}
        <div className="hidden print:block p-8">
          {/* Header: Title and Meta */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black uppercase tracking-wide">
                {recipe.recipe_name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {[recipe.meal_type, recipe.recipe_category, recipe.diet_pref].filter(Boolean).join(" • ")}
              </p>
            </div>
            <div className="text-right text-sm text-gray-700">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span>{recipe.servings || "—"} servings</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <span>{formatTime(recipe.total_time)}</span>
              </div>
            </div>
          </div>

          {/* Recipe Image */}
          {recipe.reference_image_path && (
            <div className="mb-6">
              <img
                src={recipe.reference_image_path}
                alt={recipe.recipe_name}
                className="w-full max-h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Two Column: Ingredients & Directions */}
          <div className="flex gap-6">
            {/* Ingredients Column */}
            <div className="w-1/3 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h2 className="text-lg font-bold text-black uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
                Ingredients
              </h2>
              <div className="space-y-1 text-sm">
                {Array.from(groupedIngredients.entries()).map(([category, ingredients]) => (
                  <div key={category}>
                    {groupedIngredients.size > 1 && (
                      <p className="font-semibold text-gray-700 mt-3 mb-1 first:mt-0 text-xs uppercase">
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
            <div className="w-2/3 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-black uppercase tracking-wide mb-3 border-b border-gray-300 pb-2">
                Directions
              </h2>
              <ol className="space-y-2 text-sm list-decimal list-outside ml-4">
                {directions.map((step, index) => (
                  <li key={index} className="text-black leading-relaxed pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Chef's Notes */}
          {recipe.notes && (
            <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-base font-bold text-black mb-2">Chef's Notes</h3>
              <p className="text-sm text-gray-800">{recipe.notes}</p>
            </div>
          )}
        </div>
        
        {/* Main Content - Hidden for Print */}
        <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10 pb-12 print:hidden">
          {/* Recipe Header Card */}
          <Card className="mb-8 shadow-xl">
            <CardContent className="p-6 md:p-8">
              {/* Recipe Name */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                {recipe.recipe_name}
              </h1>
              
              {/* Badges */}
              <RecipeBadgeGroup className="mb-6">
                {recipe.meal_type && (
                  <RecipeBadge
                    label={recipe.meal_type}
                    type="mealType"
                    size="md"
                  />
                )}
                {recipe.recipe_category && (
                  <RecipeBadge
                    label={recipe.recipe_category}
                    type="category"
                    size="md"
                  />
                )}
                {recipe.diet_pref && (
                  <RecipeBadge
                    label={recipe.diet_pref}
                    type="dietary"
                    size="md"
                  />
                )}
              </RecipeBadgeGroup>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 text-muted">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Total Time</p>
                    <p className="font-semibold text-foreground">
                      {formatTime(recipe.total_time)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Servings</p>
                    <p className="font-semibold text-foreground">
                      {recipe.servings || "—"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Ingredients</p>
                    <p className="font-semibold text-foreground">
                      {recipe.ingredients.length} items
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <Separator className="my-6 print:hidden" />
              
              <div className="flex flex-wrap gap-3 print:hidden">
                <Button 
                  onClick={() => setMealPlanDialogOpen(true)}
                  className="gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add to Meal Plan
                </Button>
                
                <Link href={`/recipes/${recipeId}/edit`}>
                  <Button variant="secondary" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit Recipe
                  </Button>
                </Link>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Recipe</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Recipe</TooltipContent>
                </Tooltip>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-muted hover:text-error hover:border-error">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{recipe.recipe_name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-error hover:bg-error/90"
                      >
                        Delete Recipe
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
          
          {/* Two Column Layout: Ingredients & Directions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:space-y-6">
            {/* Ingredients Column */}
            <div className="lg:col-span-4 print:w-full">
              <Card className="sticky top-6 print:static print:shadow-none print:border print:border-gray-200">
                <CardContent className="p-6 print:p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 print:mb-2">
                    <div className="flex items-center gap-3 print:gap-0">
                      <div className="p-2 bg-secondary/10 rounded-lg print:hidden">
                        <BookOpen className="h-5 w-5 text-secondary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Ingredients
                      </h2>
                    </div>
                    {ingredientProgress > 0 && (
                      <span className="text-sm text-muted print:hidden">
                        {ingredientProgress}%
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {ingredientProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full bg-secondary transition-all duration-300"
                        style={{ width: `${ingredientProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Ingredients List */}
                  {recipe.ingredients.length > 0 ? (
                    <div className="space-y-1">
                      {Array.from(groupedIngredients.entries()).map(([category, ingredients], groupIndex) => (
                        <div key={category}>
                          {groupedIngredients.size > 1 && (
                            <p className="text-xs font-semibold text-muted uppercase tracking-wider mt-4 mb-2 first:mt-0">
                              {category}
                            </p>
                          )}
                          {ingredients.map((ingredient: RecipeResponseDTO["ingredients"][0]) => (
                            <IngredientItem
                              key={ingredient.id}
                              ingredient={ingredient}
                              checked={checkedIngredients.has(ingredient.id)}
                              onToggle={() => handleIngredientToggle(ingredient.id)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-8">
                      No ingredients listed
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Directions Column */}
            <div className="lg:col-span-8 print:w-full">
              <Card className="print:shadow-none print:border print:border-gray-200">
                <CardContent className="p-6 print:p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 print:mb-2">
                    <div className="flex items-center gap-3 print:gap-0">
                      <div className="p-2 bg-primary/10 rounded-lg print:hidden">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Directions
                      </h2>
                    </div>
                    {stepProgress > 0 && (
                      <span className="text-sm text-muted print:hidden">
                        {stepProgress}%
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {stepProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${stepProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Directions Steps */}
                  {directions.length > 0 ? (
                    <div className="space-y-2">
                      {directions.map((step, index) => (
                        <DirectionStep
                          key={index}
                          step={step}
                          index={index}
                          completed={completedSteps.has(index)}
                          onToggle={() => handleStepToggle(index)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-8">
                      No directions available
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Notes Section */}
              {recipe.notes && (
                <Card className="mt-8 border-warning/30 bg-warning/5 print:mt-4 print:border print:border-gray-300 print:bg-gray-50 print:shadow-none">
                  <CardContent className="p-6 print:p-4">
                    <div className="flex items-start gap-4 print:gap-2">
                      <div className="p-2 bg-warning/20 rounded-lg flex-shrink-0 print:hidden">
                        <Lightbulb className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2 print:text-base print:text-black print:mb-1">
                          Chef's Notes
                        </h3>
                        <p className="text-foreground/80 leading-relaxed print:text-sm print:text-black">
                          {recipe.notes}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add to Meal Plan Dialog */}
      <AddToMealPlanDialog
        recipe={recipe}
        mealSelections={mealSelections}
        open={mealPlanDialogOpen}
        onOpenChange={setMealPlanDialogOpen}
      />
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Page setup */
          @page {
            margin: 0.5in;
            size: letter;
          }

          /* Base styles */
          body {
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
            line-height: 1.4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Hide interactive/web-only elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Show print-only elements */
          .hidden.print\\:block {
            display: block !important;
          }

          /* Reset positioning */
          .print\\:static {
            position: static !important;
          }

          /* Remove shadows */
          .print\\:shadow-none {
            box-shadow: none !important;
          }

          /* Border utilities */
          .print\\:border-0 {
            border: none !important;
          }

          .print\\:border {
            border-width: 1px !important;
          }

          .print\\:border-gray-200 {
            border-color: #e5e7eb !important;
          }

          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }

          /* Background colors */
          .print\\:bg-white {
            background: white !important;
          }

          .print\\:bg-gray-50 {
            background: #f9fafb !important;
          }

          /* Text colors */
          .print\\:text-black {
            color: black !important;
          }

          /* Typography */
          .print\\:text-lg {
            font-size: 1.125rem !important;
          }

          .print\\:text-base {
            font-size: 1rem !important;
          }

          .print\\:text-sm {
            font-size: 0.875rem !important;
          }

          /* Spacing */
          .print\\:mt-0 {
            margin-top: 0 !important;
          }

          .print\\:mt-4 {
            margin-top: 1rem !important;
          }

          .print\\:mb-1 {
            margin-bottom: 0.25rem !important;
          }

          .print\\:mb-2 {
            margin-bottom: 0.5rem !important;
          }

          .print\\:p-4 {
            padding: 1rem !important;
          }

          .print\\:space-y-6 > * + * {
            margin-top: 1.5rem !important;
          }

          .print\\:gap-0 {
            gap: 0 !important;
          }

          .print\\:gap-2 {
            gap: 0.5rem !important;
          }

          /* Width */
          .print\\:w-full {
            width: 100% !important;
          }

          /* Layout */
          .print\\:block {
            display: block !important;
          }

          /* Page break controls */
          h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Keep content together */
          .print\\:border {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Links */
          a {
            text-decoration: none !important;
            color: black !important;
          }
        }
      `}</style>
    </>
  );
}