"use client";

import { useState } from "react";
import { Shield, MessageSquareMore } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/api";
import { AdminUsersSection } from "./AdminUsersSection";
import { AdminFeedbackSection } from "./AdminFeedbackSection";

type AdminTab = "users" | "feedback";

interface TabConfig {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "users",
    label: "User Management",
    icon: Shield,
    description: "Manage users and access levels",
  },
  {
    id: "feedback",
    label: "Feedback Dashboard",
    icon: MessageSquareMore,
    description: "Review user feedback and reports",
  },
];

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const { isAdmin, isLoading } = useCurrentUser();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Block non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don&apos;t have admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <AdminUsersSection />;
      case "feedback":
        return <AdminFeedbackSection />;
      default:
        return null;
    }
  };

  return (
    <PageLayout
      title="Admin Panel"
      description="Manage users, access levels, and review feedback."
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Tab Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full h-auto flex items-center gap-3 px-4 py-3 rounded-xl text-left justify-start transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                            : "text-muted-foreground hover:text-foreground hover:bg-hover"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-5 flex-shrink-0",
                            isActive && "text-primary-foreground"
                          )}
                          strokeWidth={1.5}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isActive && "text-primary-foreground"
                            )}
                          >
                            {tab.label}
                          </p>
                          <p
                            className={cn(
                              "text-xs truncate mt-0.5",
                              isActive
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {tab.description}
                          </p>
                        </div>
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-6">{renderContent()}</div>
      </div>
    </PageLayout>
  );
}
