import { notFound } from "next/navigation";
import { FullRecipeView } from "./_components";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { id } = await params;

  // Non-numeric ids (e.g. the retired /recipes/add stub) get the branded 404
  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <FullRecipeView />;
}
