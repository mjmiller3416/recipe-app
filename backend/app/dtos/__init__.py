# app/core/dtos/__init__.py

from .ingredient_dtos import (
    IngredientBaseDTO,
    IngredientCreateDTO,
    IngredientDetailDTO,
    IngredientResponseDTO,
    IngredientSearchDTO,
    IngredientUpdateDTO,
)
from .meal_dtos import (
    MealBaseDTO,
    MealCreateDTO,
    MealFilterDTO,
    MealResponseDTO,
    MealUpdateDTO,
    RecipeDeletionImpactDTO,
)
from .planner_dtos import (
    PlannerBulkAddDTO,
    PlannerEntryResponseDTO,
    PlannerOperationResultDTO,
    PlannerReorderDTO,
    PlannerSummaryDTO,
)
from .recipe_dtos import (
    RecipeBaseDTO,
    RecipeCardDTO,
    RecipeCreateDTO,
    RecipeFilterDTO,
    RecipeIngredientDTO,
    RecipeResponseDTO,
    RecipeUpdateDTO,
)
from .unit_conversion_dtos import (
    UnitConversionRuleBaseDTO,
    UnitConversionRuleCreateDTO,
    UnitConversionRuleResponseDTO,
    UnitConversionRuleUpdateDTO,
)
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
    ShoppingStateDTO,
)

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

    # Meal DTOs
    "MealBaseDTO",
    "MealCreateDTO",
    "MealUpdateDTO",
    "MealResponseDTO",
    "MealFilterDTO",
    "RecipeDeletionImpactDTO",

    # Planner DTOs
    "PlannerEntryResponseDTO",
    "PlannerSummaryDTO",
    "PlannerReorderDTO",
    "PlannerBulkAddDTO",
    "PlannerOperationResultDTO",

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

    # Unit Conversion DTOs
    "UnitConversionRuleBaseDTO",
    "UnitConversionRuleCreateDTO",
    "UnitConversionRuleUpdateDTO",
    "UnitConversionRuleResponseDTO",
]
