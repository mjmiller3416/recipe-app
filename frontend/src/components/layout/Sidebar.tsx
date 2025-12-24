"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShoppingCart,
  Plus,
  Settings,
  MessageSquarePlus,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { NavButton } from "@/components/layout/NavButton";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { FeedbackDialog } from "@/components/common/FeedbackDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appConfig } from "@/lib/config";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDays },
  { name: "Recipe Browser", href: "/recipes", icon: BookOpen },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart },
  { name: "Add Recipe", href: "/recipes/add", icon: Plus },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-sidebar flex flex-col overflow-x-hidden overflow-y-auto print:hidden">
      {/* Top Section - App Branding */}
      <div className="flex items-center px-4 py-6 pb-8">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Logo className="w-10 h-10 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground whitespace-nowrap">
              {appConfig.appName}
            </h1>
          </div>
        </div>
      </div>

      {/* Middle Section - Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavButton
            key={item.href}
            icon={item.icon}
            label={item.name}
            href={item.href}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* Bottom Section - User Profile & Theme Toggle */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Feedback & Theme Toggle */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFeedbackOpen(true)}
                className="p-2.5 rounded-lg bg-elevated hover:bg-hover transition-colors group"
                aria-label="Send feedback"
              >
                <MessageSquarePlus className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Send feedback</TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        
        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-lg p-3 bg-elevated">
          <div className="relative flex-shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={appConfig.user.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {appConfig.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-status-online rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
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