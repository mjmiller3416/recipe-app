"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, ImageIcon, Info, Clock, Users, Tag, ChefHat, Leaf, ListOrdered, FileText, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { recipeApi } from "@/lib/api";
import type { RecipeCreateDTO, RecipeIngredientDTO } from "@/types";
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
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import {
  IngredientRow,
  Ingredient,
} from "@/components/forms/IngredientRow";
import {
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  DIETARY_PREFERENCES,
} from "@/lib/constants";
import {
  validateString,
  validateInteger,
} from "@/lib/formValidation";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

export default function AddRecipePage() {
  const router = useRouter();

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
      id: uuidv4(),
      quantity: null,
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

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        id: uuidv4(),
        quantity: null,
        unit: "",
        name: "",
        category: "",
      },
    ]);
  };

  const updateIngredient = (
    id: string,
    field: keyof Ingredient,
    value: string | number | null
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

  // Validate entire form and return normalized values
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Recipe name (required)
    const nameResult = validateString(recipeName, {
      required: true,
      min: 1,
      max: 255,
      label: "Recipe name",
    });
    if (!nameResult.isValid && nameResult.error) {
      newErrors.recipeName = nameResult.error;
    }

    // Category (required)
    const categoryResult = validateString(category, {
      required: true,
      label: "Category",
    });
    if (!categoryResult.isValid && categoryResult.error) {
      newErrors.category = categoryResult.error;
    }

    // Meal type (required)
    const mealTypeResult = validateString(mealType, {
      required: true,
      label: "Meal type",
    });
    if (!mealTypeResult.isValid && mealTypeResult.error) {
      newErrors.mealType = mealTypeResult.error;
    }

    // Servings (optional, but must be >= 1 if provided)
    const servingsResult = validateInteger(servings, {
      min: 1,
      label: "Servings",
    });
    if (!servingsResult.isValid && servingsResult.error) {
      newErrors.servings = servingsResult.error;
    }

    // Total time (optional, but must be >= 0 if provided)
    const totalTimeResult = validateInteger(totalTime, {
      min: 0,
      label: "Total time",
    });
    if (!totalTimeResult.isValid && totalTimeResult.error) {
      newErrors.totalTime = totalTimeResult.error;
    }

    // Validate ingredients - at least one with a name
    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== "");
    if (validIngredients.length === 0) {
      newErrors.ingredients = "At least one ingredient is required";
    }

    // TODO: Re-enable ingredient field validation (name length, quantity bounds)
    // Disabled for now - validation was too strict during recipe entry
    // See frontend/TODO.md for details

    // Directions (required)
    const directionsResult = validateString(directions, {
      required: true,
      min: 1,
      label: "Directions",
    });
    if (!directionsResult.isValid && directionsResult.error) {
      newErrors.directions = directionsResult.error;
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
      values: {
        recipeName: nameResult.value,
        category: categoryResult.value,
        mealType: mealTypeResult.value,
        dietaryPreference: dietaryPreference || null,
        servings: servingsResult.value,
        totalTime: totalTimeResult.value,
        directions: directionsResult.value,
        notes: notes.trim() || null,
        ingredients: validIngredients,
        imagePreview,
      },
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    setHasAttemptedSubmit(true);
    const { isValid, errors: validationErrors, values } = validateForm();
    setErrors(validationErrors);

    if (!isValid) {
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
      errorElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform ingredients to API format
      const apiIngredients: RecipeIngredientDTO[] = values.ingredients.map((ing) => ({
        ingredient_name: ing.name,
        ingredient_category: ing.category || "Other",
        quantity: ing.quantity,
        unit: ing.unit || null,
      }));

      // Build the recipe create payload
      const payload: RecipeCreateDTO = {
        recipe_name: values.recipeName as string,
        recipe_category: values.category as string,
        meal_type: values.mealType as string,
        diet_pref: values.dietaryPreference,
        total_time: values.totalTime as number | null,
        servings: values.servings as number | null,
        directions: values.directions as string,
        notes: values.notes,
        ingredients: apiIngredients,
      };

      const createdRecipe = await recipeApi.create(payload);
      toast.success("Recipe created successfully!");
      router.push(`/recipes/${createdRecipe.id}`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error("Failed to save recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if a field has an error
  const hasError = (field: string) => hasAttemptedSubmit && !!errors[field];
  const getError = (field: string) => (hasAttemptedSubmit ? errors[field] : undefined);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle 
            title="Add New Recipe"
            description="Create a new recipe for your collection"
          />
          <PageHeaderActions>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Recipe"}
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
                  <div data-field="recipeName">
                    <Label htmlFor="recipe-name" className="flex items-center gap-2">
                      <ChefHat className="h-3.5 w-3.5 text-muted" />
                      Recipe Name
                    </Label>
                    <Input
                      id="recipe-name"
                      placeholder="Enter recipe name"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      className={cn("mt-1.5", hasError("recipeName") && "border-destructive")}
                    />
                    {getError("recipeName") && (
                      <p className="text-sm text-destructive mt-1">{getError("recipeName")}</p>
                    )}
                  </div>

                  {/* Time and Servings Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div data-field="totalTime">
                      <Label htmlFor="total-time" className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted" />
                        Total Time (mins)
                      </Label>
                      <Input
                        id="total-time"
                        placeholder="e.g., 30"
                        value={totalTime}
                        onChange={(e) => setTotalTime(e.target.value)}
                        className={cn("mt-1.5", hasError("totalTime") && "border-destructive")}
                      />
                      {getError("totalTime") && (
                        <p className="text-sm text-destructive mt-1">{getError("totalTime")}</p>
                      )}
                    </div>
                    <div data-field="servings">
                      <Label htmlFor="servings" className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted" />
                        Servings
                      </Label>
                      <Input
                        id="servings"
                        placeholder="e.g., 4"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        className={cn("mt-1.5", hasError("servings") && "border-destructive")}
                      />
                      {getError("servings") && (
                        <p className="text-sm text-destructive mt-1">{getError("servings")}</p>
                      )}
                    </div>
                  </div>

                  {/* Classification Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div data-field="mealType">
                      <Label htmlFor="meal-type" className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted" />
                        Meal Type
                      </Label>
                      <Select value={mealType} onValueChange={setMealType}>
                        <SelectTrigger
                          id="meal-type"
                          className={cn("mt-1.5", hasError("mealType") && "border-destructive")}
                        >
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
                      {getError("mealType") && (
                        <p className="text-sm text-destructive mt-1">{getError("mealType")}</p>
                      )}
                    </div>
                    <div data-field="category">
                      <Label htmlFor="category" className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted" />
                        Category
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger
                          id="category"
                          className={cn("mt-1.5", hasError("category") && "border-destructive")}
                        >
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
                      {getError("category") && (
                        <p className="text-sm text-destructive mt-1">{getError("category")}</p>
                      )}
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
            <Card data-field="ingredients">
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

                {getError("ingredients") && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{getError("ingredients")}</p>
                  </div>
                )}

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
                  variant="secondary"
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
            <Card data-field="directions">
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
                      placeholder="Enter cooking directions step by step...&#10;&#10;1. Preheat oven to 350°F&#10;2. Mix dry ingredients in a bowl&#10;3. ..."
                      value={directions}
                      onChange={(e) => setDirections(e.target.value)}
                      rows={10}
                      className={cn(
                        "font-mono text-sm resize-none",
                        hasError("directions") && "border-destructive"
                      )}
                    />
                    {getError("directions") && (
                      <p className="text-sm text-destructive mt-1">{getError("directions")}</p>
                    )}
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    <Textarea
                      placeholder="Add any helpful notes, tips, or variations..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={10}
                      className="resize-none"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Image Upload */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
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
                <div className="aspect-square rounded-lg overflow-hidden bg-elevated border-2 border-dashed border-border mb-4">
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
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={() =>
                        document.getElementById("recipe-image")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}