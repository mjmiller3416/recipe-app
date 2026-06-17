"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AssistantPopup } from "@/components/assistant/AssistantPopup";
import { NavActionsProvider } from "@/lib/providers/NavActionsProvider";
import {
  RecipeWizardProvider,
  useRecipeWizardDialog,
} from "@/lib/providers/RecipeWizardProvider";
import {
  MealCreationProvider,
  useMealCreationDialog,
} from "@/lib/providers/MealCreationProvider";
import { RecipeWizardView } from "@/app/recipes/_components/wizard/RecipeWizardView";
import { MealCreationOverlay } from "@/app/meal-planner/_components/MealCreationOverlay";
import { ScrollToTopButton } from "@/components/common/ScrollToTopButton";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const { isOpen, setOpen, mode, editRecipeId, generatedSeed, seedKey } = useRecipeWizardDialog();
  const { isOpen: mealCreationOpen, setOpen: setMealCreationOpen } = useMealCreationDialog();

  return (
    <div className="flex flex-col min-h-screen print:block print:min-h-0">
      <TopNav onOpenAssistant={() => setIsAssistantOpen(true)} />
      <MobileBottomNav onOpenAssistant={() => setIsAssistantOpen(true)} />
      <main className="flex-1 pb-20 md:pb-0 print:pb-0">
        {children}
      </main>
      <AssistantPopup open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
      <RecipeWizardView
        key={
          mode === "edit"
            ? `edit-${editRecipeId}`
            : generatedSeed
              ? `gen-${seedKey}`
              : "create"
        }
        open={isOpen}
        onOpenChange={setOpen}
        mode={mode}
        recipeId={editRecipeId}
        initialGenerated={generatedSeed}
      />
      <MealCreationOverlay open={mealCreationOpen} onOpenChange={setMealCreationOpen} />
      <ScrollToTopButton />
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavActionsProvider>
      <RecipeWizardProvider>
        <MealCreationProvider>
          <AppLayoutInner>{children}</AppLayoutInner>
        </MealCreationProvider>
      </RecipeWizardProvider>
    </NavActionsProvider>
  );
}
