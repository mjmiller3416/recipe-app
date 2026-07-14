"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Heart, UtensilsCrossed } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeaderContent } from "@/components/layout/PageHeader";
import { MealCarouselWidget } from "./carousel";
import { ShoppingListWidget } from "./ShoppingListWidget";
import { ChefTipWidget } from "./ChefTipWidget";
import { CookingStreakWidget } from "./CookingStreakWidget";
import { RecipeRouletteWidget } from "./RecipeRouletteWidget";
import { TonightCard } from "./TonightCard";
import { GetStartedCard, GetStartedBanner } from "./GetStartedCard";
import { useDashboardStats, usePlannerEntries, useShoppingList } from "@/hooks/api";
import { useGetStartedComplete } from "@/hooks/persistence";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * HomeView — today-first Home for all devices.
 * Tonight hero → shopping status → This Week strip → secondary widgets,
 * with a guided GetStarted flow for brand-new users.
 */
export function HomeView() {
  const { user } = useUser();

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const {
    data: plannerEntries,
    isLoading: plannerLoading,
    error: plannerError,
    refetch: refetchPlanner,
  } = usePlannerEntries();
  const {
    data: shoppingData,
    isLoading: shoppingLoading,
    error: shoppingError,
    refetch: refetchShopping,
  } = useShoppingList();

  const [setupComplete, setSetupComplete, setupLoaded] = useGetStartedComplete();

  const entries = useMemo(() => plannerEntries ?? [], [plannerEntries]);

  const activeEntries = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.position - b.position)
        .filter((e) => !e.is_completed),
    [entries]
  );
  const tonight = activeEntries[0] ?? null;
  const completedCount = entries.length - activeEntries.length;

  const totalRecipes = statsData?.total_recipes ?? 0;
  const favorites = statsData?.favorites ?? 0;

  // Once the user has planned a meal, the first-run flow is done for good.
  useEffect(() => {
    if (setupLoaded && !setupComplete && entries.length > 0) {
      setSetupComplete(true);
    }
  }, [setupLoaded, setupComplete, entries.length, setSetupComplete]);

  const dataReady = !statsLoading && !plannerLoading && !!statsData;
  const showGetStarted =
    dataReady && totalRecipes === 0 && entries.length === 0;
  const showProgressBanner =
    dataReady &&
    setupLoaded &&
    !setupComplete &&
    totalRecipes > 0 &&
    entries.length === 0;
  // Strip only appears when it has something to show beyond the Tonight card
  const showWeekStrip =
    !plannerLoading &&
    (activeEntries.length > 1 || (completedCount > 0 && entries.length > 0));

  const firstName = user?.firstName || "there";
  const hasError = statsError || plannerError || shoppingError;

  // State-aware subtitle — no fake enthusiasm over zeros
  const subtitle = plannerLoading ? null : activeEntries.length > 0 ? (
    <>
      You have{" "}
      <span className="font-semibold text-primary">{activeEntries.length}</span>{" "}
      meal{activeEntries.length === 1 ? "" : "s"} planned this week.
    </>
  ) : completedCount > 0 ? (
    <>
      All caught up —{" "}
      <span className="font-semibold text-primary">{completedCount}</span> meal
      {completedCount === 1 ? "" : "s"} cooked this week. 🎉
    </>
  ) : (
    <>Let&apos;s plan your week.</>
  );

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
            Failed to load your Home data. Please try again.
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
            {subtitle ? (
              <p className="text-md text-muted-foreground">{subtitle}</p>
            ) : (
              <Skeleton className="h-5 w-64" />
            )}
          </div>

          {/* Recipe / favorites chips */}
          {statsLoading ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Skeleton className="h-8 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
          ) : totalRecipes > 0 ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="outline" size="sm" shape="pill" asChild>
                <Link
                  href="/recipes"
                  aria-label={`${totalRecipes} recipes`}
                >
                  <BookOpen className="size-4" strokeWidth={1.5} />
                  {totalRecipes}
                </Link>
              </Button>
              <Button variant="outline" size="sm" shape="pill" asChild>
                <Link
                  href="/recipes?favoritesOnly=true"
                  aria-label={`${favorites} favorite recipes`}
                >
                  <Heart className="size-4" strokeWidth={1.5} />
                  {favorites}
                </Link>
              </Button>
            </div>
          ) : null}
        </PageHeaderContent>
      }
      contentClassName="flex flex-col"
    >
      {showGetStarted ? (
        <GetStartedCard
          recipesDone={totalRecipes > 0}
          planDone={entries.length > 0}
        />
      ) : (
        <>
          {showProgressBanner && (
            <div className="mb-6 shrink-0">
              <GetStartedBanner />
            </div>
          )}

          {/* Tonight hero + shopping status */}
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
              <TonightCard entry={tonight} isLoading={plannerLoading} />
            </div>
            <ShoppingListWidget
              shoppingData={shoppingData}
              isLoading={shoppingLoading}
            />
          </div>

          {/* This Week strip */}
          {showWeekStrip && (
            <div className="mt-6 shrink-0">
              <MealCarouselWidget
                entries={entries}
                excludeEntryId={tonight?.id ?? null}
              />
            </div>
          )}

          {/* Secondary row — garnish below the fold */}
          <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <CookingStreakWidget />
            <ChefTipWidget />
            <div className="md:col-span-2 lg:col-span-1">
              <RecipeRouletteWidget />
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}
