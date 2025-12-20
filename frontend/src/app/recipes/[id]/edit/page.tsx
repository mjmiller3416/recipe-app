"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Info, Clock, Users, Tag, ChefHat, Leaf, ListOrdered, FileText, Save, AlertCircle, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { recipeApi, uploadApi } from "@/lib/api";
import { base64ToFile } from "@/lib/utils";
import type { RecipeUpdateDTO, RecipeIngredientDTO, RecipeResponseDTO } from "@/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import {
  IngredientRow,
  Ingredient,
  ImageUploadCard,
} from "@/components/add-recipe";
import {
  MEAL_TYPE_OPTIONS,
  RECIPE_CATEGORY_OPTIONS,
  DIETARY_PREFERENCES,
} from "@/lib/constants";
import {
  validateString,
  validateInteger,
} from "@/lib/formValidation";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EditRecipeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-8 w-48 bg-hover rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="h-10 bg-hover rounded animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                    <div className="h-10 bg-hover rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = Number(params.id);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [originalRecipe, setOriginalRecipe] = useState<RecipeResponseDTO | null>(null);

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
  const [imageFile, setImageFile] = useState<File | null>(null);

  // AI Image generation state
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Unsaved changes tracking
  const [isDirty, setIsDirty] = useState(false);

  // Use the unsaved changes hook for navigation guards
  const {
    showLeaveDialog,
    setShowLeaveDialog,
    handleNavigation,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty,
    onConfirmLeave: () => setIsDirty(false),
  });

  // Load recipe data
  useEffect(() => {
    async function fetchRecipe() {
      try {
        const recipe = await recipeApi.get(recipeId);
        setOriginalRecipe(recipe);

        // Populate form fields
        setRecipeName(recipe.recipe_name);
        setTotalTime(recipe.total_time?.toString() || "");
        setServings(recipe.servings?.toString() || "");
        setMealType(recipe.meal_type || "");
        setCategory(recipe.recipe_category || "");
        setDietaryPreference(recipe.diet_pref || "");
        setDirections(recipe.directions || "");
        setNotes(recipe.notes || "");
        setImagePreview(recipe.reference_image_path);

        // Populate ingredients
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          setIngredients(
            recipe.ingredients.map((ing) => ({
              id: uuidv4(),
              quantity: ing.quantity,
              unit: ing.unit || "",
              name: ing.ingredient_name,
              category: ing.ingredient_category || "",
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch recipe:", error);
        toast.error("Failed to load recipe");
        router.push("/recipes");
      } finally {
        setLoading(false);
      }
    }

    fetchRecipe();
  }, [recipeId, router]);

  // Mark form as dirty when values change
  const markDirty = useCallback(() => {
    if (!loading) {
      setIsDirty(true);
    }
  }, [loading]);

  // Ingredient handlers
  const addIngredient = () => {
    markDirty();
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
    markDirty();
    setIngredients(
      ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const deleteIngredient = (id: string) => {
    if (ingredients.length > 1) {
      markDirty();
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      markDirty();
      setImageFile(file);
      setIsAiGenerated(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI-generated image accept handler
  const handleGeneratedImageAccept = (base64Data: string, dataUrl: string) => {
    markDirty();
    setImagePreview(dataUrl);
    // Convert base64 to File for Cloudinary upload
    const file = base64ToFile(base64Data, `recipe-${recipeId}-ai.png`);
    setImageFile(file);
    setIsAiGenerated(true);
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
      // Upload image if a new file was selected
      let imagePath = originalRecipe?.reference_image_path || null;
      if (imageFile) {
        try {
          const uploadResult = await uploadApi.uploadRecipeImage(imageFile, recipeId);
          imagePath = uploadResult.path;
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          toast.error("Failed to upload image. Recipe will be saved without the new image.");
        }
      }

      // Transform ingredients to API format
      const apiIngredients: RecipeIngredientDTO[] = values.ingredients.map((ing) => ({
        ingredient_name: ing.name,
        ingredient_category: ing.category || "Other",
        quantity: ing.quantity,
        unit: ing.unit || null,
      }));

      // Build the recipe update payload
      const payload: RecipeUpdateDTO = {
        recipe_name: values.recipeName as string,
        recipe_category: values.category as string,
        meal_type: values.mealType as string,
        diet_pref: values.dietaryPreference,
        total_time: values.totalTime as number | null,
        servings: values.servings as number | null,
        directions: values.directions as string,
        notes: values.notes,
        reference_image_path: imagePath,
        ingredients: apiIngredients,
      };

      await recipeApi.update(recipeId, payload);
      toast.success("Recipe updated successfully!");
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      console.error("Failed to update recipe:", error);
      toast.error("Failed to update recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if a field has an error
  const hasError = (field: string) => hasAttemptedSubmit && !!errors[field];
  const getError = (field: string) => (hasAttemptedSubmit ? errors[field] : undefined);

  // Show loading skeleton
  if (loading) {
    return <EditRecipeSkeleton />;
  }

  // Recipe not found
  if (!originalRecipe) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleNavigation(`/recipes/${recipeId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <PageHeaderTitle
              title="Edit Recipe"
              description={`Editing "${originalRecipe.recipe_name}"`}
            />
          </div>
          <PageHeaderActions>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
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
                      onChange={(e) => { markDirty(); setRecipeName(e.target.value); }}
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
                        onChange={(e) => { markDirty(); setTotalTime(e.target.value); }}
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
                        onChange={(e) => { markDirty(); setServings(e.target.value); }}
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
                      <Select value={mealType} onValueChange={(v) => { markDirty(); setMealType(v); }}>
                        <SelectTrigger
                          id="meal-type"
                          className={cn("mt-1.5", hasError("mealType") && "border-destructive")}
                        >
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                        <SelectContent>
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
                        <Tag className="h-3.5 w-3.5 text-muted" />
                        Category
                      </Label>
                      <Select value={category} onValueChange={(v) => { markDirty(); setCategory(v); }}>
                        <SelectTrigger
                          id="category"
                          className={cn("mt-1.5", hasError("category") && "border-destructive")}
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
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
                        <Leaf className="h-3.5 w-3.5 text-muted" />
                        Dietary Preference
                      </Label>
                      <Select
                        value={dietaryPreference}
                        onValueChange={(v) => { markDirty(); setDietaryPreference(v); }}
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
                      onChange={(e) => { markDirty(); setDirections(e.target.value); }}
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
                      onChange={(e) => { markDirty(); setNotes(e.target.value); }}
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
            <ImageUploadCard
              imagePreview={imagePreview}
              onImageUpload={handleImageUpload}
              onGeneratedImageAccept={handleGeneratedImageAccept}
              recipeName={recipeName}
              isAiGenerated={isAiGenerated}
              onAiGeneratedChange={setIsAiGenerated}
            />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-secondary hover:bg-secondary/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
