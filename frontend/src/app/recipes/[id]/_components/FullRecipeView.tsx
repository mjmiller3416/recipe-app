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
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import type { RecipeResponseDTO, PlannerEntryResponseDTO } from "@/types";
import { formatQuantity } from "@/lib/utils";
import { INGREDIENT_CATEGORY_ORDER } from "@/lib/constants";
import { useRecentRecipes } from "@/hooks";

import { IngredientItem } from "./IngredientItem";
import { DirectionStep } from "./DirectionStep";
import { AddToMealPlanDialog } from "./AddToMealPlanDialog";
import { PrintPreviewDialog, type PrintOptions } from "./PrintPreviewDialog";

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

// Sort grouped categories by priority order (Meat first, then logical order)
function sortCategoryEntries(
  entries: [string, RecipeResponseDTO["ingredients"]][]
): [string, RecipeResponseDTO["ingredients"]][] {
  return entries.sort(([a], [b]) => {
    const aIndex = INGREDIENT_CATEGORY_ORDER.indexOf(a.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);
    const bIndex = INGREDIENT_CATEGORY_ORDER.indexOf(b.toLowerCase() as typeof INGREDIENT_CATEGORY_ORDER[number]);
    // Unknown categories go to the end
    const aOrder = aIndex === -1 ? INGREDIENT_CATEGORY_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? INGREDIENT_CATEGORY_ORDER.length : bIndex;
    return aOrder - bOrder;
  });
}

// ============================================================================
// SKELETON LOADING COMPONENT
// ============================================================================

function RecipeDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative h-[300px] md:h-[400px] bg-elevated" />

      <div className="relative z-10 max-w-5xl px-6 mx-auto -mt-16">
        {/* Header Card Skeleton */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="w-3/4 h-10 mb-4 rounded-lg bg-hover" />
            <div className="flex gap-3 mb-6">
              <div className="w-24 h-8 rounded-full bg-hover" />
              <div className="w-20 h-8 rounded-full bg-hover" />
              <div className="h-8 rounded-full w-28 bg-hover" />
            </div>
            <div className="flex gap-8">
              <div className="w-32 h-6 rounded bg-hover" />
              <div className="w-32 h-6 rounded bg-hover" />
            </div>
          </CardContent>
        </Card>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="w-32 h-8 mb-4 rounded bg-hover" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-6 rounded bg-hover" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="w-32 h-8 mb-4 rounded bg-hover" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded bg-hover" />
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
    <div className="flex items-center justify-center min-h-screen px-6 bg-background">
      <div className="max-w-md text-center">
        <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-elevated">
          <ChefHat className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-foreground">
          Recipe Not Found
        </h1>
        <p className="mb-8 text-muted-foreground">
          Sorry, we couldn't find the recipe you're looking for. It may have been
          deleted or the link might be incorrect.
        </p>
        <Link href="/recipes">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Recipes
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export function FullRecipeView() {
  const params = useParams();
  const router = useRouter();
  const recipeId = Number(params.id);
  const { addToRecent } = useRecentRecipes();

  // State
  const [recipe, setRecipe] = useState<RecipeResponseDTO | null>(null);
  const [plannerEntries, setPlannerEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [mealPlanDialogOpen, setMealPlanDialogOpen] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    showImage: true,
    showNotes: true,
    showMeta: true,
  });

  // Load recipe data
  useEffect(() => {
    async function fetchData() {
      try {
        const [foundRecipe, entries] = await Promise.all([
          recipeApi.get(recipeId),
          plannerApi.getEntries(),
        ]);
        setRecipe(foundRecipe);
        setIsFavorite(foundRecipe.is_favorite);
        setPlannerEntries(entries);

        // Track this recipe as recently viewed
        addToRecent({
          id: foundRecipe.id,
          name: foundRecipe.recipe_name,
          category: foundRecipe.recipe_category || undefined,
        });
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [recipeId, addToRecent]);

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

  const handlePrint = (options: PrintOptions) => {
    if (!recipe) return;

    // Generate clean HTML for printing - bypasses all CSS inheritance issues
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${recipe.recipe_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: black;
      padding: 0.5in;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .title { 
      font-size: 18pt; 
      font-weight: bold; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .subtitle { 
      font-size: 10pt; 
      color: #666; 
      margin-top: 0.25rem;
    }
    .meta { 
      text-align: right; 
      font-size: 10pt; 
      color: #444;
    }
    .image { 
      width: 100%; 
      max-height: 200px; 
      object-fit: cover; 
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .section { 
      margin-bottom: 1rem;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #fafafa;
    }
    .section-title { 
      font-size: 12pt; 
      font-weight: bold; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25rem;
      margin-bottom: 0.5rem;
    }
    .ingredients-grid {
      columns: 2;
      column-gap: 1.5rem;
    }
    .category { 
      font-size: 9pt; 
      font-weight: 600; 
      text-transform: uppercase;
      color: #555;
      margin: 0.5rem 0 0.25rem 0;
      break-inside: avoid;
    }
    .category:first-child { margin-top: 0; }
    .ingredient { 
      font-size: 10pt; 
      padding: 0.1rem 0;
    }
    .ingredient strong { font-weight: 600; }
    .directions { 
      padding-left: 1.25rem;
    }
    .directions li { 
      font-size: 10pt; 
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
    .notes-section {
      background: #fef3c7;
      border-color: #fcd34d;
    }
    .notes-title {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    .notes-text {
      font-size: 10pt;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${recipe.recipe_name}</div>
      <div class="subtitle">${[recipe.meal_type, recipe.recipe_category, recipe.diet_pref].filter(Boolean).join(" • ")}</div>
    </div>
    ${options.showMeta ? `
    <div class="meta">
      <div>${recipe.servings || "—"} servings</div>
      <div>${formatTime(recipe.total_time)}</div>
    </div>
    ` : ""}
  </div>

  ${options.showImage && recipe.reference_image_path ? `
  <img class="image" src="${recipe.reference_image_path}" alt="${recipe.recipe_name}">
  ` : ""}

  <div class="section">
    <div class="section-title">Ingredients</div>
    <div class="ingredients-grid">
      ${sortCategoryEntries(Array.from(groupedIngredients.entries())).map(([category, ings]) => `
        ${groupedIngredients.size > 1 ? `<div class="category">${category}</div>` : ""}
        ${ings.map((ing: RecipeResponseDTO["ingredients"][0]) => `
          <div class="ingredient">
            <strong>${formatQuantity(ing.quantity)} ${ing.unit || ""}</strong>${(ing.quantity || ing.unit) ? " " : ""}${ing.ingredient_name}
          </div>
        `).join("")}
      `).join("")}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Directions</div>
    <ol class="directions">
      ${directions.map(step => `<li>${step}</li>`).join("")}
    </ol>
  </div>

  ${options.showNotes && recipe.notes ? `
  <div class="section notes-section">
    <div class="notes-title">Chef's Notes</div>
    <div class="notes-text">${recipe.notes}</div>
  </div>
  ` : ""}
</body>
</html>`;

    // Create a hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load (especially images), then print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          // Remove iframe after printing
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 250);
      };
    }
  };

  const handleMealAdded = async () => {
    // Refresh planner entries after adding recipe to meal
    const entries = await plannerApi.getEntries();
    setPlannerEntries(entries);
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
                <ArrowLeft className="w-4 h-4" />
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
        <div className="hidden p-6 print:block">
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

          {/* Simple stacked layout for reliable printing */}
          <div className="print-content">
            {/* Ingredients Section */}
            <div className="print-section">
              <h2 className="print-section-header">Ingredients</h2>
              <div className="print-section-body">
                {sortCategoryEntries(Array.from(groupedIngredients.entries())).map(([category, ingredients]) => (
                  <div key={category}>
                    {groupedIngredients.size > 1 && (
                      <p className="print-category">{category}</p>
                    )}
                    {ingredients.map((ingredient: RecipeResponseDTO["ingredients"][0]) => (
                      <p key={ingredient.id} className="print-ingredient">
                        <span className="font-medium">{formatQuantity(ingredient.quantity)} {ingredient.unit || ""}</span>
                        {(ingredient.quantity || ingredient.unit) && " "}
                        {ingredient.ingredient_name}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Directions Section */}
            <div className="print-section">
              <h2 className="print-section-header">Directions</h2>
              <ol className="print-directions-list">
                {directions.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Chef's Notes */}
            {printOptions.showNotes && recipe.notes && (
              <div className="print-section print-notes-section">
                <h3 className="print-notes-header">Chef's Notes</h3>
                <p className="print-notes-text">{recipe.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Hidden for Print */}
        <div className="relative z-10 max-w-5xl px-6 pb-12 mx-auto -mt-16 print:hidden">
          {/* Recipe Header Card */}
          <Card className="mb-8 shadow-xl">
            <CardContent className="p-6 md:p-8">
              {/* Recipe Name */}
              <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl text-foreground">
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
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Time</p>
                    <p className="font-semibold text-foreground">
                      {formatTime(recipe.total_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Servings</p>
                    <p className="font-semibold text-foreground">
                      {recipe.servings || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ingredients</p>
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
                  <CalendarPlus className="w-4 h-4" />
                  Add to Meal Plan
                </Button>

                <Link href={`/recipes/${recipeId}/edit`}>
                  <Button variant="secondary" className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit Recipe
                  </Button>
                </Link>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setPrintDialogOpen(true)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Recipe</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Recipe</TooltipContent>
                </Tooltip>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-muted-foreground hover:text-error hover:border-error">
                      <Trash2 className="w-4 h-4" />
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 print:block print:space-y-6">
            {/* Ingredients Column */}
            <div className="lg:col-span-4 print:w-full">
              <Card className="sticky top-6 print:static print:shadow-none print:border print:border-gray-200">
                <CardContent className="p-6 print:p-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4 print:mb-2">
                    <div className="flex items-center gap-3 print:gap-0">
                      <div className="p-2 rounded-lg bg-secondary/10 print:hidden">
                        <BookOpen className="w-5 h-5 text-secondary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Ingredients
                      </h2>
                    </div>
                    {ingredientProgress > 0 && (
                      <span className="text-sm text-muted-foreground print:hidden">
                        {ingredientProgress}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {ingredientProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full transition-all duration-300 bg-secondary"
                        style={{ width: `${ingredientProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Ingredients List */}
                  {recipe.ingredients.length > 0 ? (
                    <div className="space-y-1">
                      {sortCategoryEntries(Array.from(groupedIngredients.entries())).map(([category, ingredients]) => (
                        <div key={category}>
                          {groupedIngredients.size > 1 && (
                            <p className="mt-4 mb-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground first:mt-0">
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
                    <p className="py-8 text-center text-muted-foreground">
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
                      <div className="p-2 rounded-lg bg-primary/10 print:hidden">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground print:text-lg print:text-black">
                        Directions
                      </h2>
                    </div>
                    {stepProgress > 0 && (
                      <span className="text-sm text-muted-foreground print:hidden">
                        {stepProgress}%
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {stepProgress > 0 && (
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mb-4 print:hidden">
                      <div
                        className="h-full transition-all duration-300 bg-primary"
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
                    <p className="py-8 text-center text-muted-foreground">
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
                      <div className="flex-shrink-0 p-2 rounded-lg bg-warning/20 print:hidden">
                        <Lightbulb className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-foreground print:text-base print:text-black print:mb-1">
                          Chef's Notes
                        </h3>
                        <p className="leading-relaxed text-foreground/80 print:text-sm print:text-black">
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
        plannerEntries={plannerEntries}
        open={mealPlanDialogOpen}
        onOpenChange={setMealPlanDialogOpen}
        onSuccess={handleMealAdded}
      />

      {/* Print Preview Dialog */}
      <PrintPreviewDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handlePrint}
        hasImage={!!recipe.reference_image_path}
        hasNotes={!!recipe.notes}
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

          /* ========== SIMPLE PRINT LAYOUT ========== */
          
          .print-content {
            font-size: 11pt;
            line-height: 1.4;
          }

          .print-section {
            margin-bottom: 1rem;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            background: #f9fafb;
          }

          .print-section-header {
            margin: 0 0 0.5rem 0;
            padding-bottom: 0.25rem;
            border-bottom: 1px solid #d1d5db;
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .print-section-body {
            columns: 2;
            column-gap: 1.5rem;
          }

          .print-category {
            margin: 0.5rem 0 0.25rem 0;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            color: #4b5563;
            break-inside: avoid;
          }

          .print-category:first-child {
            margin-top: 0;
          }

          .print-ingredient {
            margin: 0;
            padding: 0.125rem 0;
            font-size: 10pt;
            break-inside: avoid;
          }

          .print-directions-list {
            margin: 0;
            padding-left: 1.25rem;
            list-style: decimal outside;
          }

          .print-directions-list li {
            margin-bottom: 0.5rem;
            padding-left: 0.25rem;
            font-size: 10pt;
            line-height: 1.5;
          }

          .print-notes-section {
            background: #fef3c7;
            border-color: #fcd34d;
          }

          .print-notes-header {
            margin: 0 0 0.25rem 0;
            font-size: 11pt;
            font-weight: bold;
          }

          .print-notes-text {
            margin: 0;
            font-size: 10pt;
            line-height: 1.4;
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