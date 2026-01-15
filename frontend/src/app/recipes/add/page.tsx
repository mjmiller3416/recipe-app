import { Suspense } from "react";
import { AddEditRecipeView } from "../_components";

export default function AddRecipePage() {
  return (
    <Suspense>
      <AddEditRecipeView mode="add" />
    </Suspense>
  );
}
