"use client";

import { BookOpen, Heart, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeaderContent } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { MealCarouselWidget } from "./carousel";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { ChefTipWidget } from "./ChefTipWidget";
import { CookingStreakWidget } from "./CookingStreakWidget";
import { RecipeRouletteWidget } from "./RecipeRouletteWidget";
import { QuickAddForm } from "@/components/forms/QuickAddForm";
import { useDashboardStats, usePlannerEntries, useShoppingList } from "@/hooks/api";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { user } = useUser();

  // Fetch all data via React Query hooks (parallel fetching)
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const {
    data: plannerEntries,
    error: plannerError,
    refetch: refetchPlanner,
  } = usePlannerEntries();
  const {
    data: shoppingData,
    error: shoppingError,
    refetch: refetchShopping,
  } = useShoppingList();

  const isLoading = statsLoading;
  const hasError = statsError || plannerError || shoppingError;
  const stats = {
    totalRecipes: statsData?.total_recipes ?? 0,
    favorites: statsData?.favorites ?? 0,
    mealsPlanned: statsData?.meals_planned ?? 0,
    shoppingItems: statsData?.shopping_items ?? 0,
  };

  const firstName = user?.firstName || "there";

  if (hasError) {
    return (
      <PageLayout
        headerContent={
          <PageHeaderContent>
            <div className="flex flex-1 flex-col gap-1.5">
              <h2 className="text-2xl font-semibold text-foreground">
                {`${getGreeting()}, ${firstName} 👋`}
              </h2>
            </div>
          </PageHeaderContent>
        }
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <UtensilsCrossed className="size-8 text-destructive" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Failed to load dashboard data. Please try again.
          </p>
          <Button onClick={() => {
            if (statsError) refetchStats();
            if (plannerError) refetchPlanner();
            if (shoppingError) refetchShopping();
          }}>
            Try Again
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      headerContent={
        <PageHeaderContent>
          <div className="flex flex-1 flex-col gap-1.5">
            <h2 className="text-2xl font-semibold text-foreground">
              {`${getGreeting()}, ${firstName} 👋`}
            </h2>
            <p className="text-md text-muted-foreground">
              Time to cook something amazing! You have <span className="font-semibold text-primary">{stats.mealsPlanned}</span> meals planned this week.
            </p>
          </div>
        </PageHeaderContent>
      }
      contentClassName="flex flex-col"
    >
      {/* Stat Cards - fixed height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard
          icon={BookOpen}
          value={stats.totalRecipes}
          label="Total Recipes"
          colorClass="purple"
          isLoading={isLoading}
        />
        <StatCard
          icon={Heart}
          value={stats.favorites}
          label="Favorites"
          colorClass="pink"
          isLoading={isLoading}
        />
        <StatCard
          icon={UtensilsCrossed}
          value={stats.mealsPlanned}
          label="Meals Planned"
          colorClass="teal"
          isLoading={isLoading}
        />
        <StatCard
          icon={ShoppingCart}
          value={stats.shoppingItems}
          label="Shopping Items"
          colorClass="amber"
          isLoading={isLoading}
        />
      </div>

      {/* Streak + Chef's Tip */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-4 shrink-0">
        <CookingStreakWidget />
        <ChefTipWidget />
      </div>

      {/* Meal Carousel - full width */}
      <div className="mt-6 shrink-0">
        <MealCarouselWidget entries={plannerEntries} />
      </div>

      {/* Widgets Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shopping List */}
        <div className="widget-column">
          <div className="flex-1 min-h-0">
            <ShoppingListWidget shoppingData={shoppingData} />
          </div>
        </div>
        {/* Recipe Roulette + Quick Add */}
        <div className="widget-column">
          <div className="flex-1 min-h-0">
            <RecipeRouletteWidget />
          </div>
          <QuickAddForm variant="compact" />
        </div>
      </div>
    </PageLayout>
  );
}
