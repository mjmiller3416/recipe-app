"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Upload, ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  IngredientRow,
  Ingredient,
} from "@/components/IngredientRow";
import {
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  DIETARY_PREFERENCES,
} from "@/lib/constants";

export default function AddRecipePage() {
  // Recipe basic info state
  const [recipeName, setRecipeName] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [servings, setServings] = useState("");
  const [mealType, setMealType] = useState("");
  const [category, setCategory] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");

  // Ingredients state
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      id: crypto.randomUUID(),
      quantity: "",
      unit: "",
      name: "",
      category: "",
    },
  ]);

  // Directions and notes state
  const [directions, setDirections] = useState("");
  const [notes, setNotes] = useState("");

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: crypto.randomUUID(),
        quantity: "",
        unit: "",
        name: "",
        category: "",
      },
    ]);
  };

  const updateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const deleteIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  // Image upload handler (mock)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/recipes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-foreground">
                Add New Recipe
              </h1>
              <p className="text-sm text-muted mt-0.5">
                Create a new recipe for your collection
              </p>
            </div>
            <Button className="gap-2">
              Save Recipe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Info Section */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Recipe Information
                </h2>
                <div className="space-y-4">
                  {/* Recipe Name */}
                  <div>
                    <Label htmlFor="recipe-name">Recipe Name</Label>
                    <Input
                      id="recipe-name"
                      type="text"
                      placeholder="Enter recipe name"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Time and Servings Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="total-time">Total Time</Label>
                      <Input
                        id="total-time"
                        type="text"
                        placeholder="e.g., 30 mins"
                        value={totalTime}
                        onChange={(e) => setTotalTime(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        type="text"
                        placeholder="e.g., 4"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Meal Type and Category Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meal-type">Meal Type</Label>
                      <Select value={mealType} onValueChange={setMealType}>
                        <SelectTrigger id="meal-type" className="mt-1.5">
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEAL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className="mt-1.5">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {RECIPE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dietary Preference */}
                  <div>
                    <Label htmlFor="dietary-preference">
                      Dietary Preference
                    </Label>
                    <Select
                      value={dietaryPreference}
                      onValueChange={setDietaryPreference}
                    >
                      <SelectTrigger id="dietary-preference" className="mt-1.5">
                        <SelectValue placeholder="Select dietary preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIETARY_PREFERENCES.map((pref) => (
                          <SelectItem key={pref.value} value={pref.value}>
                            {pref.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Ingredients
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Ingredient
                  </Button>
                </div>

                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      onUpdate={updateIngredient}
                      onDelete={deleteIngredient}
                      showLabels={index === 0}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Directions & Notes Section */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Directions & Notes
                </h2>
                <Tabs defaultValue="directions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="directions">Directions</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="directions" className="mt-4">
                    <Textarea
                      placeholder="Enter cooking directions step by step..."
                      value={directions}
                      onChange={(e) => setDirections(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <Textarea
                      placeholder="Add any additional notes, tips, or variations..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Image Upload */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Recipe Image
                </h2>

                {/* Image Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed border-border mb-4">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted">
                      <ImageIcon className="h-16 w-16 mb-3" />
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    id="recipe-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label htmlFor="recipe-image">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() =>
                        document.getElementById("recipe-image")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                  </Label>
                  <p className="text-xs text-muted mt-2 text-center">
                    Recommended: 1:1 aspect ratio, max 5MB
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Quick Tips */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Quick Tips
                  </h3>
                  <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
                    <li>Fill out all required fields before saving</li>
                    <li>Add ingredients in the order they're used</li>
                    <li>Be specific with measurements</li>
                    <li>Include prep time in total time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
