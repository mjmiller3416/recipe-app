"use client";

import { useState, useRef } from "react";
import {
  User,
  Palette,
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Database,
  Save,
  RotateCcw,
  Upload,
  Mail,
  Lock,
  Camera,
  Check,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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
import {
  PageHeader,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderActions,
} from "@/components/layout/PageHeader";
import { useSettings, DEFAULT_SETTINGS } from "@/hooks/useSettings";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type SettingsCategory =
  | "profile"
  | "appearance"
  | "mealPlanning"
  | "recipePreferences"
  | "shoppingList"
  | "dataManagement";

interface CategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES: CategoryConfig[] = [
  {
    id: "profile",
    label: "Account & Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Customize the look and feel",
  },
  {
    id: "mealPlanning",
    label: "Meal Planning",
    icon: CalendarDays,
    description: "Configure meal planning defaults",
  },
  {
    id: "recipePreferences",
    label: "Recipe Preferences",
    icon: ChefHat,
    description: "Set your recipe browsing preferences",
  },
  {
    id: "shoppingList",
    label: "Shopping List",
    icon: ShoppingCart,
    description: "Customize shopping list behavior",
  },
  {
    id: "dataManagement",
    label: "Data Management",
    icon: Database,
    description: "Export, import, and manage your data",
  },
];

// ============================================================================
// CATEGORY NAVIGATION COMPONENT
// ============================================================================

interface CategoryNavProps {
  categories: CategoryConfig[];
  activeCategory: SettingsCategory;
  onCategoryChange: (category: SettingsCategory) => void;
}

function CategoryNav({ categories, activeCategory, onCategoryChange }: CategoryNavProps) {
  return (
    <nav className="space-y-1">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted hover:text-foreground hover:bg-hover"
            )}
          >
            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", isActive && "text-primary-foreground")}>
                {category.label}
              </p>
              <p
                className={cn(
                  "text-xs truncate mt-0.5",
                  isActive ? "text-primary-foreground/70" : "text-muted"
                )}
              >
                {category.description}
              </p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor?: "primary" | "secondary";
}

function SectionHeader({ icon: Icon, title, description, accentColor = "primary" }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div
        className={cn(
          "p-2.5 rounded-xl",
          accentColor === "primary" ? "bg-primary/10" : "bg-secondary/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            accentColor === "primary" ? "text-primary" : "text-secondary"
          )}
        />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PLACEHOLDER SECTION COMPONENT
// ============================================================================

interface PlaceholderSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function PlaceholderSection({ icon: Icon, title, description }: PlaceholderSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={Icon} title={title} description={description} />
        <div className="bg-elevated rounded-xl p-8 text-center border border-dashed border-border">
          <div className="p-4 bg-secondary/10 rounded-full inline-flex mb-4">
            <Icon className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-muted text-sm">
            Settings for this section coming soon.
          </p>
          <p className="text-xs text-muted/70 mt-2">
            This feature is currently under development.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PROFILE SECTION
// ============================================================================

interface ProfileSectionProps {
  displayName: string;
  email: string;
  avatar: string;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onAvatarChange: (value: string) => void;
}

function ProfileSection({
  displayName,
  email,
  avatar,
  onDisplayNameChange,
  onEmailChange,
  onAvatarChange,
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a local URL. In production, this would upload to storage.
      const url = URL.createObjectURL(file);
      onAvatarChange(url);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={User}
          title="Account & Profile"
          description="Manage your personal information and account settings"
        />

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-elevated">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Profile Picture</h3>
              <p className="text-sm text-muted mt-1">
                Click on the avatar to upload a new image
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload New
              </Button>
            </div>
          </div>

          <Separator />

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted" />
              Display Name
            </Label>
            <Input
              id="display-name"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted">
              This name will be displayed throughout the app
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted">
              Used for account recovery and notifications
            </p>
          </div>

          <Separator />

          {/* Password Section (Placeholder) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted" />
              Password
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="password"
                value="••••••••"
                disabled
                className="max-w-md bg-elevated"
              />
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </div>
            <p className="text-xs text-muted">
              Password management will be available once authentication is connected
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// APPEARANCE SECTION
// ============================================================================

interface AppearanceSectionProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (value: "light" | "dark" | "system") => void;
}

function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps) {
  const themeOptions = [
    { value: "light", label: "Light", icon: Sun, description: "Light background with dark text" },
    { value: "dark", label: "Dark", icon: Moon, description: "Dark background with light text" },
    { value: "system", label: "System", icon: Monitor, description: "Follow system preferences" },
  ] as const;

  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader
          icon={Palette}
          title="Appearance"
          description="Customize how Meal Genie looks on your device"
          accentColor="secondary"
        />

        <div className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-muted" />
              Theme
            </Label>
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => onThemeChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-secondary bg-secondary/10 shadow-md"
                        : "border-border hover:border-muted hover:bg-hover"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-lg",
                        isSelected ? "bg-secondary/20" : "bg-elevated"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected ? "text-secondary" : "text-muted"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-foreground" : "text-muted"
                      )}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-secondary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">
              Choose your preferred color scheme
            </p>
          </div>

          <Separator />

          {/* Future: Accent Color, Font Size, etc. */}
          <div className="bg-elevated rounded-xl p-6 text-center border border-dashed border-border">
            <p className="text-sm text-muted">
              More appearance options coming soon
            </p>
            <p className="text-xs text-muted/70 mt-1">
              Accent colors, font sizes, and more
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN SETTINGS PAGE
// ============================================================================

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("profile");
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
    handleNavigation,
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
    updateSettings(activeCategory, DEFAULT_SETTINGS[activeCategory]);
    toast.info(`${CATEGORIES.find((c) => c.id === activeCategory)?.label} reset to defaults`);
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
            onDisplayNameChange={(value) => updateSettings("profile", { displayName: value })}
            onEmailChange={(value) => updateSettings("profile", { email: value })}
            onAvatarChange={(value) => updateSettings("profile", { avatar: value })}
          />
        );

      case "appearance":
        return (
          <AppearanceSection
            theme={settings.appearance.theme}
            onThemeChange={(value) => updateSettings("appearance", { theme: value })}
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
          <PlaceholderSection
            icon={ChefHat}
            title="Recipe Preferences"
            description="Set measurement units, dietary restrictions, and browsing preferences"
          />
        );

      case "shoppingList":
        return (
          <PlaceholderSection
            icon={ShoppingCart}
            title="Shopping List"
            description="Customize category sorting, auto-clear behavior, and duplicate handling"
          />
        );

      case "dataManagement":
        return (
          <PlaceholderSection
            icon={Database}
            title="Data Management"
            description="Export recipes, import data, and manage backups"
          />
        );

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle
            title="Settings"
            description="Manage your preferences and account settings"
          />
          <PageHeaderActions>
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
          </PageHeaderActions>
        </PageHeaderContent>
      </PageHeader>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your settings. Are you sure you want to leave? Your
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLeave}>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-secondary hover:bg-secondary/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}