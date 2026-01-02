"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen print:block">
      <Sidebar />
      <MobileBottomNav />
      <main className="flex-1 md:ml-72 print:ml-0 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}