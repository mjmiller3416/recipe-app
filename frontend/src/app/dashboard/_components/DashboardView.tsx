"use client";

import { useEffect, useState } from "react";
import { BookOpen, Heart, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { DashboardStatCard } from "./DashboardStatCard";
import { MealQueueWidget } from "./MealQueueWidget";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { ChefTipWidget } from "./ChefTipWidget";
import { CookingStreakWidget } from "./CookingStreakWidget";
import {
  AskMealGeniePlaceholder,
  RecentlyAddedPlaceholder,
} from "./PlaceholderWidgets";
import { recipeApi, plannerApi, shoppingApi } from "@/lib/api";

interface DashboardStats {
  totalRecipes: number;
  favorites: number;
  mealsPlanned: number;
  shoppingItems: number;
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecipes: 0,
    favorites: 0,
    mealsPlanned: 0,
    shoppingItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [recipes, entries, shoppingData] = await Promise.all([
          recipeApi.list(),
          plannerApi.getEntries(),
          shoppingApi.getList(),
        ]);

        setStats({
          totalRecipes: recipes.length,
          favorites: recipes.filter((r) => r.is_favorite).length,
          mealsPlanned: entries.length,
          shoppingItems: shoppingData.total_items,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

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
      <div className="mt-6 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[1fr] gap-6">
        <MealQueueWidget />
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ShoppingListWidget />
          </div>
          <ChefTipWidget />
        </div>
        <div className="flex flex-col gap-4 min-h-0 overflow-hidden">
          <AskMealGeniePlaceholder />
          <CookingStreakWidget />
          <RecentlyAddedPlaceholder />
        </div>
      </div>
    </PageLayout>
  );
}
