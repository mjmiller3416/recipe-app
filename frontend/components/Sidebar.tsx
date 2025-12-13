"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { NavButton } from "@/components/NavButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipe Browser", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart },
  { name: "Add Recipe", href: "/recipes/new", icon: Plus },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col overflow-x-hidden overflow-y-auto transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-[280px]"
      )}
    >
      {/* Top Section - App Branding */}
      <div className="flex items-center p-4 min-h-[72px]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors duration-200 flex-shrink-0 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <>
              <Logo className="w-10 h-10 text-primary flex-shrink-0" />
              <h1
                className={cn(
                  "text-xl font-semibold text-foreground whitespace-nowrap transition-opacity duration-300",
                  isCollapsed ? "opacity-0" : "opacity-100"
                )}
              >
                {appConfig.appName}
              </h1>
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-hover transition-colors duration-200 flex-shrink-0 ml-auto"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <Separator className="bg-elevated" />

      {/* Middle Section - Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavButton
            key={item.href}
            icon={item.icon}
            label={item.name}
            href={item.href}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <Separator className="bg-elevated" />

      {/* Bottom Section - User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg p-3 bg-elevated">
          <div className={cn("relative flex-shrink-0", isCollapsed && "mx-auto")}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={appConfig.user.avatar} />
              <AvatarFallback className="bg-primary text-[#1a1a1a]">
                {appConfig.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar" />
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-opacity duration-300",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}
          >
            <p className="text-sm font-medium text-foreground truncate">
              {appConfig.user.name}
            </p>
            <p className="text-xs text-muted">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
