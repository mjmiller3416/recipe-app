"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { RecipeGenerationPreferencesDTO } from "@/types/ai";
import type { UserCategoryDTO } from "@/types/category";

// ============================================================================
// Props
// ============================================================================

interface AIGenerateStepProps {
  prompt: string;
  setPrompt: (value: string) => void;
  preferences: RecipeGenerationPreferencesDTO;
  setPreferences: (value: RecipeGenerationPreferencesDTO) => void;
  isGenerating: boolean;
  error: string | null;
  categories?: UserCategoryDTO[];
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
  isGenerating,
  error,
  categories = [],
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
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto px-2.5 py-0.5 text-xs font-medium rounded-full"
              onClick={() => setPrompt(suggestion)}
              disabled={isGenerating}
            >
              {suggestion}
            </Button>
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
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="pref-category">Category</Label>
                <Select
                  value={preferences.category || ""}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, category: value || undefined })
                  }
                  disabled={isGenerating}
                >
                  <SelectTrigger id="pref-category">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Difficulty</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={preferences.difficulty || ""}
                  onValueChange={(val) =>
                    setPreferences({ ...preferences, difficulty: val || undefined })
                  }
                  disabled={isGenerating}
                  aria-label="Recipe difficulty preference"
                  className="w-full"
                >
                  <ToggleGroupItem value="Easy" className="flex-1">Easy</ToggleGroupItem>
                  <ToggleGroupItem value="Medium" className="flex-1">Med</ToggleGroupItem>
                  <ToggleGroupItem value="Hard" className="flex-1">Hard</ToggleGroupItem>
                </ToggleGroup>
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

    </div>
  );
}