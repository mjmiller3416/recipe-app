# app/core/dtos/__init__.py

from .ingredient_dtos import (
    IngredientBaseDTO,
    IngredientCreateDTO,
    IngredientDetailDTO,
    IngredientResponseDTO,
    IngredientSearchDTO,
    IngredientUpdateDTO)
from .planner_dtos import (
    MealPlanSaveResultDTO,
    MealPlanSummaryDTO,
    MealPlanValidationDTO,
    MealSelectionBaseDTO,
    MealSelectionCreateDTO,
    MealSelectionFilterDTO,
    MealSelectionResponseDTO,
    MealSelectionUpdateDTO)
from .recipe_dtos import (
    RecipeBaseDTO,
    RecipeCreateDTO,
    RecipeFilterDTO,
    RecipeIngredientDTO,
    RecipeResponseDTO,
    RecipeUpdateDTO)
from .shopping_dtos import (
    BulkOperationResultDTO,
    BulkStateUpdateDTO,
    IngredientAggregationDTO,
    IngredientBreakdownDTO,
    IngredientBreakdownItemDTO,
    ManualItemCreateDTO,
    ShoppingItemBaseDTO,
    ShoppingItemCreateDTO,
    ShoppingItemResponseDTO,
    ShoppingItemUpdateDTO,
    ShoppingListFilterDTO,
    ShoppingListGenerationDTO,
    ShoppingListGenerationResultDTO,
    ShoppingListResponseDTO,
    ShoppingStateDTO)

__all__ = [
    # Recipe DTOs
    "RecipeIngredientDTO",
    "RecipeBaseDTO",
    "RecipeCardDTO",
    "RecipeCreateDTO",
    "RecipeUpdateDTO",
    "RecipeResponseDTO",
    "RecipeFilterDTO",

    # Ingredient DTOs
    "IngredientBaseDTO",
    "IngredientCreateDTO",
    "IngredientUpdateDTO",
    "IngredientResponseDTO",
    "IngredientSearchDTO",
    "IngredientDetailDTO",

    # Planner DTOs
    "MealSelectionBaseDTO",
    "MealSelectionCreateDTO",
    "MealSelectionUpdateDTO",
    "MealSelectionResponseDTO",
    "MealSelectionFilterDTO",
    "MealPlanSummaryDTO",
    "MealPlanValidationDTO",
    "MealPlanSaveResultDTO",

    # Shopping DTOs
    "ShoppingItemBaseDTO",
    "ShoppingItemCreateDTO",
    "ManualItemCreateDTO",
    "ShoppingItemUpdateDTO",
    "ShoppingItemResponseDTO",
    "ShoppingListResponseDTO",
    "ShoppingListFilterDTO",
    "ShoppingListGenerationDTO",
    "ShoppingListGenerationResultDTO",
    "IngredientAggregationDTO",
    "IngredientBreakdownDTO",
    "IngredientBreakdownItemDTO",
    "ShoppingStateDTO",
    "BulkStateUpdateDTO",
    "BulkOperationResultDTO",
]
