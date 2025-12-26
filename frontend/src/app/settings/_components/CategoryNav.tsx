import {
  User,
  Palette,
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Database,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type SettingsCategory =
  | "profile"
  | "appearance"
  | "mealPlanning"
  | "recipePreferences"
  | "shoppingList"
  | "dataManagement"
  | "feedback";

export interface CategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "profile",
    label: "Account & Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Customize the look and feel",
  },
  {
    id: "mealPlanning",
    label: "Meal Planning",
    icon: CalendarDays,
    description: "Configure meal planning defaults",
  },
  {
    id: "recipePreferences",
    label: "Recipe Preferences",
    icon: ChefHat,
    description: "Set your recipe browsing preferences",
  },
  {
    id: "shoppingList",
    label: "Shopping List",
    icon: ShoppingCart,
    description: "Customize shopping list behavior",
  },
  {
    id: "dataManagement",
    label: "Data Management",
    icon: Database,
    description: "Export, import, and manage your data",
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: MessageSquare,
    description: "Share your thoughts and suggestions",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface CategoryNavProps {
  categories: CategoryConfig[];
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavProps) {
  return (
    <nav className="space-y-1">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted hover:text-foreground hover:bg-hover"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-primary-foreground"
              )}
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-primary-foreground"
                )}
              >
                {category.label}
              </p>
              <p
                className={cn(
                  "text-xs truncate mt-0.5",
                  isActive ? "text-primary-foreground/70" : "text-muted"
                )}
              >
                {category.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
