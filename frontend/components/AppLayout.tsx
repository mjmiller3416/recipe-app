"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }

    // Listen for changes to localStorage
    const handleStorageChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-window updates
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
