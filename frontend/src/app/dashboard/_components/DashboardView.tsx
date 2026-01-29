"use client";

import { BookOpen, Heart, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { DashboardStatCard } from "./DashboardStatCard";
import { MealQueueWidget } from "./MealQueueWidget";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { ChefTipWidget } from "./ChefTipWidget";
import { CookingStreakWidget } from "./CookingStreakWidget";
import { RecipeRouletteWidget } from "./RecipeRouletteWidget";
import { QuickAddWidget } from "./QuickAddWidget";
import { useDashboardStats, usePlannerEntries, useShoppingList } from "@/hooks/api";

export function DashboardView() {
  // Fetch all data via React Query hooks (parallel fetching)
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: plannerEntries } = usePlannerEntries();
  const { data: shoppingData } = useShoppingList();

  const isLoading = statsLoading;
  const stats = {
    totalRecipes: statsData?.total_recipes ?? 0,
    favorites: statsData?.favorites ?? 0,
    mealsPlanned: statsData?.meals_planned ?? 0,
    shoppingItems: statsData?.shopping_items ?? 0,
  };

  return (
    <PageLayout
      title="Dashboard"
      description="Overview of your meal planning activities"
      fillViewport
      contentClassName="flex flex-col"
    >
      {/* Stat Cards - fixed height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <DashboardStatCard
          icon={BookOpen}
          value={stats.totalRecipes}
          label="Total Recipes"
          colorClass="purple"
          isLoading={isLoading}
        />
        <DashboardStatCard
          icon={Heart}
          value={stats.favorites}
          label="Favorites"
          colorClass="pink"
          isLoading={isLoading}
        />
        <DashboardStatCard
          icon={UtensilsCrossed}
          value={stats.mealsPlanned}
          label="Meals Planned"
          colorClass="teal"
          isLoading={isLoading}
        />
        <DashboardStatCard
          icon={ShoppingCart}
          value={stats.shoppingItems}
          label="Shopping Items"
          colorClass="amber"
          isLoading={isLoading}
        />
      </div>

      {/* Widgets Section - fills remaining space */}
      <div className="mt-6 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1.5fr_1fr] xl:grid-rows-[1fr_auto] gap-6">
        {/* Column 1: Cooking Streak + Shopping List - spans 2 rows on xl */}
        <div className="widget-column xl:row-span-2">
          <CookingStreakWidget />
          <div className="flex-1 min-h-0">
            <ShoppingListWidget shoppingData={shoppingData} />
          </div>
        </div>
        {/* Column 2: Meal Queue */}
        <div className="widget-column">
          <div className="flex-1 min-h-0">
            <MealQueueWidget entries={plannerEntries} />
          </div>
        </div>
        {/* Column 3: Recipe Roulette + Quick Add */}
        <div className="widget-column">
          <div className="flex-1 min-h-0">
            <RecipeRouletteWidget />
          </div>
          <QuickAddWidget />
        </div>
        {/* Chef's Tip - spans columns 2-3 on xl */}
        <div className="xl:col-span-2">
          <ChefTipWidget />
        </div>
      </div>
    </PageLayout>
  );
}
