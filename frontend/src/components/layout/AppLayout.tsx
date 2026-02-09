"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AssistantPopup } from "@/components/assistant";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);

  return (
    <div className="flex min-h-screen print:block print:min-h-0">
      <Sidebar onOpenAssistant={() => setIsAssistantOpen(true)} />
      <MobileBottomNav onOpenAssistant={() => setIsAssistantOpen(true)} />
      <main className="flex-1 md:ml-72 print:ml-0 pb-20 md:pb-0 print:pb-0">
        {children}
      </main>
      <AssistantPopup open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
    </div>
  );
}