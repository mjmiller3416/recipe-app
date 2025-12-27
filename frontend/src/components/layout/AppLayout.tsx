"use client";

import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen print:block">
      <Sidebar />
      <main className="flex-1 ml-[280px] print:ml-0">
        {children}
      </main>
    </div>
  );
}