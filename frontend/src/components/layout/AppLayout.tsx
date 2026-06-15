"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AssistantPopup } from "@/components/assistant/AssistantPopup";
import { NavActionsProvider } from "@/lib/providers/NavActionsProvider";
import {
  RecipeWizardProvider,
  useRecipeWizardDialog,
} from "@/lib/providers/RecipeWizardProvider";
import { RecipeWizardView } from "@/app/recipes/_components/wizard/RecipeWizardView";

const subscribeNoop = () => () => {};
const getIsDesktop = () => window.innerWidth >= 768;
const getIsDesktopServer = () => false;

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  // Auto-show the minimized FAB on desktop only (mobile opens via More menu).
  // useSyncExternalStore avoids hydration mismatch by providing a server snapshot.
  const isDesktop = useSyncExternalStore(subscribeNoop, getIsDesktop, getIsDesktopServer);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isExplicitlyOpen, setIsExplicitlyOpen] = useState(false);

  // Show assistant if: user explicitly opened it, OR on desktop by default (until user closes it).
  const isAssistantOpen = hasUserInteracted ? isExplicitlyOpen : isDesktop;
  const setIsAssistantOpen = useCallback((open: boolean) => {
    setHasUserInteracted(true);
    setIsExplicitlyOpen(open);
  }, []);

  const { isOpen, setOpen, mode, editRecipeId, generatedSeed, seedKey } = useRecipeWizardDialog();

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
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavActionsProvider>
      <RecipeWizardProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </RecipeWizardProvider>
    </NavActionsProvider>
  );
}
