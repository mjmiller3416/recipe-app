"use client";

import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AssistantPopup } from "@/components/assistant/AssistantPopup";
import { NavActionsProvider } from "@/lib/providers/NavActionsProvider";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  return (
    <NavActionsProvider>
      <div className="flex flex-col min-h-screen print:block print:min-h-0">
        <TopNav onOpenAssistant={() => setIsAssistantOpen(true)} />
        <MobileBottomNav onOpenAssistant={() => setIsAssistantOpen(true)} />
        <main className="flex-1 pb-20 md:pb-0 print:pb-0">
          {children}
        </main>
        <AssistantPopup open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
      </div>
    </NavActionsProvider>
  );
}