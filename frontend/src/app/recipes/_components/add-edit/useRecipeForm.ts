"use client";

import { useState, useEffect, useId, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { recipeApi, ingredientApi, uploadApi } from "@/lib/api";
import { base64ToFile } from "@/lib/utils";
import type { GeneratedRecipeDTO } from "@/types";

// Session storage key for AI-generated recipe (must match MealGenieChatContent)
const AI_RECIPE_STORAGE_KEY = "meal-genie-generated-recipe";
import type { RecipeCreateDTO, RecipeUpdateDTO, RecipeIngredientDTO, RecipeResponseDTO } from "@/types";
import type { Ingredient } from "./IngredientRow";
import type { Ingredient as AutocompleteIngredient } from "./IngredientAutocomplete";
import {
  validateString,
  validateInteger,
} from "@/lib/formValidation";
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';

// ============================================================================
// TYPES
// ============================================================================

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

/**
 * Options for configuring the recipe form hook behavior.
 * Supports both 'create' mode (new recipes) and 'edit' mode (existing recipes).
 */
export interface UseRecipeFormOptions {
  /** Form mode - 'create' for new recipes, 'edit' for existing */
  mode?: 'create' | 'edit';
  /** Recipe ID (required for edit mode) */
  recipeId?: number;
  /** Initial recipe data to populate the form (for edit mode) */
  initialData?: RecipeResponseDTO | null;
  /** Callback fired when form dirty state changes (for unsaved changes tracking) */
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface RecipeFormState {
  // Mode info
  mode: 'create' | 'edit';
  isLoading: boolean;

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
  reorderIngredients: (activeId: string, overId: string) => void;

  // Image handlers
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGeneratedImageAccept: (
    referenceBase64: string,
    referenceDataUrl: string,
    bannerBase64?: string
  ) => void;

  // Form submission
  handleSubmit: () => Promise<void>;
  isSubmitting: boolean;

  // Validation
  errors: Record<string, string>;
  hasError: (field: string) => boolean;
  getError: (field: string) => string | undefined;
  hasAttemptedSubmit: boolean;

  // Dirty tracking (for edit mode)
  isDirty: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRecipeForm(options: UseRecipeFormOptions = {}): RecipeFormState {
  const {
    mode = 'create',
    recipeId,
    initialData,
    onDirtyChange,
  } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Generate a stable ID for the initial ingredient (prevents hydration mismatch)
  const initialIngredientId = useId();

  // Loading state (for edit mode - waiting for initial data)
  const [isLoading, setIsLoading] = useState(mode === 'edit' && !initialData);

  // Track if form has been initialized with data (for edit mode)
  const [isInitialized, setIsInitialized] = useState(mode === 'create');

  // Dirty tracking for unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  // Recipe basic info state
  const [recipeName, setRecipeNameState] = useState("");
  const [totalTime, setTotalTimeState] = useState("");
  const [servings, setServingsState] = useState("");
  const [mealType, setMealTypeState] = useState("");
  const [category, setCategoryState] = useState("");
  const [dietaryPreference, setDietaryPreferenceState] = useState("");

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
  const [directions, setDirectionsState] = useState("");
  const [notes, setNotesState] = useState("");

  // Image state (reference image - 1:1 square)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Track original image path (for edit mode - to know if image changed)
  const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);

  // Banner image state (21:9 ultrawide)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImageData, setBannerImageData] = useState<string | null>(null);

  // AI Image generation state
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(null);

  // Available ingredients for autocomplete
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Helper to mark form as dirty (only after initialization)
  const markDirty = useCallback(() => {
    if (isInitialized && !isDirty) {
      setIsDirty(true);
      onDirtyChange?.(true);
    }
  }, [isInitialized, isDirty, onDirtyChange]);

  // Wrapped setters that track dirty state
  const setRecipeName = useCallback((value: string) => {
    markDirty();
    setRecipeNameState(value);
  }, [markDirty]);

  const setTotalTime = useCallback((value: string) => {
    markDirty();
    setTotalTimeState(value);
  }, [markDirty]);

  const setServings = useCallback((value: string) => {
    markDirty();
    setServingsState(value);
  }, [markDirty]);

  const setMealType = useCallback((value: string) => {
    markDirty();
    setMealTypeState(value);
  }, [markDirty]);

  const setCategory = useCallback((value: string) => {
    markDirty();
    setCategoryState(value);
  }, [markDirty]);

  const setDietaryPreference = useCallback((value: string) => {
    markDirty();
    setDietaryPreferenceState(value);
  }, [markDirty]);

  const setDirections = useCallback((value: string) => {
    markDirty();
    setDirectionsState(value);
  }, [markDirty]);

  const setNotes = useCallback((value: string) => {
    markDirty();
    setNotesState(value);
  }, [markDirty]);

  // Initialize form with data when in edit mode and initialData is provided
  useEffect(() => {
    if (mode === 'edit' && initialData && !isInitialized) {
      setRecipeNameState(initialData.recipe_name);
      setTotalTimeState(initialData.total_time?.toString() || "");
      setServingsState(initialData.servings?.toString() || "");
      setMealTypeState(initialData.meal_type || "");
      setCategoryState(initialData.recipe_category || "");
      setDietaryPreferenceState(initialData.diet_pref || "");
      setDirectionsState(initialData.directions || "");
      setNotesState(initialData.notes || "");
      setImagePreview(initialData.reference_image_path || null);
      setOriginalImagePath(initialData.reference_image_path || null);

      // Populate ingredients
      if (initialData.ingredients && initialData.ingredients.length > 0) {
        setIngredients(
          initialData.ingredients.map((ing) => ({
            id: uuidv4(),
            quantity: ing.quantity,
            unit: ing.unit || "",
            name: ing.ingredient_name,
            category: ing.ingredient_category || "",
          }))
        );
      }

      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [mode, initialData, isInitialized]);

  // Load AI-generated recipe from sessionStorage (when navigating from Meal Genie)
  useEffect(() => {
    // Only load AI recipe in create mode when from=ai query param is present
    if (mode !== 'create' || searchParams.get('from') !== 'ai') {
      return;
    }

    try {
      const storedData = sessionStorage.getItem(AI_RECIPE_STORAGE_KEY);
      if (!storedData) {
        return;
      }

      const { recipe, referenceImageData, bannerImageData: storedBannerImageData } = JSON.parse(storedData) as {
        recipe: GeneratedRecipeDTO;
        referenceImageData: string | null;
        bannerImageData: string | null;
      };

      // Pre-fill form with AI-generated recipe
      setRecipeNameState(recipe.recipe_name);
      setTotalTimeState(recipe.total_time?.toString() || "");
      setServingsState(recipe.servings?.toString() || "");
      setMealTypeState(recipe.meal_type || "");
      setCategoryState(recipe.recipe_category || "");
      setDietaryPreferenceState(recipe.diet_pref || "");
      setDirectionsState(recipe.directions || "");
      setNotesState(recipe.notes || "");

      // Populate ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        setIngredients(
          recipe.ingredients.map((ing) => ({
            id: uuidv4(),
            quantity: ing.quantity ?? null,
            unit: ing.unit || "",
            name: ing.ingredient_name,
            category: ing.ingredient_category || "",
          }))
        );
      }

      // Handle AI-generated reference image (1:1 square)
      if (referenceImageData) {
        // Convert base64 to data URL for preview
        const dataUrl = `data:image/png;base64,${referenceImageData}`;
        setImagePreview(dataUrl);
        setGeneratedImageData(referenceImageData);
        setIsAiGenerated(true);
        // Convert to File for upload
        const file = base64ToFile(referenceImageData, `recipe-ai-reference.png`);
        setImageFile(file);
      }

      // Handle AI-generated banner image (21:9 ultrawide)
      if (storedBannerImageData) {
        setBannerImageData(storedBannerImageData);
        // Convert to File for upload
        const bannerFile = base64ToFile(storedBannerImageData, `recipe-ai-banner.png`);
        setBannerImageFile(bannerFile);
      }

      // Clear sessionStorage after loading
      sessionStorage.removeItem(AI_RECIPE_STORAGE_KEY);

      // Show a toast to confirm the recipe was loaded
      toast.success("AI recipe loaded! Review and save when ready.");
    } catch (error) {
      console.error("Failed to load AI recipe from storage:", error);
    }
  }, [mode, searchParams]);

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

  // Ingredient handlers
  const addIngredient = useCallback(() => {
    markDirty();
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
  }, [markDirty]);

  const updateIngredient = useCallback((
    id: string,
    field: keyof Ingredient,
    value: string | number | null
  ) => {
    markDirty();
    setIngredients((prevIngredients) =>
      prevIngredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      )
    );
  }, [markDirty]);

  const deleteIngredient = useCallback((id: string) => {
    markDirty();
    setIngredients((prevIngredients) => {
      if (prevIngredients.length > 1) {
        return prevIngredients.filter((ing) => ing.id !== id);
      }
      return prevIngredients;
    });
  }, [markDirty]);

  const reorderIngredients = useCallback((activeId: string, overId: string) => {
    markDirty();
    setIngredients((prev) => {
      const oldIndex = prev.findIndex((ing) => ing.id === activeId);
      const newIndex = prev.findIndex((ing) => ing.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, [markDirty]);

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      markDirty();
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
  }, [markDirty]);

  // AI-generated image accept handler
  // Convert base64 to File immediately so it's ready for upload
  const handleGeneratedImageAccept = useCallback(
    (referenceBase64: string, referenceDataUrl: string, bannerBase64?: string) => {
      markDirty();
      // Handle reference image (1:1 square)
      setImagePreview(referenceDataUrl);
      setGeneratedImageData(referenceBase64);
      setIsAiGenerated(true);
      const refFile = base64ToFile(referenceBase64, `recipe-ai-reference.png`);
      setImageFile(refFile);

      // Handle banner image (21:9 ultrawide) if provided
      if (bannerBase64) {
        setBannerImageData(bannerBase64);
        const bannerFile = base64ToFile(bannerBase64, `recipe-ai-banner.png`);
        setBannerImageFile(bannerFile);
      }
    },
    [markDirty]
  );

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

  // Handle form submission (works for both create and edit modes)
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

      if (mode === 'create') {
        // ===== CREATE MODE =====
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

        // Upload images if they exist (AI-generated or user-uploaded)
        let referenceImagePath: string | undefined;
        let bannerImagePath: string | undefined;

        // Upload reference image (1:1 square)
        if (imageFile) {
          try {
            const uploadResult = await uploadApi.uploadRecipeImage(imageFile, createdRecipe.id);
            referenceImagePath = uploadResult.path;
          } catch (uploadError) {
            console.error("Failed to upload reference image:", uploadError);
          }
        }

        // Upload banner image (21:9 ultrawide)
        if (bannerImageFile) {
          try {
            const bannerUploadResult = await uploadApi.uploadRecipeImage(
              bannerImageFile,
              createdRecipe.id,
              "banner"
            );
            bannerImagePath = bannerUploadResult.path;
          } catch (uploadError) {
            console.error("Failed to upload banner image:", uploadError);
          }
        }

        // Update recipe with image paths if any were uploaded
        if (referenceImagePath || bannerImagePath) {
          await recipeApi.update(createdRecipe.id, {
            ...(referenceImagePath && { reference_image_path: referenceImagePath }),
            ...(bannerImagePath && { banner_image_path: bannerImagePath }),
          });
        }

        // Warn if some images failed to upload
        if ((imageFile && !referenceImagePath) || (bannerImageFile && !bannerImagePath)) {
          toast.warning("Recipe created, but some images failed to upload. You can add them later by editing the recipe.");
        }

        toast.success("Recipe created successfully!");
        router.push(`/recipes/${createdRecipe.id}`);
      } else {
        // ===== EDIT MODE =====
        if (!recipeId) {
          throw new Error("Recipe ID is required for edit mode");
        }

        // Upload new reference image if one was selected
        let imagePath = originalImagePath;
        if (imageFile) {
          try {
            const uploadResult = await uploadApi.uploadRecipeImage(imageFile, recipeId);
            imagePath = uploadResult.path;
          } catch (uploadError) {
            console.error("Failed to upload reference image:", uploadError);
            toast.error("Failed to upload image. Recipe will be saved without the new image.");
          }
        }

        // Upload new banner image if one was generated
        let bannerPath: string | undefined;
        if (bannerImageFile) {
          try {
            const bannerUploadResult = await uploadApi.uploadRecipeImage(
              bannerImageFile,
              recipeId,
              "banner"
            );
            bannerPath = bannerUploadResult.path;
          } catch (uploadError) {
            console.error("Failed to upload banner image:", uploadError);
          }
        }

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
          ...(bannerPath && { banner_image_path: bannerPath }),
          ingredients: apiIngredients,
        };

        await recipeApi.update(recipeId, payload);

        // Reset dirty state after successful save
        setIsDirty(false);
        onDirtyChange?.(false);

        toast.success("Recipe updated successfully!");
        router.push(`/recipes/${recipeId}`);
      }
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} recipe. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if a field has an error
  const hasError = (field: string) => hasAttemptedSubmit && !!errors[field];
  const getError = (field: string) => (hasAttemptedSubmit ? errors[field] : undefined);

  return {
    // Mode info
    mode,
    isLoading,

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
    reorderIngredients,

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

    // Dirty tracking
    isDirty,
  };
}
