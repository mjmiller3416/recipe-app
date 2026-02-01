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

### Recipe Domain
- `RecipeCard` - Recipe list item display
- `RecipeGrid` - Grid layout for recipes
- `RecipeSearch` - Search bar with filters
- `IngredientList` - Ingredient display

### Meal Planner Domain
- `PlannerCalendar` - Weekly meal planner view
- `MealSlot` - Individual meal slot
- `MealSelector` - Meal selection dialog

### Shopping Domain
- `ShoppingList` - Shopping list view
- `ShoppingItem` - Individual list item

### Layout Components
- `Navbar` - Main navigation
- `Sidebar` - Side navigation
- `PageHeader` - Page title + actions
- `EmptyState` - No data placeholder

### Form Components
- `RecipeForm` - Full recipe creation/edit form
- `IngredientInput` - Ingredient entry field
- `ImageUpload` - Cloudinary image upload

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
