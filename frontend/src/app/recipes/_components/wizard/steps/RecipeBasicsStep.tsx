"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MEAL_TYPE_OPTIONS, DIETARY_PREFERENCES } from "@/lib/constants";
import { useCategoryOptions } from "@/hooks/api";

interface RecipeBasicsStepProps {
  recipeName: string;
  setRecipeName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  prepTime: string;
  setPrepTime: (v: string) => void;
  cookTime: string;
  setCookTime: (v: string) => void;
  servings: string;
  setServings: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  mealType: string;
  setMealType: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  dietaryPreference: string;
  setDietaryPreference: (v: string) => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
}

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
  { value: "Expert", label: "Expert" },
] as const;

export function RecipeBasicsStep({
  recipeName,
  setRecipeName,
  description,
  setDescription,
  prepTime,
  setPrepTime,
  cookTime,
  setCookTime,
  servings,
  setServings,
  difficulty,
  setDifficulty,
  mealType,
  setMealType,
  category,
  setCategory,
  dietaryPreference,
  setDietaryPreference,
  hasError,
  getError,
}: RecipeBasicsStepProps) {
  const { formOptions: categoryOptions } = useCategoryOptions();

  return (
    <div className="space-y-6">
      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Recipe Title */}
          <div className="space-y-2">
            <Label htmlFor="wizard-recipe-name">
              Recipe Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="wizard-recipe-name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Grandma's Chocolate Chip Cookies"
              className={cn(hasError("recipeName") && "border-destructive")}
            />
            {hasError("recipeName") && (
              <p className="text-sm text-destructive">{getError("recipeName")}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="wizard-description">Description</Label>
            <Textarea
              id="wizard-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your recipe..."
              rows={4}
              className={cn(hasError("description") && "border-destructive")}
            />
            {hasError("description") && (
              <p className="text-sm text-destructive">{getError("description")}</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Prep Time */}
          <div className="space-y-2">
            <Label htmlFor="wizard-prep-time">Prep Time (min)</Label>
            <Input
              id="wizard-prep-time"
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="0"
              className={cn(hasError("prepTime") && "border-destructive")}
            />
            {hasError("prepTime") && (
              <p className="text-sm text-destructive">{getError("prepTime")}</p>
            )}
          </div>

          {/* Cook Time */}
          <div className="space-y-2">
            <Label htmlFor="wizard-cook-time">Cook Time (min)</Label>
            <Input
              id="wizard-cook-time"
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="0"
              className={cn(hasError("cookTime") && "border-destructive")}
            />
            {hasError("cookTime") && (
              <p className="text-sm text-destructive">{getError("cookTime")}</p>
            )}
          </div>

          {/* Servings */}
          <div className="space-y-2">
            <Label htmlFor="wizard-servings">Servings</Label>
            <Input
              id="wizard-servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
              className={cn(hasError("servings") && "border-destructive")}
            />
            {hasError("servings") && (
              <p className="text-sm text-destructive">{getError("servings")}</p>
            )}
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label htmlFor="wizard-difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger
                id="wizard-difficulty"
                className={cn(hasError("difficulty") && "border-destructive")}
              >
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent portal>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError("difficulty") && (
              <p className="text-sm text-destructive">{getError("difficulty")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Full-width row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Meal Type */}
        <div className="space-y-2">
          <Label htmlFor="wizard-meal-type">Meal Type</Label>
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger
              id="wizard-meal-type"
              className={cn(hasError("mealType") && "border-destructive")}
            >
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent portal>
              {MEAL_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError("mealType") && (
            <p className="text-sm text-destructive">{getError("mealType")}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="wizard-category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              id="wizard-category"
              className={cn(hasError("category") && "border-destructive")}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent portal>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError("category") && (
            <p className="text-sm text-destructive">{getError("category")}</p>
          )}
        </div>

        {/* Dietary Preference */}
        <div className="space-y-2">
          <Label htmlFor="wizard-dietary">Dietary Preference</Label>
          <Select value={dietaryPreference} onValueChange={setDietaryPreference}>
            <SelectTrigger
              id="wizard-dietary"
              className={cn(
                hasError("dietaryPreference") && "border-destructive"
              )}
            >
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent portal>
              {DIETARY_PREFERENCES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError("dietaryPreference") && (
            <p className="text-sm text-destructive">
              {getError("dietaryPreference")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
