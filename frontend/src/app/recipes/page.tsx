import { Suspense } from "react";
import { RecipeBrowserView } from "./_components";

export default function RecipesPage() {
  return (
    <Suspense>
      <RecipeBrowserView />
    </Suspense>
  );
}
