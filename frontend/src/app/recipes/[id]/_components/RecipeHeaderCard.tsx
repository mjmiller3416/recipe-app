"use client";

import Link from "next/link";
import {
  Clock,
  Users,
  Edit3,
  Trash2,
  Printer,
  CalendarPlus,
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
import type { RecipeResponseDTO } from "@/types";
import { formatTime } from "./recipe-utils";

interface RecipeHeaderCardProps {
  recipe: RecipeResponseDTO;
  recipeId: number;
  onMealPlanClick: () => void;
  onPrintClick: () => void;
  onShare: () => void;
  onDelete: () => void;
}

/**
 * Header card component displaying recipe title, badges, stats, and action buttons.
 * Handles Edit, Print, Share, Delete, and Add to Meal Plan actions.
 */
export function RecipeHeaderCard({
  recipe,
  recipeId,
  onMealPlanClick,
  onPrintClick,
  onShare,
  onDelete,
}: RecipeHeaderCardProps) {
  return (
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
            onClick={onMealPlanClick}
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
              <Button variant="outline" size="icon" onClick={onPrintClick}>
                <Printer className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Print Recipe</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onShare}>
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
                  onClick={onDelete}
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
  );
}
