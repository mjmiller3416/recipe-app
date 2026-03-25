# app/dtos/__init__.py

from .admin_dtos import (
    AdminFeedbackDetailDTO,
    AdminFeedbackListItemDTO,
    AdminFeedbackListResponseDTO,
    AdminFeedbackUpdateDTO,
    AdminGrantProDTO,
    AdminToggleAdminDTO,
    AdminUserListDTO,
    AdminUserListResponseDTO,
    CurrentUserDTO,
)
from .assistant_dtos import (
    AssistantMessageDTO,
    AssistantRequestDTO,
    AssistantResponseDTO,
    GeneratedIngredientDTO,
    GeneratedRecipeDTO,
    RecipeGenerationRequestDTO,
    RecipeGenerationResponseDTO,
)
from .cooking_tip_dtos import CookingTipResponseDTO
from .image_generation_dtos import (
    BannerGenerationRequestDTO,
    BannerGenerationResponseDTO,
    ImageGenerationRequestDTO,
    ImageGenerationResponseDTO,
)
from .meal_suggestions_dtos import (
    MealSuggestionsRequestDTO,
    MealSuggestionsResponseDTO,
)
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
)

__all__ = [
    # Admin DTOs
    "CurrentUserDTO",
    "AdminUserListDTO",
    "AdminUserListResponseDTO",
    "AdminGrantProDTO",
    "AdminToggleAdminDTO",
    "AdminFeedbackListItemDTO",
    "AdminFeedbackDetailDTO",
    "AdminFeedbackListResponseDTO",
    "AdminFeedbackUpdateDTO",

    # Assistant (AI Chat) DTOs
    "AssistantMessageDTO",
    "AssistantRequestDTO",
    "AssistantResponseDTO",
    "GeneratedIngredientDTO",
    "GeneratedRecipeDTO",
    "RecipeGenerationRequestDTO",
    "RecipeGenerationResponseDTO",

    # Cooking Tip DTOs
    "CookingTipResponseDTO",

    # Image Generation DTOs
    "ImageGenerationRequestDTO",
    "ImageGenerationResponseDTO",
    "BannerGenerationRequestDTO",
    "BannerGenerationResponseDTO",

    # Meal Suggestions DTOs
    "MealSuggestionsRequestDTO",
    "MealSuggestionsResponseDTO",

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
    "BulkStateUpdateDTO",
    "BulkOperationResultDTO",

    # Unit Conversion DTOs
    "UnitConversionRuleBaseDTO",
    "UnitConversionRuleCreateDTO",
    "UnitConversionRuleUpdateDTO",
    "UnitConversionRuleResponseDTO",
]
