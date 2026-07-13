import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ShopRow } from "./StepVignettes";
import { BBQ_CHICKEN_BOWL, RIBEYE_STEAK, SHRIMP_PASTA, type DemoRecipe } from "./data";

// Larger product slices for the feature-highlight cards. Decorative — the
// parent wraps them in aria-hidden.

const WEEK: { day: string; recipe: DemoRecipe; highlighted?: boolean }[] = [
  { day: "Mon", recipe: RIBEYE_STEAK },
  { day: "Tue", recipe: SHRIMP_PASTA, highlighted: true },
  { day: "Wed", recipe: BBQ_CHICKEN_BOWL },
];

/** A slice of the weekly planner: three days of meal cards. */
export function PlannerVignette() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">This week</span>
        <span className="text-xs text-muted-foreground">3 of 7 nights planned</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {WEEK.map(({ day, recipe, highlighted }) => (
          <div key={day} className="flex flex-col gap-1.5">
            <span
              className={cn(
                "text-center text-xs font-medium",
                highlighted ? "text-primary" : "text-muted-foreground"
              )}
            >
              {day}
            </span>
            <Card
              className={cn(
                "gap-0 overflow-hidden pt-0 pb-0",
                highlighted && "border-primary"
              )}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-elevated">
                <Image src={recipe.image} alt="" fill sizes="160px" className="object-cover" />
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <span className="truncate text-xs font-medium text-foreground">{recipe.name}</span>
                <span className="text-xs text-muted-foreground">
                  {recipe.servings} servings · {recipe.time}
                </span>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A slice of the shopping list: aggregated items with sources and progress. */
export function ShoppingVignette() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">Produce</span>
        <span className="text-xs text-muted-foreground">2 of 5 collected</span>
      </div>
      <Progress value={40} className="h-1.5" />
      <div className="flex flex-col gap-2">
        <ShopRow name="Baby potatoes" qty="3 lbs" source="from 2 recipes" checked />
        <ShopRow name="Cherry tomatoes" qty="1 pint" source="from Garlic Butter Shrimp Pasta" checked />
        <ShopRow name="Garlic" qty="2 heads" source="from 3 recipes" />
        <ShopRow name="Parsley" qty="1 bunch" source="from Garlic Butter Shrimp Pasta" />
      </div>
    </div>
  );
}
