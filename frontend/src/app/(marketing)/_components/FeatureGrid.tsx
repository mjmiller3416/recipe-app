import Image from "next/image";
import { Wand2, Sparkles, Apple, Flame, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Highlight {
  image: string;
  alt: string;
  title: string;
  body: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

// Screenshot-backed highlight cards (dark theme, captured from the real app)
const HIGHLIGHTS: Highlight[] = [
  {
    image: "/images/landing/meal-planner.png",
    alt: "Meal Genie weekly planner with a full week of planned meals",
    title: "Weekly meal planner",
    body: "Line up the week's dinners in one board. Mains, sides, and servings — rearrange with a drag.",
  },
  {
    image: "/images/landing/shopping-list.png",
    alt: "Meal Genie shopping list with aggregated ingredients and check-off progress",
    title: "Auto-built shopping list",
    body: "Every planned meal feeds one list — quantities combined, sorted by aisle, checked off as you shop.",
  },
];

const FEATURES: Feature[] = [
  {
    icon: Wand2,
    title: "AI recipe generation & import",
    body: "Paste a URL or describe a dish — get a complete, editable recipe in seconds.",
  },
  {
    icon: Sparkles,
    title: "Meal Genie assistant",
    body: "A chat that drafts recipes, suggests meals, and answers cooking questions.",
  },
  {
    icon: Apple,
    title: "Nutrition facts",
    body: "Calories and macros for every recipe, estimated automatically.",
  },
  {
    icon: Flame,
    title: "Cooking streaks",
    body: "Track the nights you actually cook and keep the streak alive.",
  },
];

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="border-t border-border bg-background-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 lg:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Everything between recipe and dinner table
          </h2>
          <p className="max-w-xl text-muted-foreground">
            One app for the whole loop — saving, planning, shopping, and cooking.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {HIGHLIGHTS.map((highlight) => (
            <Card key={highlight.title} className="overflow-hidden">
              <div className="border-b border-border">
                <Image
                  src={highlight.image}
                  alt={highlight.alt}
                  width={1440}
                  height={900}
                  sizes="(max-width: 768px) 100vw, 552px"
                  className="h-auto w-full"
                />
              </div>
              <CardContent className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground">{highlight.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-surface text-primary">
                  <feature.icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
