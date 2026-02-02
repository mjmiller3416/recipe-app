# Component Inventory

**CRITICAL: Always check this inventory before creating new components.**

## Available shadcn/ui Components

These components are already installed and MUST be reused:

### Form & Input
- `<Input>` - Text inputs
- `<Textarea>` - Multi-line text
- `<Select>` - Dropdown selection
- `<Checkbox>` - Checkbox input
- `<RadioGroup>` - Radio button groups
- `<Switch>` - **Toggle switch (DO NOT create custom toggles)**
- `<Label>` - Form labels
- `<Form>` - Form wrapper with validation

### Layout
- `<Card>` - Container with elevation
- `<Separator>` - Horizontal/vertical dividers
- `<ScrollArea>` - Scrollable containers
- `<Tabs>` - Tab navigation
- `<Dialog>` - Modal dialogs
- `<Sheet>` - Side panels
- `<Popover>` - Floating content
- `<DropdownMenu>` - Dropdown menus

### Feedback
- `<Button>` - All button types
- `<Badge>` - Status badges
- `<Alert>` - Alert messages
- `<Toast>` - Notifications
- `<Skeleton>` - Loading states
- `<Progress>` - Progress bars

### Data Display
- `<Table>` - Data tables
- `<Avatar>` - User avatars
- `<Tooltip>` - Hover tooltips

## Custom Project Components

These exist in `frontend/src/components/` - **reuse before creating new:**

### Recipe Domain (`components/recipe/`)
- `RecipeCard` - Recipe list item display (supports multiple display modes)
- `RecipeImage` - Recipe image with fallback
- `RecipeBadge` - Category/meal-type badge
- `RecipeBannerImage` - Full-width banner image

### Meal Genie Domain (`components/meal-genie/`)
- `MealGenieAssistant` - AI chat assistant wrapper
- `MealGenieChatContent` - Chat message display
- `MealGeniePopup` - Floating chat popup

### Settings Domain (`components/settings/`)
- `DataManagementSection` - Data import/export/backup settings
  - `_components/data-management/BackupRestore` - Backup & restore UI
  - `_components/data-management/DeleteData` - Data deletion UI
  - `_components/data-management/ExportImport` - CSV export/import UI

### Common Components (`components/common/`)
- `FilterBar` - Reusable filter bar
- `FilterSidebar` - Sidebar with filters
- `StatsCard` - Statistics display card
- `FeedbackDialog` - User feedback dialog
- `CircularImage` - Circular image display
- `FavoriteButton` - Favorite toggle button
- `IconButton` - Icon button wrapper
- `ScrollableCardList` - Horizontally scrollable card list
- `ThemeToggle` - Dark/light theme toggle
- `SafeLink` - Safe external link

### Layout Components (`components/layout/`)
- `AppLayout` / `ConditionalAppLayout` - App shell layout
- `Sidebar` / `SidebarContent` - Side navigation
- `PageHeader` - Page title + actions
- `PageLayout` - Standardized page wrapper
- `MobileBottomNav` - Mobile bottom navigation
- `NavButton` - Navigation button
- `RecentRecipeChip` - Recent recipe quick-access chip
- `Logo` - App logo

### Form Components (`components/forms/`)
- `QuantityInput` - Ingredient quantity input (fractions, decimals)
- `SmartIngredientInput` - Autocomplete ingredient input

### Auth Components (`components/auth/`)
- `SignInForm` - Sign-in form
- `SignUpForm` - Sign-up form
- `UserMenu` - User dropdown menu

## Pre-Flight Checklist

Before creating ANY new component:

1. **Check shadcn/ui** - Does it exist there? (95% of the time, yes)
2. **Check component inventory above** - Does a custom version exist?
3. **Search codebase** - `grep -r "export.*function ComponentName"`
4. **If similar exists** - Extend it with props, don't duplicate
5. **If truly new** - Document it here after creating

## Common Violations

❌ Creating custom `<Toggle>` when `<Switch>` exists
❌ Creating custom `<Modal>` when `<Dialog>` exists
❌ Creating custom `<Dropdown>` when `<DropdownMenu>` exists
❌ Creating custom `<Loading>` when `<Skeleton>` exists
❌ Creating second `RecipeCard` variant instead of adding props

✅ Use existing components with customization props
✅ Extend existing components, don't duplicate
✅ Check inventory FIRST, code SECOND
