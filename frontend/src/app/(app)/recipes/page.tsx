import type { Metadata } from "next";
import { Suspense } from "react";
import { RecipeBrowserView } from "@/components/recipe/RecipeBrowserView";
import { RecipeBrowserSkeleton } from "@/components/recipe/browser/RecipeBrowserSkeleton";

export const metadata: Metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipeBrowserSkeleton />}>
      <RecipeBrowserView />
    </Suspense>
  );
}
