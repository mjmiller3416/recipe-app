import { BookOpen, CalendarDays, ShoppingCart, type LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
}

// The core loop — same icons the in-app nav uses for these pages
const STEPS: Step[] = [
  {
    icon: BookOpen,
    title: "Save recipes",
    body: "Type them in, import from any URL, or let Meal Genie generate one for you.",
  },
  {
    icon: CalendarDays,
    title: "Plan your week",
    body: "Drag meals into your weekly menu — mains, sides, and servings included.",
  },
  {
    icon: ShoppingCart,
    title: "Shop once",
    body: "Your shopping list builds itself from the plan, aggregated and sorted by aisle.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 lg:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            How it works
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Three steps from &ldquo;what&apos;s for dinner?&rdquo; to a finished grocery run.
          </p>
        </div>

        <ol className="grid gap-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-surface text-primary">
                  <step.icon className="size-7" strokeWidth={1.5} />
                </div>
                <span
                  aria-hidden
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="max-w-xs text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
