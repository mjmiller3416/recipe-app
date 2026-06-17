"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecipeWizardDialog } from "@/lib/providers/RecipeWizardProvider";

/**
 * Redirect page for /recipes/add.
 *
 * The recipe wizard is now a global dialog mounted in AppLayout.
 * When users navigate to this URL (e.g. via AI assistant or bookmark),
 * we open the wizard dialog and redirect to /recipes so they aren't
 * left on a blank page.
 */
export default function AddRecipePage() {
  const router = useRouter();
  const { openWizard } = useRecipeWizardDialog();

  useEffect(() => {
    openWizard();
    router.replace("/recipes");
  }, [openWizard, router]);

  return null;
}
