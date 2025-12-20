"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recipeApi, ingredientApi, uploadApi } from "@/lib/api";
import { base64ToFile } from "@/lib/utils";
import type { RecipeCreateDTO, RecipeIngredientDTO } from "@/types";
import type { Ingredient } from "./IngredientRow";
import type { Ingredient as AutocompleteIngredient } from "./IngredientAutoComplete";
import {
  validateString,
  validateInteger,
} from "@/lib/formValidation";
import { v4 as uuidv4 } from 'uuid';

export interface RecipeFormValues {
  recipeName: string;
  totalTime: string;
  servings: string;
  mealType: string;
  category: string;
  dietaryPreference: string;
  ingredients: Ingredient[];
  directions: string;
  notes: string;
  imagePreview: string | null;
}

export interface RecipeFormState {
  // Form values
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
  ingredients: Ingredient[];
  directions: string;
  setDirections: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  imagePreview: string | null;

  // AI Image generation state
  isAiGenerated: boolean;
  setIsAiGenerated: (value: boolean) => void;
  generatedImageData: string | null; // Base64 image data

  // Available ingredients for autocomplete
  availableIngredients: AutocompleteIngredient[];

  // Ingredient handlers
  addIngredient: () => void;
  updateIngredient: (id: string, field: keyof Ingredient, value: string | number | null) => void;
  deleteIngredient: (id: string) => void;

  // Image handlers
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGeneratedImageAccept: (base64Data: string, dataUrl: string) => void;

  // Form submission
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;

  // Validation
  errors: Record<string, string>;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
  hasAttemptedSubmit: boolean;
}

export function useRecipeForm(): RecipeFormState {
  const router = useRouter();

  // Generate a stable ID for the initial ingredient (prevents hydration mismatch)
  const initialIngredientId = useId();

  // Recipe basic info state
  const [recipeName, setRecipeName] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [servings, setServings] = useState("");
  const [mealType, setMealType] = useState("");
  const [category, setCategory] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("");

  // Ingredients state - use stable ID for initial ingredient
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => [
    {
      id: initialIngredientId,
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
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(null);

  // Available ingredients for autocomplete
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);

  // Fetch available ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const ingredients = await ingredientApi.list();
        // Transform to autocomplete format
        const transformed: AutocompleteIngredient[] = ingredients.map((ing) => ({
          id: ing.id,
          name: ing.ingredient_name,
          category: ing.ingredient_category,
        }));
        setAvailableIngredients(transformed);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
        // Silently fail - autocomplete will just be empty
      }
    };
    fetchIngredients();
  }, []);

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients((prevIngredients) => [
      ...prevIngredients,
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
    setIngredients((prevIngredients) =>
      prevIngredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prevIngredients) => {
      if (prevIngredients.length > 1) {
        return prevIngredients.filter((ing) => ing.id !== id);
      }
      return prevIngredients;
    });
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Clear AI-generated state when user uploads a new image
        setIsAiGenerated(false);
        setGeneratedImageData(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI-generated image accept handler
  // Convert base64 to File immediately (matches Edit Recipe pattern)
  const handleGeneratedImageAccept = (base64Data: string, dataUrl: string) => {
    setImagePreview(dataUrl);
    setGeneratedImageData(base64Data);
    setIsAiGenerated(true);
    // Convert to File immediately so it's ready for upload
    const file = base64ToFile(base64Data, `recipe-ai-generated.png`);
    setImageFile(file);
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

      // Upload image if one exists (AI-generated or user-uploaded)
      if (imageFile) {
        try {
          const uploadResult = await uploadApi.uploadRecipeImage(imageFile, createdRecipe.id);
          // Update recipe with the image path
          await recipeApi.update(createdRecipe.id, {
            reference_image_path: uploadResult.path,
          });
        } catch (uploadError) {
          console.error("Failed to upload image:", uploadError);
          toast.warning("Recipe created, but image upload failed. You can add it later by editing the recipe.");
        }
      }

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

  return {
    // Form values
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
    ingredients,
    directions,
    setDirections,
    notes,
    setNotes,
    imagePreview,

    // AI Image generation state
    isAiGenerated,
    setIsAiGenerated,
    generatedImageData,

    // Available ingredients for autocomplete
    availableIngredients,

    // Ingredient handlers
    addIngredient,
    updateIngredient,
    deleteIngredient,

    // Image handlers
    handleImageUpload,
    handleGeneratedImageAccept,

    // Form submission
    handleSubmit,
    isSubmitting,

    // Validation
    errors,
    hasError,
    getError,
    hasAttemptedSubmit,
  };
}