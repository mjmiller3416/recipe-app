"use client";

import Link from "next/link";
import { ChefHat, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlannerEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-elevated/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ChefHat className="h-8 w-8 text-primary" />
      </div>

      <h3 className="mb-2 text-xl font-semibold text-foreground">
        Your meal plan is empty!
      </h3>

      <p className="mb-6 max-w-sm text-muted">
        Add meals from your library to start planning your week. 
        <span className="block mt-1 text-sm italic">
          (Meal Library coming in the next update!)
        </span>
      </p>

      <Button asChild>
        <Link href="/recipes" className="inline-flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Browse Recipes
        </Link>
      </Button>
    </div>
  );
}