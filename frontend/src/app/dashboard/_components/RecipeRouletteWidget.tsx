"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, RefreshCw, Clock, Users, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipeCards } from "@/hooks/api";
import { RecipeBannerImage } from "@/components/recipe/RecipeBannerImage";
import { formatTime } from "@/lib/quantityUtils";
import type { RecipeCardDTO } from "@/types/recipe";

// Animation variants
const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } },
};

const metadataVariants = {
  initial: { opacity: 0, y: 5 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.2,
      ease: "easeOut" as const,
    },
  }),
};

export function RecipeRouletteWidget() {
  const router = useRouter();
  const { data: recipes = [], isLoading } = useRecipeCards();
  const [currentRecipe, setCurrentRecipe] = useState<RecipeCardDTO | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayKey, setDisplayKey] = useState(0); // Forces re-animation
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pick a random recipe, avoiding the current one if possible
  const pickRandomRecipe = useCallback(
    (recipeList: RecipeCardDTO[], currentId?: number) => {
      if (recipeList.length === 0) return null;
      if (recipeList.length === 1) return recipeList[0];

      const available = currentId
        ? recipeList.filter((r) => r.id !== currentId)
        : recipeList;

      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    },
    []
  );

  // Initialize currentRecipe when recipes first load
  const initializedRef = useRef(false);
  if (!initializedRef.current && recipes.length > 0 && !currentRecipe) {
    initializedRef.current = true;
    setCurrentRecipe(pickRandomRecipe(recipes));
  }

  // Handle spin with slot machine effect
  const handleSpin = () => {
    if (recipes.length <= 1 || isSpinning) return;

    setIsSpinning(true);

    // Determine final recipe before cycling
    const finalRecipe = pickRandomRecipe(recipes, currentRecipe?.id);

    // Slot machine cycling effect
    let cycleCount = 0;
    const totalCycles = 8; // Number of recipes to flash through
    const baseInterval = 60; // Starting speed (ms)

    const cycle = () => {
      cycleCount++;

      // Pick random recipe for visual cycling
      const cycleRecipe = pickRandomRecipe(recipes, currentRecipe?.id);
      setCurrentRecipe(cycleRecipe);
      setDisplayKey((prev) => prev + 1);

      if (cycleCount < totalCycles) {
        // Gradually slow down the cycling (easing out)
        const slowdown = Math.pow(cycleCount / totalCycles, 1.5);
        const nextInterval = baseInterval + slowdown * 150;

        spinIntervalRef.current = setTimeout(cycle, nextInterval);
      } else {
        // Land on final recipe
        setCurrentRecipe(finalRecipe);
        setDisplayKey((prev) => prev + 1);
        setIsSpinning(false);
      }
    };

    // Start cycling
    spinIntervalRef.current = setTimeout(cycle, baseInterval);
  };

  // Navigate to recipe detail
  const handleViewRecipe = () => {
    if (currentRecipe) {
      router.push(`/recipes/${currentRecipe.id}`);
    }
  };

  return (
    <Card className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isSpinning ? { rotate: [0, 15, -15, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Dices className="h-5 w-5 text-chart-4" />
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground">
            Recipe Roulette
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSpin}
          disabled={isSpinning || recipes.length <= 1}
          className="button-bouncy"
          aria-label="Spin for a new recipe"
        >
          <motion.div
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              duration: 0.6,
              repeat: isSpinning ? Infinity : 0,
              ease: "linear",
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </motion.div>
          <span className="text-xs ml-1">Spin</span>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RouletteWidgetSkeleton />
      ) : recipes.length === 0 ? (
        <EmptyState />
      ) : currentRecipe ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={displayKey}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* Recipe Image - flexible height */}
            <div
              className="relative rounded-lg overflow-hidden bg-background mb-3 cursor-pointer group"
              onClick={handleViewRecipe}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <RecipeBannerImage
                  bannerSrc={currentRecipe.banner_image_path}
                  fallbackSrc={currentRecipe.reference_image_path}
                  alt={currentRecipe.recipe_name}
                  aspectRatio="16/9"
                />
              </motion.div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />

              {/* Shimmer effect on landing */}
              {!isSpinning && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
            </div>

            {/* Recipe Info */}
            <motion.h4
              className="shrink-0 text-sm font-semibold text-foreground line-clamp-1 mb-2 cursor-pointer hover:text-primary transition-colors"
              onClick={handleViewRecipe}
              variants={metadataVariants}
              custom={0}
              initial="initial"
              animate="animate"
            >
              {currentRecipe.recipe_name}
            </motion.h4>

            {/* Metadata */}
            <motion.div
              className="shrink-0 flex items-center gap-3 text-xs text-muted-foreground mb-3"
              variants={metadataVariants}
              custom={1}
              initial="initial"
              animate="animate"
            >
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{currentRecipe.servings ?? "N/A"}</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(currentRecipe.total_time, "N/A")}</span>
              </div>
            </motion.div>

            {/* View Recipe Button */}
            <motion.div
              className="shrink-0"
              variants={metadataVariants}
              custom={2}
              initial="initial"
              animate="animate"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewRecipe}
                className="w-full"
              >
                View Recipe
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </Card>
  );
}

// Skeleton for loading state
function RouletteWidgetSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

// Empty state when no recipes exist
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <ChefHat className="h-10 w-10 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">No recipes yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Add some recipes to spin the wheel!
      </p>
    </div>
  );
}