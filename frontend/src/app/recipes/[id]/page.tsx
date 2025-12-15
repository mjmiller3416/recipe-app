// app/recipes/[id]/page.tsx
// Individual recipe detail page with hero banner, ingredients, and directions

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Users,
  ChefHat,
  Printer,
  Pencil,
  Trash2,
  ArrowLeft,
  BookOpen,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FavoriteButton } from "@/components/FavoriteButton";
import { RecipeBadge, RecipeBadgeGroup } from "@/components/RecipeBadge";
import { recipeApi } from "@/lib/api";
import { getRecipeImageUrl } from "@/lib/imageUtils";
import type { RecipeResponseDTO, RecipeIngredientResponseDTO } from "@/types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "N/A";
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
    .map((step) => step.trim())
    .filter((step) => step.length > 0)
    .map((step) => {
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

  ingredients.forEach((ing) => {
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 bg-hover rounded" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="h-8 w-32 bg-hover rounded mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-hover rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NOT FOUND COMPONENT
// ============================================================================

function RecipeNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md mx-4">
        <CardContent className="p-8 text-center">
          <div className="p-4 bg-error/10 rounded-full w-fit mx-auto mb-4">
            <ChefHat className="h-12 w-12 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Recipe Not Found
          </h1>
          <p className="text-muted mb-6">
            The recipe you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/recipes">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Recipes
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HERO BANNER IMAGE COMPONENT
// ============================================================================

interface HeroBannerImageProps {
  bannerPath: string | null | undefined;
  referencePath: string | null | undefined;
  recipeName: string;
}

function HeroBannerImage({ bannerPath, referencePath, recipeName }: HeroBannerImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Prefer banner image, fall back to reference image
  const imagePath = bannerPath || referencePath;
  const imageUrl = getRecipeImageUrl(imagePath);
  
  // Show placeholder if no valid image URL or if there was an error
  const showPlaceholder = !imageUrl || hasError;

  if (showPlaceholder) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
        <ChefHat className="h-32 w-32 text-muted opacity-30" />
      </div>
    );
  }

  return (
    <>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-elevated via-hover to-elevated">
          <ChefHat className="h-32 w-32 text-muted opacity-30 animate-pulse" />
        </div>
      )}
      
      {/* Main image with zoom effect */}
      <img
        src={imageUrl}
        alt={recipeName}
        className={`
          w-full h-full object-cover
          transition-all duration-700 ease-out
          hover:scale-105
          ${!isLoaded ? 'opacity-0' : 'opacity-100'}
        `}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      
      {/* Gradient overlay for edge fading effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      
      {/* Additional vignette effect for softer edges */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set()
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Fetch recipe data
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await recipeApi.get(recipeId);
        setRecipe(data);
        setIsFavorite(data.is_favorite);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipe");
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    if (recipeId) {
      fetchRecipe();
    }
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
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recipe) return;

    // Optimistic update
    setIsFavorite(!isFavorite);

    try {
      await recipeApi.toggleFavorite(recipeId);
    } catch (err) {
      // Revert on error
      setIsFavorite(isFavorite);
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleIngredientToggle = (ingredientId: number) => {
    setCheckedIngredients((prev) => {
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
    setCompletedSteps((prev) => {
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
    } catch (err) {
      console.error("Failed to delete recipe:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return <RecipeDetailSkeleton />;
  }

  // Not found or error state
  if (error || !recipe) {
    return <RecipeNotFound />;
  }

  // Progress calculations
  const ingredientProgress =
    recipe.ingredients.length > 0
      ? Math.round((checkedIngredients.size / recipe.ingredients.length) * 100)
      : 0;
  const stepProgress =
    directions.length > 0
      ? Math.round((completedSteps.size / directions.length) * 100)
      : 0;

  return (
    <>
      <div className="min-h-screen bg-background print:bg-white">
        {/* Hero Image Section */}
        <div className="relative h-[300px] md:h-[400px] bg-elevated overflow-hidden group">
          <HeroBannerImage
            bannerPath={recipe.banner_image_path}
            referencePath={recipe.reference_image_path}
            recipeName={recipe.recipe_name}
          />

          {/* Back Button - Fixed Position */}
          <div className="absolute top-6 left-6 print:hidden z-10">
            <Link href="/recipes">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recipes
              </Button>
            </Link>
          </div>

          {/* Favorite Button - Fixed Position */}
          <div className="absolute top-6 right-6 print:hidden z-10">
            <FavoriteButton
              isFavorite={isFavorite}
              onToggle={handleFavoriteToggle}
              variant="overlay"
              size="lg"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10 pb-12">
          {/* Recipe Header Card */}
          <Card className="mb-8 shadow-xl print:shadow-none print:border-0">
            <CardContent className="p-6 md:p-8">
              {/* Recipe Name */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                {recipe.recipe_name}
              </h1>

              {/* Badges */}
              <RecipeBadgeGroup className="mb-6">
                {recipe.meal_type && (
                  <RecipeBadge label={recipe.meal_type} type="mealType" size="md" />
                )}
                {recipe.recipe_category && (
                  <RecipeBadge
                    label={recipe.recipe_category}
                    type="category"
                    size="md"
                  />
                )}
                {recipe.diet_pref && (
                  <RecipeBadge label={recipe.diet_pref} type="dietary" size="md" />
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

                <div className="h-10 w-px bg-border" />

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted">Servings</p>
                    <p className="font-semibold text-foreground">
                      {recipe.servings || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Link href={`/recipes/${recipeId}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-error hover:text-error hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{recipe.recipe_name}"?
                        This action cannot be undone.
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Ingredients Column */}
            <div className="lg:col-span-4">
              <Card className="sticky top-6 print:static">
                <CardContent className="p-6">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-secondary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
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
                    <div className="space-y-4">
                      {Array.from(groupedIngredients.entries()).map(
                        ([category, items]) => (
                          <div key={category}>
                            {groupedIngredients.size > 1 && (
                              <h3 className="text-sm font-medium text-muted mb-2 uppercase tracking-wider">
                                {category}
                              </h3>
                            )}
                            <ul className="space-y-2">
                              {items.map((ing: RecipeIngredientResponseDTO) => (
                                <li
                                  key={ing.id}
                                  className="flex items-start gap-3 group/item"
                                >
                                  <Checkbox
                                    id={`ing-${ing.id}`}
                                    checked={checkedIngredients.has(ing.id)}
                                    onCheckedChange={() =>
                                      handleIngredientToggle(ing.id)
                                    }
                                    className="mt-0.5 print:hidden"
                                  />
                                  <label
                                    htmlFor={`ing-${ing.id}`}
                                    className={`flex-1 text-sm cursor-pointer transition-colors ${
                                      checkedIngredients.has(ing.id)
                                        ? "text-muted line-through"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {ing.quantity && (
                                      <span className="font-medium">
                                        {ing.quantity}
                                        {ing.unit && ` ${ing.unit}`}{" "}
                                      </span>
                                    )}
                                    {ing.ingredient_name}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted text-sm italic">
                      No ingredients listed
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Directions Column */}
            <div className="lg:col-span-8 space-y-6">
              <Card>
                <CardContent className="p-6">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ChefHat className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
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
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-6 print:hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${stepProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Steps */}
                  {directions.length > 0 ? (
                    <ol className="space-y-4">
                      {directions.map((step, index) => (
                        <li key={index} className="flex gap-4 group/step">
                          <button
                            onClick={() => handleStepToggle(index)}
                            className={`
                              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                              text-sm font-semibold transition-all duration-200
                              print:bg-primary/10 print:text-primary
                              ${
                                completedSteps.has(index)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-elevated text-muted hover:bg-hover"
                              }
                            `}
                          >
                            {index + 1}
                          </button>
                          <p
                            className={`flex-1 pt-1 transition-colors ${
                              completedSteps.has(index)
                                ? "text-muted"
                                : "text-foreground"
                            }`}
                          >
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted text-sm italic">
                      No directions provided
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              {recipe.notes && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-warning/10 rounded-lg">
                        <StickyNote className="h-5 w-5 text-warning" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">
                        Notes
                      </h2>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">
                      {recipe.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}