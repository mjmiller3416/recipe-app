import Image from "next/image";
import { Clock, Heart, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DemoRecipe } from "./data";

interface DemoRecipeCardProps {
  recipe: DemoRecipe;
  /** Provenance badge, mirrors RecipeBadge colors (ai → chart-6, imported → chart-5) */
  badge?: "ai" | "imported";
  isFavorite?: boolean;
  /** Tighter paddings/text for small vignettes */
  compact?: boolean;
  /** Passed straight to next/image; set to the rendered CSS width */
  imageSizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Static, non-interactive replica of the in-app RecipeCard (medium variant).
 * The landing page renders these instead of screenshots so the showcase is
 * crisp, theme-aware, and visually identical to what users get after sign-up.
 * Purely decorative — parents wrap vignettes in aria-hidden.
 */
export function DemoRecipeCard({
  recipe,
  badge,
  isFavorite = false,
  compact = false,
  imageSizes = "320px",
  priority = false,
  className,
}: DemoRecipeCardProps) {
  return (
    <Card className={cn("gap-0 overflow-hidden pt-0 pb-0", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-elevated">
        <Image
          src={recipe.image}
          alt=""
          fill
          sizes={imageSizes}
          priority={priority}
          className="object-cover"
        />
        <div className={cn("absolute flex items-center gap-1.5", compact ? "top-2 left-2" : "top-3 left-3")}>
          {recipe.mealType && (
            <Badge variant="plain" size={compact ? "sm" : "default"} className="bg-secondary/90 text-secondary-foreground">
              {recipe.mealType}
            </Badge>
          )}
          {badge === "ai" && (
            <Badge variant="plain" size={compact ? "sm" : "default"} className="bg-chart-6 text-primary-foreground">
              <Sparkles strokeWidth={1.5} />
              AI
            </Badge>
          )}
          {badge === "imported" && (
            <Badge variant="plain" size={compact ? "sm" : "default"} className="bg-chart-5 text-primary-foreground">
              Imported
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm",
            compact ? "top-2 right-2 size-6" : "top-3 right-3 size-8"
          )}
        >
          <Heart
            className={cn(
              compact ? "size-3" : "size-4",
              isFavorite ? "fill-destructive text-destructive" : "text-foreground"
            )}
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className={cn("flex flex-col", compact ? "gap-1 p-3" : "gap-2 p-4")}>
        <h3 className={cn("truncate text-left font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
          {recipe.name}
        </h3>
        <div className={cn("flex items-center text-muted-foreground", compact ? "gap-2 text-xs" : "gap-3 text-sm")}>
          <span className="flex items-center gap-1.5">
            <Users className={cn("text-primary", compact ? "size-3" : "size-4")} strokeWidth={1.5} />
            {recipe.servings} servings
          </span>
          <span className={cn("w-px bg-border", compact ? "h-3" : "h-4")} />
          <span className="flex items-center gap-1.5">
            <Clock className={cn("text-primary", compact ? "size-3" : "size-4")} strokeWidth={1.5} />
            {recipe.time}
          </span>
        </div>
      </div>
    </Card>
  );
}
