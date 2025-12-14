"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Upload, ImageIcon, Info, Clock, Users, Tag, ChefHat, Leaf, ListOrdered, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/public/components/ui/button";
import { Input } from "@/src/public/components/ui/input";
import { Label } from "@/src/public/components/ui/label";
import { Textarea } from "@/src/public/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/public/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/public/components/ui/tabs";
import { Card, CardContent } from "@/src/public/components/ui/card";
import { Separator } from "@/src/public/components/ui/separator";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/src/public/components/PageHeader";
import {
  IngredientRow,
  Ingredient,
} from "@/src/public/components/IngredientRow";
import {
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  DIETARY_PREFERENCES,
} from "@/src/lib/constants";

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
      <PageHeader>
        <PageHeaderContent>
          <Link href="/recipes">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <PageHeaderTitle 
            title="Add New Recipe"
            description="Create a new recipe for your collection"
          />
          <PageHeaderActions>
            <Button className="gap-2">
              Save Recipe
            </Button>
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Info Section */}
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
                    <p className="text-sm text-muted mt-0.5">
                      Basic details about your recipe including name, timing, and classification
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Recipe Name */}
                  <div>
                    <Label htmlFor="recipe-name" className="flex items-center gap-2">
                      <ChefHat className="h-3.5 w-3.5 text-muted" />
                      Recipe Name
                    </Label>
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
                      <Label htmlFor="total-time" className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        Total Time
                      </Label>
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
                      <Label htmlFor="servings" className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted" />
                        Servings
                      </Label>
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

                  {/* Meal Type, Category, and Dietary Preference Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="meal-type" className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted" />
                        Meal Type
                      </Label>
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
                      <Label htmlFor="category" className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted" />
                        Category
                      </Label>
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
                    <div>
                      <Label htmlFor="dietary-preference" className="flex items-center gap-2">
                        <Leaf className="h-3.5 w-3.5 text-muted" />
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
                </div>
              </CardContent>
            </Card>

            {/* Ingredients Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Ingredients
                    </h2>
                    <p className="text-sm text-muted mt-0.5">
                      List all ingredients needed for this recipe
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {ingredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      onUpdate={updateIngredient}
                      onDelete={deleteIngredient}
                    />
                  ))}
                </div>

                {/* Add Ingredient Button at Bottom */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Ingredient
                </Button>
              </CardContent>
            </Card>

            {/* Directions & Notes Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ListOrdered className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Directions & Notes
                    </h2>
                    <p className="text-sm text-muted mt-0.5">
                      Step-by-step cooking instructions and additional tips
                    </p>
                  </div>
                </div>
                <Tabs defaultValue="directions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="directions" className="gap-2">
                      <ListOrdered className="h-4 w-4" />
                      Directions
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="directions" className="mt-4">
                    <Textarea
                      placeholder="Enter cooking directions step by step...&#10;&#10;1. Preheat oven to 350°F&#10;2. Mix dry ingredients in a bowl&#10;3. Add wet ingredients and stir until combined"
                      value={directions}
                      onChange={(e) => setDirections(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <Textarea
                      placeholder="Add any additional notes, tips, or variations...&#10;&#10;• Can substitute almond milk for regular milk&#10;• Best served fresh but can be refrigerated for up to 3 days&#10;• Try adding chocolate chips for extra sweetness"
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Recipe Image
                    </h2>
                    <p className="text-sm text-muted mt-0.5">
                      Upload an appetizing photo of your dish
                    </p>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-elevated border-2 border-dashed border-border mb-4 transition-colors hover:border-primary/50">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Recipe preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted">
                      <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <ImageIcon className="h-12 w-12 text-primary" />
                      </div>
                      <p className="text-sm font-medium">No image uploaded</p>
                      <p className="text-xs mt-1">Click below to add one</p>
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
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Info className="h-4 w-4 text-primary" />
                    Quick Tips
                  </h3>
                  <ul className="text-xs text-muted space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Fill out all required fields before saving</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Add ingredients in the order they're used</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Be specific with measurements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Include prep time in total time</span>
                    </li>
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