import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="overflow-x-clip">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 pt-16 pb-20 text-center sm:pt-24 lg:px-6">
        <div className="flex max-w-3xl flex-col items-center gap-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Save recipes. Plan the week.{" "}
            <span className="text-primary">The shopping list writes itself.</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Meal Genie keeps your recipes, weekly menu, and grocery run in one
            place — with AI that imports recipes from any URL or dreams up new ones.
          </p>
          <div className="flex items-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started free</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="relative w-full max-w-5xl">
          {/* Soft purple radial glow behind the screenshot (brand glow tokens exist, but this needs a large diffuse wash) */}
          <div
            aria-hidden
            className="absolute inset-x-8 top-8 -bottom-8 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-xl border border-border shadow-floating">
            <Image
              src="/images/landing/recipe-browser.png"
              alt="Meal Genie recipe browser showing a grid of saved recipes with search and filters"
              width={1440}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
