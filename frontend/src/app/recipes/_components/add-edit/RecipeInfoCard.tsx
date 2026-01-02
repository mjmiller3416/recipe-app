"use client";

import { Info, Clock, Users, Tag, ChefHat, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEAL_TYPE_OPTIONS,
  RECIPE_CATEGORY_OPTIONS,
  DIETARY_PREFERENCES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RecipeInfoCardProps {
  recipeName: string;
  setRecipeName: (value: string) => void;
  totalTime: string;
  setTotalTime: (value: string) => void;
  servings: string;
  setServings: (value: string) => void;
  mealType: string;
  setMealType: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  dietaryPreference: string;
  setDietaryPreference: (value: string) => void;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
  autoFocusName?: boolean;
}

export function RecipeInfoCard({
  recipeName,
  setRecipeName,
  totalTime,
  setTotalTime,
  servings,
  setServings,
  mealType,
  setMealType,
  category,
  setCategory,
  dietaryPreference,
  setDietaryPreference,
  hasError,
  getError,
  autoFocusName = false,
}: RecipeInfoCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Recipe Information
            </h2>
            <p className="text-sm text-muted mt-1">
              Basic details about your recipe including name, timing, and classification
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Recipe Name */}
          <div data-field="recipeName">
            <Label htmlFor="recipe-name" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-muted" />
              Recipe Name
            </Label>
            <Input
              id="recipe-name"
              placeholder="Enter recipe name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={cn("mt-2", hasError("recipeName") && "border-destructive")}
              autoFocus={autoFocusName}
            />
            {getError("recipeName") && (
              <p className="text-sm text-destructive mt-1">{getError("recipeName")}</p>
            )}
          </div>

          {/* Time and Servings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div data-field="totalTime">
              <Label htmlFor="total-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted" />
                Total Time (mins)
              </Label>
              <Input
                id="total-time"
                placeholder="e.g., 30"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                className={cn("mt-2", hasError("totalTime") && "border-destructive")}
              />
              {getError("totalTime") && (
                <p className="text-sm text-destructive mt-1">{getError("totalTime")}</p>
              )}
            </div>
            <div data-field="servings">
              <Label htmlFor="servings" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted" />
                Servings
              </Label>
              <Input
                id="servings"
                placeholder="e.g., 4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className={cn("mt-2", hasError("servings") && "border-destructive")}
              />
              {getError("servings") && (
                <p className="text-sm text-destructive mt-1">{getError("servings")}</p>
              )}
            </div>
          </div>

          {/* Classification Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div data-field="mealType">
              <Label htmlFor="meal-type" className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted" />
                Meal Type
              </Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger
                  id="meal-type"
                  className={cn("mt-2", hasError("mealType") && "border-destructive")}
                >
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {MEAL_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("mealType") && (
                <p className="text-sm text-destructive mt-1">{getError("mealType")}</p>
              )}
            </div>
            <div data-field="category">
              <Label htmlFor="category" className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted" />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className={cn("mt-2", hasError("category") && "border-destructive")}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {RECIPE_CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError("category") && (
                <p className="text-sm text-destructive mt-1">{getError("category")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="dietary-preference" className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-muted" />
                Dietary Preference
              </Label>
              <Select
                value={dietaryPreference}
                onValueChange={setDietaryPreference}
              >
                <SelectTrigger id="dietary-preference" className="mt-2">
                  <SelectValue placeholder="Select dietary preference" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {DIETARY_PREFERENCES.map((pref) => (
                    <SelectItem key={pref.value} value={pref.value}>
                      {pref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
