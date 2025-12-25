"use client";

import { useParams } from "next/navigation";
import { AddEditRecipeView } from "../../_components";

export default function EditRecipePage() {
  const params = useParams();
  const recipeId = Number(params.id);

  return <AddEditRecipeView mode="edit" recipeId={recipeId} />;
}
