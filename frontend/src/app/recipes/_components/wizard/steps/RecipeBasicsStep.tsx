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
import { ImageUploadCard } from "@/app/recipes/_components/add-edit/ImageUploadCard";

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
  // Image props
  imagePreview: string | null;
  isAiGenerated: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGeneratedImageAccept: (
    refBase64: string,
    refDataUrl: string,
    bannerBase64?: string
  ) => void;
  onBannerOnlyAccept: (bannerBase64: string) => void;
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
  imagePreview,
  isAiGenerated,
  onImageUpload,
  onGeneratedImageAccept,
  onBannerOnlyAccept,
}: RecipeBasicsStepProps) {
  const { formOptions: categoryOptions } = useCategoryOptions();

  return (
    /*
      Layout: flex row with fixed-width image column + fluid form column.
      On mobile (<md), stacks vertically with image centered.
    */
    <div className="flex flex-col md:flex-row gap-6">
      {/* ── Left column — Image (fixed width, 1:1 aspect ratio) ───── */}
      <div className="w-full md:w-60 shrink-0 overflow-hidden">
        <ImageUploadCard
          recipeName={recipeName}
          imagePreview={imagePreview}
          isAiGenerated={isAiGenerated}
          onImageUpload={onImageUpload}
          onGeneratedImageAccept={onGeneratedImageAccept}
          onBannerOnlyAccept={onBannerOnlyAccept}
          compact
        />
      </div>

      {/* ── Right column — All form fields ────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Recipe Title */}
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label htmlFor="wizard-description">Description</Label>
          <Textarea
            id="wizard-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your recipe..."
            rows={3}
            className={cn(hasError("description") && "border-destructive")}
          />
          {hasError("description") && (
            <p className="text-sm text-destructive">
              {getError("description")}
            </p>
          )}
        </div>

        {/* Prep / Cook / Servings — 3-column row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
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
              <p className="text-xs text-destructive">
                {getError("prepTime")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
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
              <p className="text-xs text-destructive">
                {getError("cookTime")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
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
              <p className="text-xs text-destructive">
                {getError("servings")}
              </p>
            )}
          </div>
        </div>

        {/* Difficulty / Category — 2-column row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger
                id="wizard-difficulty"
                className={cn(hasError("difficulty") && "border-destructive")}
              >
                <SelectValue placeholder="Select" />
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
              <p className="text-xs text-destructive">
                {getError("difficulty")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wizard-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="wizard-category"
                className={cn(hasError("category") && "border-destructive")}
              >
                <SelectValue placeholder="Select" />
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
              <p className="text-xs text-destructive">
                {getError("category")}
              </p>
            )}
          </div>
        </div>

        {/* Meal Type / Dietary — 2-column row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wizard-meal-type">Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger
                id="wizard-meal-type"
                className={cn(hasError("mealType") && "border-destructive")}
              >
                <SelectValue placeholder="Select" />
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
              <p className="text-xs text-destructive">
                {getError("mealType")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wizard-dietary">Dietary Preference</Label>
            <Select value={dietaryPreference} onValueChange={setDietaryPreference}>
              <SelectTrigger
                id="wizard-dietary"
                className={cn(
                  hasError("dietaryPreference") && "border-destructive"
                )}
              >
                <SelectValue placeholder="None" />
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
              <p className="text-xs text-destructive">
                {getError("dietaryPreference")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}