import Image from "next/image";
import { Check, Globe, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DemoRecipeCard } from "./DemoRecipeCard";
import { RIBEYE_STEAK, SHRIMP_PASTA } from "./data";

// Small illustrative UI slices for the "How it works" steps. The same recipe
// (the shrimp pasta from the hero) travels through all three: it gets saved,
// lands on Tuesday, and its ingredients show up on the shopping list.
// All decorative — the parent section wraps them in aria-hidden.

/** Step 1 — a recipe arrives from a URL and becomes a saved card. */
export function SaveVignette() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-raised">
        <Globe className="size-3 shrink-0 text-primary" strokeWidth={1.5} />
        <span className="truncate text-xs text-muted-foreground">
          grandmas-kitchen.com/shrimp-pasta
        </span>
      </div>
      <DemoRecipeCard recipe={SHRIMP_PASTA} badge="imported" compact imageSizes="240px" />
    </div>
  );
}

/** Step 2 — the saved card slotted into a weekday. */
export function PlanVignette() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <PlanRow day="Mon" recipe={RIBEYE_STEAK} />
      <PlanRow day="Tue" recipe={SHRIMP_PASTA} highlighted />
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border-strong px-3 py-2">
        <span className="w-8 shrink-0 text-xs font-medium text-muted-foreground">Wed</span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Plus className="size-4" strokeWidth={1.5} />
          Add meal
        </span>
      </div>
    </div>
  );
}

function PlanRow({
  day,
  recipe,
  highlighted = false,
}: {
  day: string;
  recipe: { name: string; image: string; time: string };
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-2 shadow-raised",
        highlighted ? "border-primary" : "border-border"
      )}
    >
      <span className="w-8 shrink-0 text-xs font-medium text-muted-foreground">{day}</span>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-elevated">
        <Image src={recipe.image} alt="" fill sizes="36px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{recipe.name}</span>
        <span className="block text-xs text-muted-foreground">{recipe.time}</span>
      </span>
    </div>
  );
}

/** Step 3 — the pasta's ingredients, already on the list. */
export function ShopVignette() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <ShopRow name="Shrimp" qty="1 lb" checked />
      <ShopRow name="Spaghetti" qty="12 oz" checked />
      <ShopRow name="Garlic" qty="2 heads" />
      <ShopRow name="Cherry tomatoes" qty="1 pint" />
    </div>
  );
}

export function ShopRow({
  name,
  qty,
  source,
  checked = false,
}: {
  name: string;
  qty: string;
  source?: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-raised">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
        )}
      >
        {checked && <Check className="size-3" strokeWidth={2} />}
      </span>
      <Badge variant="plain" size="sm" className="shrink-0 bg-primary-surface text-primary-on-surface">
        {qty}
      </Badge>
      <span className="min-w-0 flex-1 text-left">
        <span
          className={cn(
            "block truncate text-sm font-medium",
            checked ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {name}
        </span>
        {source && <span className="block truncate text-xs text-muted-foreground">{source}</span>}
      </span>
    </div>
  );
}
