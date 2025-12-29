"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Save,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageLayout } from "@/components/layout/PageLayout";
import { DataManagementSection } from "@/components/settings/DataManagementSection";
import { useSettings, DEFAULT_SETTINGS } from "@/hooks/useSettings";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

import { CategoryNav, CATEGORIES, type SettingsCategory } from "./CategoryNav";
import { PlaceholderSection } from "./PlaceholderSection";
import { ProfileSection } from "./sections/ProfileSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { FeedbackSection } from "./sections/FeedbackSection";
import { AIFeaturesSection } from "./sections/AIFeaturesSection";
import { RecipePreferencesSection } from "./sections/RecipePreferencesSection";
import { UnitConversionsSection } from "./sections/UnitConversionsSection";

export function SettingsView() {
  const [activeCategory, setActiveCategory] =
    useState<SettingsCategory>("profile");
  const {
    settings,
    isLoaded,
    updateSettings,
    saveSettings,
    hasUnsavedChanges,
    discardChanges,
  } = useSettings();

  const {
    showLeaveDialog,
    setShowLeaveDialog,
    confirmLeave,
    cancelLeave,
  } = useUnsavedChanges({
    isDirty: hasUnsavedChanges,
    onConfirmLeave: discardChanges,
  });

  // Handle save
  const handleSave = () => {
    try {
      saveSettings();
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  // Handle reset current section
  const handleResetSection = () => {
    // Feedback section doesn't have persistent settings
    if (activeCategory === "feedback") {
      toast.info("Feedback form has no saved settings to reset");
      return;
    }
    updateSettings(activeCategory, DEFAULT_SETTINGS[activeCategory]);
    toast.info(
      `${CATEGORIES.find((c) => c.id === activeCategory)?.label} reset to defaults`
    );
  };

  // Render the active category content
  const renderCategoryContent = () => {
    switch (activeCategory) {
      case "profile":
        return (
          <ProfileSection
            displayName={settings.profile.displayName}
            email={settings.profile.email}
            avatar={settings.profile.avatar}
            onDisplayNameChange={(value) =>
              updateSettings("profile", { displayName: value })
            }
            onEmailChange={(value) =>
              updateSettings("profile", { email: value })
            }
            onAvatarChange={(value) =>
              updateSettings("profile", { avatar: value })
            }
          />
        );

      case "appearance":
        return (
          <AppearanceSection
            theme={settings.appearance.theme}
            onThemeChange={(value) =>
              updateSettings("appearance", { theme: value })
            }
          />
        );

      case "mealPlanning":
        return (
          <PlaceholderSection
            icon={CalendarDays}
            title="Meal Planning"
            description="Configure default serving sizes, week start day, and meal types"
          />
        );

      case "recipePreferences":
        return (
          <RecipePreferencesSection
            quickFilters={settings.recipePreferences.quickFilters}
            onQuickFiltersChange={(filters) =>
              updateSettings("recipePreferences", { quickFilters: filters })
            }
          />
        );

      case "shoppingList":
        return <UnitConversionsSection />;

      case "dataManagement":
        return <DataManagementSection />;

      case "aiFeatures":
        return (
          <AIFeaturesSection
            imageGenerationPrompt={settings.aiFeatures.imageGenerationPrompt}
            onPromptChange={(value) =>
              updateSettings("aiFeatures", { imageGenerationPrompt: value })
            }
            onResetPrompt={() =>
              updateSettings("aiFeatures", {
                imageGenerationPrompt:
                  DEFAULT_SETTINGS.aiFeatures.imageGenerationPrompt,
              })
            }
          />
        );

      case "feedback":
        return <FeedbackSection />;

      default:
        return null;
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        title="Settings"
        description="Manage your preferences and account settings"
        actions={
          <>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 mr-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-muted">Unsaved changes</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSection}
              className="gap-2 text-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Section
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Category Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <CategoryNav
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                  />
                </CardContent>
              </Card>

              {/* Version Info */}
              <div className="mt-4 px-4 py-3 text-center">
                <p className="text-xs text-muted">Meal Genie v1.0.0</p>
                <p className="text-xs text-muted/70 mt-1">Made with ❤️</p>
              </div>
            </div>
          </div>

          {/* Right Content - Settings Form */}
          <div className="lg:col-span-3 space-y-6">{renderCategoryContent()}</div>
        </div>
      </PageLayout>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your settings. Are you sure you want
              to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>
              Keep Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="bg-secondary hover:bg-secondary/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
