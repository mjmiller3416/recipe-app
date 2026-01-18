"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MealGeniePopup } from "@/components/meal-genie";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMealGenieOpen, setIsMealGenieOpen] = useState(true);

  return (
    <div className="flex min-h-screen print:block print:min-h-0">
      <Sidebar onOpenMealGenie={() => setIsMealGenieOpen(true)} />
      <MobileBottomNav onOpenMealGenie={() => setIsMealGenieOpen(true)} />
      <main className="flex-1 md:ml-72 print:ml-0 pb-20 md:pb-0 print:pb-0">
        {children}
      </main>
      <MealGeniePopup open={isMealGenieOpen} onOpenChange={setIsMealGenieOpen} />
    </div>
  );
}