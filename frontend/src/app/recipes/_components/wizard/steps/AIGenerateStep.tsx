"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ChefHat,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  WizardGenerationPreferencesDTO,
  WizardGeneratedRecipeDTO,
} from "@/types/ai";

// ============================================================================
// Props
// ============================================================================

interface AIGenerateStepProps {
  prompt: string;
  setPrompt: (value: string) => void;
  preferences: WizardGenerationPreferencesDTO;
  setPreferences: (value: WizardGenerationPreferencesDTO) => void;
  generatedRecipe: WizardGeneratedRecipeDTO | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onAcceptRecipe: () => void;
}

// ============================================================================
// Quick Suggestion Chips
// ============================================================================

const QUICK_SUGGESTIONS = [
  "Quick 15-min weeknight dinner",
  "Healthy low-carb lunch",
  "Kid-friendly comfort food",
  "Elegant date night entree",
  "Easy meal prep for the week",
  "Cozy Sunday soup",
];

// ============================================================================
// Component
// ============================================================================

export function AIGenerateStep({
  prompt,
  setPrompt,
  preferences,
  setPreferences,
  generatedRecipe,
  isGenerating,
  error,
  onGenerate,
  onAcceptRecipe,
}: AIGenerateStepProps) {
  const [showOptions, setShowOptions] = useState(false);

  const charCount = prompt.length;
  const charLimit = 500;

  return (
    <div className="space-y-6">
      {/* Subtitle only — title comes from the wizard header */}
      <p className="text-sm text-muted-foreground">
        Describe the recipe you&apos;d like and AI will create it for you.
      </p>

      {/* Prompt Input */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="ai-prompt">What would you like to cook?</Label>
          <Textarea
            id="ai-prompt"
            placeholder="Describe the recipe you'd like... e.g., 'A spicy Thai green curry with vegetables for 4 people'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={charLimit}
            disabled={isGenerating}
            className="min-h-28 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {charCount}/{charLimit}
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => {
                if (!isGenerating) setPrompt(suggestion);
              }}
              role="button"
              tabIndex={isGenerating ? -1 : 0}
              onKeyDown={(e) => {
                if (
                  !isGenerating &&
                  (e.key === "Enter" || e.key === " ")
                ) {
                  e.preventDefault();
                  setPrompt(suggestion);
                }
              }}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>

      {/* Options Collapsible */}
      <Collapsible open={showOptions} onOpenChange={setShowOptions}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground"
          >
            Preferences (optional)
            {showOptions ? (
              <ChevronUp className="size-4" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="size-4" strokeWidth={1.5} />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <Card>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Cuisine */}
              <div className="space-y-2">
                <Label htmlFor="pref-cuisine">Cuisine</Label>
                <Input
                  id="pref-cuisine"
                  placeholder="e.g., Thai, Italian, Mexican"
                  value={preferences.cuisine || ""}
                  onChange={(e) =>
                    setPreferences({ ...preferences, cuisine: e.target.value || undefined })
                  }
                  disabled={isGenerating}
                />
              </div>

              {/* Dietary */}
              <div className="space-y-2">
                <Label htmlFor="pref-dietary">Dietary Preference</Label>
                <Select
                  value={preferences.dietary || ""}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, dietary: value || undefined })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger id="pref-dietary">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Any</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="gluten-free">Gluten Free</SelectItem>
                    <SelectItem value="dairy-free">Dairy Free</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="pref-difficulty">Difficulty</Label>
                <Select
                  value={preferences.difficulty || ""}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, difficulty: value || undefined })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger id="pref-difficulty">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Servings */}
              <div className="space-y-2">
                <Label htmlFor="pref-servings">Servings</Label>
                <Input
                  id="pref-servings"
                  type="number"
                  min={1}
                  placeholder="e.g., 4"
                  value={preferences.servings ?? ""}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      servings: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  disabled={isGenerating}
                />
              </div>

              {/* Meal Type */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pref-meal-type">Meal Type</Label>
                <Select
                  value={preferences.meal_type || ""}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, meal_type: value || undefined })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger id="pref-meal-type">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="sauce">Sauce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Generate Button */}
      <Button
        variant="outline"
        className="w-full bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30"
        size="lg"
        onClick={onGenerate}
        disabled={!prompt.trim() || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" strokeWidth={1.5} />
            <span>Generating recipe...</span>
            <span className="sr-only">Generating recipe, please wait</span>
          </>
        ) : (
          <>
            <Sparkles className="size-4 mr-2" strokeWidth={1.5} />
            Generate Recipe
          </>
        )}
      </Button>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive">
          <Card className="border-destructive">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generated Recipe Preview */}
      {generatedRecipe && !isGenerating && (
        <div className="space-y-4">
          <Separator />

          <Card className="border-primary/30 bg-primary-surface">
            <CardContent className="space-y-4 pt-4">
              {/* Recipe Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ChefHat className="size-5 text-primary" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold text-foreground">
                    {generatedRecipe.recipe_name}
                  </h3>
                </div>
                {generatedRecipe.description && (
                  <p className="text-sm text-muted-foreground">
                    {generatedRecipe.description}
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3">
                {generatedRecipe.total_time && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="size-3" strokeWidth={1.5} />
                    {generatedRecipe.total_time} min
                  </Badge>
                )}
                {generatedRecipe.servings && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="size-3" strokeWidth={1.5} />
                    {generatedRecipe.servings} servings
                  </Badge>
                )}
                {generatedRecipe.difficulty && (
                  <Badge variant="secondary">
                    {generatedRecipe.difficulty}
                  </Badge>
                )}
                {generatedRecipe.ingredients.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <ListChecks className="size-3" strokeWidth={1.5} />
                    {generatedRecipe.ingredients.length} ingredients
                  </Badge>
                )}
                {generatedRecipe.directions && (
                  <Badge variant="outline" className="gap-1">
                    <Utensils className="size-3" strokeWidth={1.5} />
                    {generatedRecipe.directions.split("\n").filter(Boolean).length} steps
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Accept Button */}
              <Button className="w-full" onClick={onAcceptRecipe}>
                <Sparkles className="size-4 mr-2" strokeWidth={1.5} />
                View Recipe
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}