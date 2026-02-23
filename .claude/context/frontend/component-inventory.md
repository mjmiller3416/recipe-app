# Component Inventory

**CRITICAL: Always check this inventory before creating new components.**

## Available shadcn/ui Components

These are installed in `components/ui/` and MUST be reused:

### Form & Input
- `<Input>` - Text inputs
- `<InputOTP>` - One-time password input
- `<Textarea>` - Multi-line text
- `<Select>` - Dropdown selection
- `<MultiSelect>` - Multi-value selection
- `<Checkbox>` - Checkbox input
- `<Switch>` - **Toggle switch (DO NOT create custom toggles)**
- `<Label>` - Form labels

### Layout & Overlay
- `<Card>` - Container (has `size`, `interactive` props; applies `flex-col` by default)
- `<Separator>` - Horizontal/vertical dividers
- `<ScrollArea>` - Scrollable containers
- `<Tabs>` - Tab navigation
- `<Dialog>` - Modal dialogs
- `<AlertDialog>` - Confirmation dialogs
- `<Sheet>` - Side panels
- `<Popover>` - Floating content
- `<DropdownMenu>` - Dropdown menus
- `<Command>` - Command palette / search
- `<Collapsible>` - Expandable sections
- `<Accordion>` - Expandable accordion panels

### Feedback & Display
- `<Button>` - All button types (variants: default, secondary, outline, ghost, destructive, link, dashed)
- `<Badge>` - Status badges (variants: default, secondary, outline, destructive, success, warning, info, muted)
- `<Sonner>` - Toast notifications
- `<Skeleton>` - Loading placeholders
- `<Avatar>` - User avatars
- `<Tooltip>` - Hover tooltips

## Custom Project Components

These exist in `frontend/src/components/` - **reuse before creating new:**

### Recipe Domain (`components/recipe/`)
- `RecipeCard` - Recipe list item display (supports multiple display modes)
- `RecipeImage` - Recipe image with fallback
- `RecipeBadge` - Category/meal-type badge
- `RecipeBannerImage` - Full-width banner image
- `RecipeBrowserView` - Recipe browse/search view (used by recipes page and meal planner)
  - `browser/RecipeFilters` - Filter sidebar for recipe browsing
  - `browser/RecipeGrid` - Recipe card grid display
  - `browser/RecipeSortControls` - Sort and filter controls bar

### Assistant Domain (`components/assistant/`)
- `Assistant` - AI chat assistant wrapper
- `AssistantChatContent` - Chat message display
- `AssistantPopup` - Floating chat popup
- `ChatMessageList` - Message list renderer

### Common Components (`components/common/`)
- `FilterBar` - Reusable filter bar
- `FilterSidebar` - Sidebar with filters
- `StatCard` - Statistics display card (uses chart color presets)
- `FeedbackDialog` - User feedback dialog
- `ChangelogDialog` - Version changelog dialog
- `CircularImage` - Circular image display
- `FavoriteButton` - Favorite toggle button
- `IconButton` - Icon button wrapper
- `InlineGroupCreator` - Inline creation widget for groups
- `RecipeIcon` - Recipe category icon display
- `ScrollableCardList` - Horizontally scrollable card list
- `ThemeToggle` - Dark/light theme toggle
- `SafeLink` - Safe external link

### Layout Components (`components/layout/`)
- `AppLayout` / `ConditionalAppLayout` - App shell layout
- `PageHeader` / `PageHeaderContent` / `PageHeaderTitle` / `PageHeaderActions` - Page header (composition pattern)
- `PageLayout` - Standardized page wrapper
- `TopNav` / `TopNavLink` / `TopNavAddMenu` / `TopNavUserMenu` - Top navigation bar
- `MobileBottomNav` - Mobile bottom navigation
- `NavButton` - Navigation button
- `RecentRecipeChip` - Recent recipe quick-access chip
- `Logo` - App logo

### Form Components (`components/forms/`)
- `QuantityInput` - Ingredient quantity input (fractions, decimals)
- `IngredientAutocomplete` - Autocomplete ingredient input
- `QuickAddForm` - Quick-add form widget

### Auth Components (`components/auth/`)
- `SignInForm` - Sign-in form
- `SignUpForm` - Sign-up form
- `UserMenu` - User dropdown menu

## Pre-Flight Checklist

Before creating ANY new component:

1. **Check shadcn/ui** - Does it exist there?
2. **Check component inventory above** - Does a custom version exist?
3. **Search codebase** - `grep -r "export.*function ComponentName"`
4. **If similar exists** - Extend it with props, don't duplicate
5. **If truly new** - Document it here after creating

## Common Violations

- Creating custom `<Toggle>` when `<Switch>` exists
- Creating custom `<Modal>` when `<Dialog>` exists
- Creating custom `<Dropdown>` when `<DropdownMenu>` exists
- Creating custom `<Loading>` when `<Skeleton>` exists
- Creating second `RecipeCard` variant instead of adding props
