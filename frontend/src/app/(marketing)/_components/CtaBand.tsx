import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center lg:px-6">
        <h2
          id="cta-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          This week&apos;s meals, planned in minutes.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Free to use — save your first recipe and plan your first week tonight.
        </p>
        <Button asChild size="lg">
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </section>
  );
}
