"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { recipeApi, ingredientApi, uploadApi, recipeGenerationApi, ApiError } from "@/lib/api";
import { base64ToFile } from "@/lib/utils";
import type {
  RecipeCreateDTO,
  RecipeIngredientDTO,
  NutritionFactsCreateDTO,
  WizardCreationMethod,
  WizardStep,
  WizardIngredient,
  WizardDirection,
} from "@/types/recipe";
import type {
  NutritionFactsDTO,
  RecipeGenerationPreferencesDTO,
  RecipeGeneratedDTO,
  RecipeGenerationResponseDTO,
} from "@/types/ai";
import type { AutocompleteIngredient } from "@/components/forms/IngredientAutocomplete";
import { wizardFormSchema, WIZARD_STEP_FIELDS, type WizardFormValues } from "./wizardSchema";

// ============================================================================
// CONSTANTS
// ============================================================================

const FIRST_STEP: WizardStep = 1;
const LAST_STEP: WizardStep = 5;

// ============================================================================
// HOOK
// ============================================================================

interface UseRecipeWizardOptions {
  onSave?: () => void;
}

export function useRecipeWizard({ onSave }: UseRecipeWizardOptions = {}) {
  const router = useRouter();
  const { getToken } = useAuth();

  // ---------------------------------------------------------------------------
  // React Hook Form (replaces individual useState for recipe fields)
  // ---------------------------------------------------------------------------
  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: {
      recipeName: "",
      description: "",
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      difficulty: "",
      mealType: "",
      category: "",
      dietaryPreference: "none",
      ingredients: [createEmptyIngredient()],
      directions: [createEmptyDirection()],
      notes: "",
    },
    mode: "onTouched",
  });

  // Subscribe to all form changes for reactive computed values
  const watchedValues = form.watch();

  // ---------------------------------------------------------------------------
  // Step navigation (non-form state)
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [creationMethod, setCreationMethod] = useState<WizardCreationMethod | null>(null);

  // ---------------------------------------------------------------------------
  // Image state (non-form)
  // ---------------------------------------------------------------------------
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [generatedRefData, setGeneratedRefData] = useState<string | null>(null);
  const [generatedBannerData, setGeneratedBannerData] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Nutrition state (non-form — optional AI blob)
  // ---------------------------------------------------------------------------
  const [nutritionFacts, setNutritionFacts] = useState<NutritionFactsDTO | null>(null);

  // ---------------------------------------------------------------------------
  // AI generation state (non-form)
  // ---------------------------------------------------------------------------
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreferences, setAiPreferences] = useState<RecipeGenerationPreferencesDTO>({});
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeGeneratedDTO | null>(null);
  const [generationResponse, setGenerationResponse] = useState<RecipeGenerationResponseDTO | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Available ingredients (autocomplete)
  // ---------------------------------------------------------------------------
  const [availableIngredients, setAvailableIngredients] = useState<AutocompleteIngredient[]>([]);

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
        toast.error("Couldn't load ingredient suggestions. Autocomplete may be limited.");
      }
    };
    fetchIngredients();
  }, [getToken]);

  // ---------------------------------------------------------------------------
  // Step-specific validation via form.trigger()
  // ---------------------------------------------------------------------------
  const validateStep = useCallback(
    async (step: WizardStep): Promise<boolean> => {
      // Step 1: creationMethod is non-form state
      if (step === 1) {
        return creationMethod !== null;
      }

      // Step 2 AI mode: no form validation
      if (step === 2 && creationMethod === "ai-generate") {
        return true;
      }

      // Step 3: check at least one filled ingredient before field validation
      if (step === 3) {
        const ingredients = form.getValues("ingredients");
        const hasFilledIngredient = ingredients.some(
          (ing) => ing.ingredientName.trim().length > 0
        );
        if (!hasFilledIngredient) {
          form.setError("ingredients.root" as `ingredients.${number}`, {
            type: "manual",
            message: "At least one ingredient is required",
          });
          return false;
        }
      }

      // Step 4: check at least one filled direction
      if (step === 4) {
        const directions = form.getValues("directions");
        const hasFilledDirection = directions.some(
          (dir) => dir.text.trim().length > 0
        );
        if (!hasFilledDirection) {
          form.setError("directions.root" as `directions.${number}`, {
            type: "manual",
            message: "At least one direction step is required",
          });
          return false;
        }
      }

      // Validate the fields for the given step
      const fields = WIZARD_STEP_FIELDS[step];
      if (!fields || fields.length === 0) return true;

      return form.trigger(fields);
    },
    [creationMethod, form]
  );

  // ---------------------------------------------------------------------------
  // Computed: can the user proceed from the current step?
  // ---------------------------------------------------------------------------
  const canProceed = (() => {
    switch (currentStep) {
      case 1:
        return creationMethod !== null;
      case 2:
        if (creationMethod === "ai-generate") {
          return generatedRecipe !== null;
        }
        return (
          watchedValues.recipeName.trim().length > 0 &&
          watchedValues.category.trim().length > 0 &&
          watchedValues.mealType.trim().length > 0
        );
      case 3:
        return watchedValues.ingredients.some(
          (ing) => ing.ingredientName.trim().length > 0
        );
      case 4:
        return watchedValues.directions.some(
          (dir) => dir.text.trim().length > 0
        );
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

  const prevStep = useCallback((): void => {
    if (currentStep > FIRST_STEP) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  const nextStep = useCallback(async (): Promise<boolean> => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return false;

    if (currentStep < LAST_STEP) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
    return true;
  }, [currentStep, validateStep]);

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
  // AI generation: populate wizard from generated recipe
  // ---------------------------------------------------------------------------
  const populateFromGeneration = useCallback(
    (response: RecipeGenerationResponseDTO): void => {
      const recipe = response.recipe;
      if (!recipe) return;

      // Recipe basics via form.setValue
      form.setValue("recipeName", recipe.recipe_name || "");
      form.setValue("description", recipe.description || "");
      form.setValue("category", recipe.recipe_category || "");
      form.setValue("mealType", recipe.meal_type || "");
      form.setValue("dietaryPreference", recipe.diet_pref || "none");
      form.setValue("prepTime", recipe.prep_time ?? 0);
      form.setValue("cookTime", recipe.cook_time ?? 0);
      form.setValue("servings", recipe.servings ?? 4);
      form.setValue("difficulty", recipe.difficulty || "");

      // Ingredients
      if (recipe.ingredients.length > 0) {
        const mapped: WizardIngredient[] = recipe.ingredients.map((ing) => ({
          id: uuidv4(),
          ingredientName: ing.ingredient_name,
          ingredientCategory: ing.ingredient_category || "",
          quantity: ing.quantity != null ? String(ing.quantity) : "",
          unit: ing.unit || "",
          existingIngredientId: null,
        }));
        form.setValue("ingredients", mapped);
      }

      // Directions
      if (recipe.directions) {
        const lines = recipe.directions
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          const mapped: WizardDirection[] = lines.map((text) => ({
            id: uuidv4(),
            text,
          }));
          form.setValue("directions", mapped);
        }
      }

      // Notes
      if (recipe.notes) {
        form.setValue("notes", recipe.notes);
      }

      // Nutrition (non-form state)
      if (response.nutrition_facts) {
        setNutritionFacts(response.nutrition_facts);
      }

      // Images (non-form state)
      if (response.reference_image_data) {
        const refDataUrl = `data:image/png;base64,${response.reference_image_data}`;
        setImagePreview(refDataUrl);
        setGeneratedRefData(response.reference_image_data);
        setIsAiGenerated(true);
        const refFile = base64ToFile(response.reference_image_data, "recipe-ai-reference.png");
        setImageFile(refFile);
      }
      if (response.banner_image_data) {
        setGeneratedBannerData(response.banner_image_data);
        const banner = base64ToFile(response.banner_image_data, "recipe-ai-banner.png");
        setBannerFile(banner);
      }
    },
    [form]
  );

  // ---------------------------------------------------------------------------
  // AI generation: call API
  // ---------------------------------------------------------------------------
  const handleWizardGenerate = useCallback(async (): Promise<void> => {
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setAiError(null);
    setGeneratedRecipe(null);
    setGenerationResponse(null);

    try {
      const token = await getToken();
      const response = await recipeGenerationApi.generate(
        {
          prompt: aiPrompt.trim(),
          preferences: Object.keys(aiPreferences).length > 0 ? aiPreferences : undefined,
          estimate_nutrition: true,
          generate_image: true,
        },
        token
      );

      if (!response.success || !response.recipe) {
        setAiError(response.error || "Failed to generate recipe. Please try again.");
        return;
      }

      setGeneratedRecipe(response.recipe);
      setGenerationResponse(response);
      toast.success(`"${response.recipe.recipe_name}" is ready! Tap Accept & Edit to review it.`);
    } catch (error) {
      console.error("AI generation failed:", error);
      setAiError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, aiPreferences, isGenerating, getToken]);

  // ---------------------------------------------------------------------------
  // AI generation: accept generated recipe and populate wizard fields
  // ---------------------------------------------------------------------------
  const handleAcceptGeneratedRecipe = useCallback((): void => {
    if (!generationResponse) return;

    populateFromGeneration(generationResponse);
    setIsAiGenerated(true);

    // Switch to manual method so step 2 shows the Recipe Basics form
    setCreationMethod("manual");
    setCurrentStep(2);
  }, [generationResponse, populateFromGeneration]);

  // ---------------------------------------------------------------------------
  // Computed: has the user entered any meaningful data?
  // ---------------------------------------------------------------------------
  const hasUnsavedData = useMemo(() => {
    return !!(
      watchedValues.recipeName.trim() ||
      watchedValues.description.trim() ||
      watchedValues.ingredients.some((ing) => ing.ingredientName.trim()) ||
      watchedValues.directions.some((d) => d.text.trim()) ||
      imagePreview ||
      nutritionFacts ||
      aiPrompt.trim() ||
      generatedRecipe
    );
  }, [watchedValues, imagePreview, nutritionFacts, aiPrompt, generatedRecipe]);

  // ---------------------------------------------------------------------------
  // Reset wizard to initial state
  // ---------------------------------------------------------------------------
  const resetWizard = useCallback((): void => {
    setCurrentStep(1);
    setCreationMethod(null);
    form.reset();
    // Non-form state
    setImagePreview(null);
    setImageFile(null);
    setBannerFile(null);
    setIsAiGenerated(false);
    setGeneratedRefData(null);
    setGeneratedBannerData(null);
    setNutritionFacts(null);
    setAiPrompt("");
    setAiPreferences({});
    setGeneratedRecipe(null);
    setGenerationResponse(null);
    setIsGenerating(false);
    setAiError(null);
  }, [form]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(async (): Promise<void> => {
    // Validate all steps before submission
    for (let step = 1; step <= LAST_STEP; step++) {
      const isValid = await validateStep(step as WizardStep);
      if (!isValid) {
        setCurrentStep(step as WizardStep);
        toast.error("Please fix the errors before submitting.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      const values = form.getValues();

      // Build ingredients DTO
      const validIngredients = values.ingredients.filter(
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
      const directionsText = values.directions
        .filter((dir) => dir.text.trim() !== "")
        .map((dir) => dir.text.trim())
        .join("\n");

      // Calculate total_time (now numbers, not strings)
      const prep = values.prepTime || null;
      const cook = values.cookTime || null;
      let totalTime: number | null = null;
      if (prep !== null && cook !== null) {
        totalTime = prep + cook;
      } else if (prep !== null) {
        totalTime = prep;
      } else if (cook !== null) {
        totalTime = cook;
      }

      // Build nutrition facts DTO if available
      let nutritionPayload: NutritionFactsCreateDTO | null = null;
      if (nutritionFacts) {
        nutritionPayload = {
          calories: nutritionFacts.calories,
          protein_g: nutritionFacts.protein_g,
          total_fat_g: nutritionFacts.total_fat_g,
          saturated_fat_g: nutritionFacts.saturated_fat_g,
          trans_fat_g: nutritionFacts.trans_fat_g,
          cholesterol_mg: nutritionFacts.cholesterol_mg,
          sodium_mg: nutritionFacts.sodium_mg,
          total_carbs_g: nutritionFacts.total_carbs_g,
          dietary_fiber_g: nutritionFacts.dietary_fiber_g,
          total_sugars_g: nutritionFacts.total_sugars_g,
          is_ai_estimated: nutritionFacts.is_ai_estimated,
        };
      }

      const payload: RecipeCreateDTO = {
        recipe_name: values.recipeName.trim(),
        recipe_category: values.category.trim(),
        meal_type: values.mealType.trim(),
        diet_pref: values.dietaryPreference === "none" ? null : values.dietaryPreference,
        description: values.description.trim() || null,
        total_time: totalTime,
        prep_time: prep,
        cook_time: cook,
        servings: values.servings || null,
        difficulty: values.difficulty || null,
        directions: directionsText || null,
        notes: values.notes.trim() || null,
        ingredients: apiIngredients,
        is_ai_generated: isAiGenerated,
        nutrition_facts: nutritionPayload,
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
      resetWizard();
      onSave?.();
      router.push(`/recipes/${createdRecipe.id}`);
    } catch (error) {
      console.error("Failed to create recipe:", error);
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setCurrentStep(2);
          toast.error(error.message);
        } else {
          toast.error(error.message || "Failed to create recipe.");
        }
      } else {
        toast.error("Failed to create recipe. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validateStep,
    getToken,
    form,
    isAiGenerated,
    imageFile,
    bannerFile,
    generatedRefData,
    generatedBannerData,
    nutritionFacts,
    router,
    onSave,
    resetWizard,
  ]);

  // ---------------------------------------------------------------------------
  // Dev: fill all fields with sample data for quick testing
  // ---------------------------------------------------------------------------
  const fillSampleData = useCallback((): void => {
    switch (currentStep) {
      case 1:
        setCreationMethod("manual");
        break;
      case 2:
        form.setValue("recipeName", "Classic Spaghetti Carbonara");
        form.setValue("description", "A rich and creamy Italian pasta dish with eggs, cheese, pancetta, and black pepper.");
        form.setValue("prepTime", 15);
        form.setValue("cookTime", 20);
        form.setValue("servings", 4);
        form.setValue("difficulty", "Medium");
        form.setValue("mealType", "dinner");
        form.setValue("category", "italian");
        form.setValue("dietaryPreference", "none");
        break;
      case 3:
        form.setValue("ingredients", [
          { id: uuidv4(), ingredientName: "Spaghetti", ingredientCategory: "pantry", quantity: "14", unit: "oz", existingIngredientId: null },
          { id: uuidv4(), ingredientName: "Pancetta", ingredientCategory: "meat", quantity: "7", unit: "oz", existingIngredientId: null },
          { id: uuidv4(), ingredientName: "Eggs", ingredientCategory: "dairy", quantity: "4", unit: "whole", existingIngredientId: null },
          { id: uuidv4(), ingredientName: "Parmesan Cheese", ingredientCategory: "dairy", quantity: "3.5", unit: "oz", existingIngredientId: null },
          { id: uuidv4(), ingredientName: "Black Pepper", ingredientCategory: "spices", quantity: "1", unit: "tsp", existingIngredientId: null },
        ]);
        break;
      case 4:
        form.setValue("directions", [
          { id: uuidv4(), text: "Bring a large pot of salted water to a boil and cook spaghetti until al dente." },
          { id: uuidv4(), text: "While pasta cooks, fry pancetta in a large skillet over medium heat until crispy." },
          { id: uuidv4(), text: "Whisk eggs, grated Parmesan, and black pepper together in a bowl." },
          { id: uuidv4(), text: "Drain pasta, reserving 1 cup of pasta water. Add pasta to the pancetta skillet off heat." },
          { id: uuidv4(), text: "Pour egg mixture over pasta and toss quickly, adding pasta water as needed for a creamy sauce." },
        ]);
        form.setValue("notes", "Use guanciale instead of pancetta for a more traditional version. Pecorino Romano can substitute for Parmesan.");
        break;
      case 5:
        break;
    }
  }, [currentStep, form]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Form (react-hook-form — used by FormProvider and step components)
    form,

    // Step navigation
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    canProceed,

    // Creation method
    creationMethod,
    setCreationMethod,

    // Image
    imagePreview,
    isAiGenerated,
    handleImageUpload,
    handleGeneratedImageAccept,
    handleBannerOnlyAccept,

    // Nutrition
    nutritionFacts,
    setNutritionFacts,

    // AI generation
    aiPrompt,
    setAiPrompt,
    aiPreferences,
    setAiPreferences,
    generatedRecipe,
    isGenerating,
    aiError,
    handleWizardGenerate,
    handleAcceptGeneratedRecipe,

    // Autocomplete data
    availableIngredients,

    // Submission
    handleSubmit,
    isSubmitting,

    // Unsaved data detection
    hasUnsavedData,

    // Reset
    resetWizard,

    // Dev
    fillSampleData,
  };
}

// ============================================================================
// HELPERS (exported for use by step components)
// ============================================================================

export function createEmptyIngredient(): WizardIngredient {
  return {
    id: uuidv4(),
    ingredientName: "",
    ingredientCategory: "",
    quantity: "",
    unit: "",
    existingIngredientId: null,
  };
}

export function createEmptyDirection(): WizardDirection {
  return {
    id: uuidv4(),
    text: "",
  };
}
