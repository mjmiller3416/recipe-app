"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { arrayMove } from "@dnd-kit/sortable";

import { recipeApi, ingredientApi, uploadApi } from "@/lib/api";
import { base64ToFile } from "@/lib/utils";
import type {
  RecipeCreateDTO,
  RecipeIngredientDTO,
  WizardCreationMethod,
  WizardStep,
  WizardIngredient,
  WizardDirection,
} from "@/types/recipe";
import type { AutocompleteIngredient } from "@/components/forms/IngredientAutocomplete";
import {
  validateString,
  validateInteger,
  validateIngredientRow,
  type IngredientFieldErrors,
} from "@/lib/formValidation";

// ============================================================================
// CONSTANTS
// ============================================================================

const FIRST_STEP: WizardStep = 1;
const LAST_STEP: WizardStep = 5;

// ============================================================================
// HOOK
// ============================================================================

export function useRecipeWizard() {
  const router = useRouter();
  const { getToken } = useAuth();

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [creationMethod, setCreationMethod] = useState<WizardCreationMethod | null>(null);

  // ---------------------------------------------------------------------------
  // Recipe basics
  // ---------------------------------------------------------------------------
  const [recipeName, setRecipeName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [mealType, setMealType] = useState("Dinner");
  const [category, setCategory] = useState("");
  const [dietaryPreference, setDietaryPreference] = useState("none");

  // ---------------------------------------------------------------------------
  // Ingredients
  // ---------------------------------------------------------------------------
  const [ingredients, setIngredients] = useState<WizardIngredient[]>(() => [
    createEmptyIngredient(),
  ]);

  // ---------------------------------------------------------------------------
  // Directions
  // ---------------------------------------------------------------------------
  const [directions, setDirections] = useState<WizardDirection[]>(() => [
    createEmptyDirection(),
  ]);

  // ---------------------------------------------------------------------------
  // Notes
  // ---------------------------------------------------------------------------
  const [notes, setNotes] = useState("");

  // ---------------------------------------------------------------------------
  // Image state
  // ---------------------------------------------------------------------------
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [generatedRefData, setGeneratedRefData] = useState<string | null>(null);
  const [generatedBannerData, setGeneratedBannerData] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Available ingredients (autocomplete)
  // ---------------------------------------------------------------------------
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ingredientErrors, setIngredientErrors] = useState<Record<string, IngredientFieldErrors>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const hasAttemptedStepRef = useRef<Record<number, boolean>>({});

  // ---------------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch available ingredients on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchIngredients = async (): Promise<void> => {
      try {
        const token = await getToken();
        const data = await ingredientApi.list(undefined, token);
        const transformed: AutocompleteIngredient[] = data.map((ing) => ({
          id: ing.id,
          name: ing.ingredient_name,
          category: ing.ingredient_category,
        }));
        setAvailableIngredients(transformed);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
      }
    };
    fetchIngredients();
  }, [getToken]);

  // ---------------------------------------------------------------------------
  // Step-specific validation
  // ---------------------------------------------------------------------------
  const validateStep = useCallback(
    (step: WizardStep): boolean => {
      const newErrors: Record<string, string> = {};
      const newIngredientErrors: Record<string, IngredientFieldErrors> = {};

      switch (step) {
        case 1: {
          if (!creationMethod) {
            newErrors.creationMethod = "Please select how you want to create your recipe";
          }
          break;
        }

        case 2: {
          const nameResult = validateString(recipeName, {
            required: true,
            min: 1,
            max: 255,
            label: "Recipe name",
          });
          if (!nameResult.isValid && nameResult.error) {
            newErrors.recipeName = nameResult.error;
          }

          const categoryResult = validateString(category, {
            required: true,
            label: "Category",
          });
          if (!categoryResult.isValid && categoryResult.error) {
            newErrors.category = categoryResult.error;
          }

          const mealTypeResult = validateString(mealType, {
            required: true,
            label: "Meal type",
          });
          if (!mealTypeResult.isValid && mealTypeResult.error) {
            newErrors.mealType = mealTypeResult.error;
          }

          // Optional numeric fields: validate only if provided
          if (prepTime) {
            const prepResult = validateInteger(prepTime, { min: 0, label: "Prep time" });
            if (!prepResult.isValid && prepResult.error) {
              newErrors.prepTime = prepResult.error;
            }
          }
          if (cookTime) {
            const cookResult = validateInteger(cookTime, { min: 0, label: "Cook time" });
            if (!cookResult.isValid && cookResult.error) {
              newErrors.cookTime = cookResult.error;
            }
          }
          if (servings) {
            const servingsResult = validateInteger(servings, { min: 1, label: "Servings" });
            if (!servingsResult.isValid && servingsResult.error) {
              newErrors.servings = servingsResult.error;
            }
          }
          break;
        }

        case 3: {
          const filledIngredients = ingredients.filter(
            (ing) => ing.ingredientName.trim() !== ""
          );
          if (filledIngredients.length === 0) {
            newErrors.ingredients = "At least one ingredient is required";
          }

          // Per-ingredient validation
          ingredients.forEach((ing) => {
            if (
              !ing.ingredientName.trim() &&
              !ing.quantity.trim() &&
              !ing.unit
            ) {
              return; // skip completely empty rows
            }
            const qty = ing.quantity.trim() ? parseFloat(ing.quantity) : null;
            const result = validateIngredientRow(
              ing.ingredientName,
              Number.isNaN(qty) ? null : qty,
              ing.unit
            );
            if (!result.isValid) {
              newIngredientErrors[ing.id] = result.errors;
            }
          });

          if (Object.keys(newIngredientErrors).length > 0) {
            newErrors.ingredientFields = "Some ingredients have errors";
          }
          break;
        }

        case 4: {
          const filledDirections = directions.filter(
            (dir) => dir.text.trim() !== ""
          );
          if (filledDirections.length === 0) {
            newErrors.directions = "At least one direction step is required";
          }
          break;
        }

        case 5:
          // No validation required (optional review / image step)
          break;
      }

      setErrors(newErrors);
      setIngredientErrors(newIngredientErrors);
      return Object.keys(newErrors).length === 0;
    },
    [
      creationMethod,
      recipeName,
      category,
      mealType,
      prepTime,
      cookTime,
      servings,
      ingredients,
      directions,
    ]
  );

  // ---------------------------------------------------------------------------
  // Computed: can the user proceed from the current step?
  // ---------------------------------------------------------------------------
  const canProceed = (() => {
    switch (currentStep) {
      case 1:
        return creationMethod !== null;
      case 2:
        return recipeName.trim().length > 0 && category.trim().length > 0 && mealType.trim().length > 0;
      case 3:
        return ingredients.some((ing) => ing.ingredientName.trim().length > 0);
      case 4:
        return directions.some((dir) => dir.text.trim().length > 0);
      case 5:
        return true;
      default:
        return false;
    }
  })();

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const goToStep = useCallback(
    (step: WizardStep): void => {
      setCurrentStep(step);
    },
    []
  );

  const nextStep = useCallback((): boolean => {
    hasAttemptedStepRef.current[currentStep] = true;

    const isValid = validateStep(currentStep);
    if (!isValid) return false;

    if (currentStep < LAST_STEP) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
    return isValid;
  }, [currentStep, validateStep]);

  const prevStep = useCallback((): void => {
    if (currentStep > FIRST_STEP) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  // ---------------------------------------------------------------------------
  // Ingredient handlers
  // ---------------------------------------------------------------------------
  const addIngredient = useCallback((): void => {
    setIngredients((prev) => [...prev, createEmptyIngredient()]);
  }, []);

  const updateIngredient = useCallback(
    (id: string, field: string, value: string | number | null): void => {
      setIngredients((prev) =>
        prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
      );
    },
    []
  );

  const deleteIngredient = useCallback((id: string): void => {
    setIngredients((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((ing) => ing.id !== id);
    });
  }, []);

  const reorderIngredients = useCallback((activeId: string, overId: string): void => {
    setIngredients((prev) => {
      const oldIndex = prev.findIndex((ing) => ing.id === activeId);
      const newIndex = prev.findIndex((ing) => ing.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const clearAllIngredients = useCallback((): void => {
    setIngredients([createEmptyIngredient()]);
  }, []);

  // ---------------------------------------------------------------------------
  // Direction handlers
  // ---------------------------------------------------------------------------
  const addDirection = useCallback((): void => {
    setDirections((prev) => [...prev, createEmptyDirection()]);
  }, []);

  const updateDirection = useCallback((id: string, text: string): void => {
    setDirections((prev) =>
      prev.map((dir) => (dir.id === id ? { ...dir, text } : dir))
    );
  }, []);

  const deleteDirection = useCallback((id: string): void => {
    setDirections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((dir) => dir.id !== id);
    });
  }, []);

  const reorderDirections = useCallback((activeId: string, overId: string): void => {
    setDirections((prev) => {
      const oldIndex = prev.findIndex((dir) => dir.id === activeId);
      const newIndex = prev.findIndex((dir) => dir.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Image handlers
  // ---------------------------------------------------------------------------
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImageFile(file);
      setBannerFile(null);
      setIsAiGenerated(false);
      setGeneratedRefData(null);
      setGeneratedBannerData(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleGeneratedImageAccept = useCallback(
    (refBase64: string, refDataUrl: string, bannerBase64?: string): void => {
      setImagePreview(refDataUrl);
      setGeneratedRefData(refBase64);
      setIsAiGenerated(true);

      const refFile = base64ToFile(refBase64, "recipe-ai-reference.png");
      setImageFile(refFile);

      if (bannerBase64) {
        setGeneratedBannerData(bannerBase64);
        const banner = base64ToFile(bannerBase64, "recipe-ai-banner.png");
        setBannerFile(banner);
      }
    },
    []
  );

  const handleBannerOnlyAccept = useCallback((bannerBase64: string): void => {
    setGeneratedBannerData(bannerBase64);
    const banner = base64ToFile(bannerBase64, "recipe-ai-banner.png");
    setBannerFile(banner);
  }, []);

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------
  const hasError = useCallback(
    (field: string): boolean => {
      const attempted =
        hasAttemptedSubmit || !!hasAttemptedStepRef.current[currentStep];
      return attempted && !!errors[field];
    },
    [hasAttemptedSubmit, currentStep, errors]
  );

  const getError = useCallback(
    (field: string): string | undefined => {
      const attempted =
        hasAttemptedSubmit || !!hasAttemptedStepRef.current[currentStep];
      return attempted ? errors[field] : undefined;
    },
    [hasAttemptedSubmit, currentStep, errors]
  );

  const getIngredientError = useCallback(
    (id: string, field: string): string | undefined => {
      const attempted =
        hasAttemptedSubmit || !!hasAttemptedStepRef.current[3];
      if (!attempted) return undefined;
      const fieldKey = field as "name" | "quantity";
      return ingredientErrors[id]?.[fieldKey];
    },
    [hasAttemptedSubmit, ingredientErrors]
  );

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    // Validate all steps before submission
    for (let step = 1; step <= LAST_STEP; step++) {
      const isValid = validateStep(step as WizardStep);
      if (!isValid) {
        setCurrentStep(step as WizardStep);
        toast.error("Please fix the errors before submitting.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      // Build ingredients DTO
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredientName.trim() !== ""
      );
      const apiIngredients: RecipeIngredientDTO[] = validIngredients.map((ing) => {
        const qty = ing.quantity.trim() ? parseFloat(ing.quantity) : null;
        return {
          ingredient_name: ing.ingredientName.trim(),
          ingredient_category: ing.ingredientCategory || "Other",
          quantity: Number.isNaN(qty) ? null : qty,
          unit: ing.unit || null,
          ...(ing.existingIngredientId != null && {
            existing_ingredient_id: ing.existingIngredientId,
          }),
        };
      });

      // Build directions string (each step on its own line)
      const directionsText = directions
        .filter((dir) => dir.text.trim() !== "")
        .map((dir) => dir.text.trim())
        .join("\n");

      // Calculate total_time
      const prep = prepTime.trim() ? parseInt(prepTime, 10) : null;
      const cook = cookTime.trim() ? parseInt(cookTime, 10) : null;
      let totalTime: number | null = null;
      if (prep !== null && cook !== null) {
        totalTime = prep + cook;
      } else if (prep !== null) {
        totalTime = prep;
      } else if (cook !== null) {
        totalTime = cook;
      }

      const payload: RecipeCreateDTO = {
        recipe_name: recipeName.trim(),
        recipe_category: category.trim(),
        meal_type: mealType.trim(),
        diet_pref: dietaryPreference === "none" ? null : dietaryPreference,
        description: description.trim() || null,
        total_time: totalTime,
        prep_time: prep,
        cook_time: cook,
        servings: servings.trim() ? parseInt(servings, 10) : null,
        difficulty: difficulty || null,
        directions: directionsText || null,
        notes: notes.trim() || null,
        ingredients: apiIngredients,
        is_ai_generated: isAiGenerated,
      };

      const createdRecipe = await recipeApi.create(payload, token);

      // Upload images
      let refPath: string | undefined;
      let bannerPath: string | undefined;

      // Reference image upload
      if (imageFile) {
        try {
          const result = await uploadApi.uploadRecipeImage(
            imageFile,
            createdRecipe.id,
            "reference",
            token
          );
          refPath = result.path;
        } catch (uploadError) {
          console.error("Failed to upload reference image:", uploadError);
        }
      } else if (generatedRefData) {
        try {
          const result = await uploadApi.uploadBase64Image(
            generatedRefData,
            createdRecipe.id,
            "reference",
            token
          );
          refPath = result.path;
        } catch (uploadError) {
          console.error("Failed to upload AI reference image:", uploadError);
        }
      }

      // Banner image upload
      if (bannerFile) {
        try {
          const result = await uploadApi.uploadRecipeImage(
            bannerFile,
            createdRecipe.id,
            "banner",
            token
          );
          bannerPath = result.path;
        } catch (uploadError) {
          console.error("Failed to upload banner image:", uploadError);
        }
      } else if (generatedBannerData) {
        try {
          const result = await uploadApi.uploadBase64Image(
            generatedBannerData,
            createdRecipe.id,
            "banner",
            token
          );
          bannerPath = result.path;
        } catch (uploadError) {
          console.error("Failed to upload AI banner image:", uploadError);
        }
      }

      // Patch recipe with image paths if any uploaded
      if (refPath || bannerPath) {
        await recipeApi.update(
          createdRecipe.id,
          {
            ...(refPath && { reference_image_path: refPath }),
            ...(bannerPath && { banner_image_path: bannerPath }),
          },
          token
        );
      }

      // Warn if some images failed
      const imageFailed =
        ((imageFile || generatedRefData) && !refPath) ||
        ((bannerFile || generatedBannerData) && !bannerPath);
      if (imageFailed) {
        toast.warning(
          "Recipe created, but some images failed to upload. You can add them later by editing the recipe."
        );
      }

      toast.success("Recipe created successfully!");
      router.push(`/recipes/${createdRecipe.id}`);
    } catch (error) {
      console.error("Failed to create recipe:", error);
      toast.error("Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateStep,
    getToken,
    ingredients,
    directions,
    recipeName,
    description,
    category,
    mealType,
    dietaryPreference,
    prepTime,
    cookTime,
    servings,
    difficulty,
    notes,
    isAiGenerated,
    imageFile,
    bannerFile,
    generatedRefData,
    generatedBannerData,
    router,
  ]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Step navigation
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    canProceed,

    // Creation method
    creationMethod,
    setCreationMethod,

    // Recipe basics
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

    // Ingredients
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    reorderIngredients,
    clearAllIngredients,
    availableIngredients,

    // Directions
    directions,
    addDirection,
    updateDirection,
    deleteDirection,
    reorderDirections,

    // Notes
    notes,
    setNotes,

    // Image
    imagePreview,
    imageFile,
    bannerFile,
    isAiGenerated,
    generatedRefData,
    generatedBannerData,
    handleImageUpload,
    handleGeneratedImageAccept,
    handleBannerOnlyAccept,

    // Validation
    errors,
    ingredientErrors,
    hasError,
    getError,
    getIngredientError,
    hasAttemptedSubmit,

    // Submission
    handleSubmit,
    isSubmitting,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyIngredient(): WizardIngredient {
  return {
    id: uuidv4(),
    ingredientName: "",
    ingredientCategory: "",
    quantity: "",
    unit: "",
    existingIngredientId: null,
  };
}

function createEmptyDirection(): WizardDirection {
  return {
    id: uuidv4(),
    text: "",
  };
}
