"use client";

import { useEffect, useState } from "react";
import { BookOpen, Heart, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { DashboardStatCard } from "./DashboardStatCard";
import { MealQueueWidget } from "./MealQueueWidget";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { ChefTipWidget } from "./ChefTipWidget";
import { CookingStreakWidget } from "./CookingStreakWidget";
import { RecipeRouletteWidget } from "./RecipeRouletteWidget";
import { dashboardApi, plannerApi, shoppingApi } from "@/lib/api";
import type { PlannerEntryResponseDTO, ShoppingListResponseDTO } from "@/types";

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

  // Data to pass to child widgets (avoids duplicate API calls)
  const [plannerEntries, setPlannerEntries] = useState<PlannerEntryResponseDTO[]>([]);
  const [shoppingData, setShoppingData] = useState<ShoppingListResponseDTO | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats from lightweight endpoint + data for widgets
        const [statsData, entries, shopping] = await Promise.all([
          dashboardApi.getStats(),
          plannerApi.getEntries(),
          shoppingApi.getList(),
        ]);

        setStats({
          totalRecipes: statsData.total_recipes,
          favorites: statsData.favorites,
          mealsPlanned: statsData.meals_planned,
          shoppingItems: statsData.shopping_items,
        });

        // Store data for child widgets
        setPlannerEntries(entries);
        setShoppingData(shopping);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
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
      <div className="mt-6 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Column 1: Cooking Streak + Meal Queue */}
        <div className="widget-column">
          <CookingStreakWidget />
          <div className="flex-1 min-h-0">
            <MealQueueWidget entries={plannerEntries} />
          </div>
        </div>
        {/* Column 2: Shopping List + Chef's Tip */}
        <div className="widget-column">
          <div className="flex-1 min-h-0">
            <ShoppingListWidget shoppingData={shoppingData} />
          </div>
          <ChefTipWidget />
        </div>
        {/* Column 3: Recipe Roulette */}
        <div className="widget-column lg:col-span-2 xl:col-span-1">
          <RecipeRouletteWidget />
        </div>
      </div>
    </PageLayout>
  );
}
