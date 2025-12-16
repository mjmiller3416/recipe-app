"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

// Initialize from localStorage during module load (client-side only)
function getInitialCollapsedState() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem("sidebar-collapsed");
  return saved !== null ? JSON.parse(saved) : false;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebar-toggle", handleStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebar-toggle", handleStorageChange as EventListener);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-20" : "ml-[280px]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}