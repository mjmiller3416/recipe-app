// ============================================
// CHANGELOG - Edit the markdown below
// ============================================
const CHANGELOG_MD = `
## 2026-01-10 - Bug Fixes
- Print layout now keeps the recipe image and content together on the same page
- Flagged shopping items now stay flagged when you make changes to your meal plan
- Chef's Tips on the Dashboard now shows a wider variety of cooking tips instead of repeating the same ones

## 2026-01-04 - Bug Fixes
- Fixed issue with adding meals to the planner from the Recipe Browser

## 2026-01-04 - Improvements
- Added multi-select filters to the Meal Planner for easier meal searching and filtering

## 2026-01-04 - New Features
- Revamped Meal Planner UI 

## 2026-01-02 - Improvements
- Enhanced Meal Genie Assistant: 
-     chat history persistence across sessions
-     improved response times
-     diplay chat in popup window

# 2026-01-02 - New Features
- Recipe Roulette: Randomly suggests recipes based existing recipes in your meal planner or favorites

## 2026-01-01 - Bug Fixes
- Fixed issue where shopping list did not update correctly after removing all meals from the planner
- Fixed various bugs related to the Shopping List and Meal Planner pages

## 2026-01-01 - Improvements
- Added "Create Meal" button to Meal Planner sidebar - quick access to meal creation
- "Add Meal" button in Meal Planner now opens the "Saved Meals" tab by default for faster access

## 2026-01-01 - New Features
- Add flags to shopping list items to mark them as important or "don't forget" - flagged items appear at the top of their category and have a visual indicator
- AI-powered Meal Genie chatbot on the Dashboard - get cooking tips, recipe ideas, and meal suggestions instantly. 
- New chat features coming soon!!!

## 2025-12-31 - Improvements
- Improved responsiveness of the sidebar on mobile devices

## 2025-12-30 - New Features
- Exclude individual meals from your shopping list — click the cart icon on any meal card in the planner sidebar (green = included, red = excluded)

## 2025-12-30 - Improvements
- Shopping list page now loads faster with optimized database queries and parallel data fetching

## 2025-12-29 - Bug Fixes
- Meal Queue on the dashboard now displays meals correctly
- Shopping list categories now auto-expand when new items are added to a completed category
- Shopping list badge in sidebar now updates in real-time when adding, removing, or completing meals in the planner
- Dashboard widgets (Meal Queue, Shopping List, Cooking Streak) now refresh instantly when planner changes — no page reload needed
- Cooking streak widget now marks the correct day when completing meals (fixed timezone issue)
- Shopping list properly clears recipe items when all meals are removed from the planner

## 2025-12-29 - New Features
- Track your cooking streak on the Dashboard — see consecutive days cooked and this week's activity at a glance
- New Dashboard homepage with at-a-glance stats, meal queue, shopping list preview, and AI-powered Chef's Tips
- Manually added shopping list items can now be assigned to specific categories (Produce, Dairy, Meat, etc.) instead of always appearing in "Other"
- Click your profile avatar in the sidebar to access Settings

## 2025-12-29 - Improvements
- Shopping list categories now auto-collapse when all items are collected
- Collapsed and expanded category states persist between page visits
- New "Hide collected" toggle replaces "Clear collected" — filter your view without losing data
- Sidebar now fits better on smaller screens with optimized spacing

## 2025-12-29 - Improvements
- Recipe ingredients now display in a logical order with Meat and Seafood first, followed by produce, dairy, and pantry items

## 2025-12-29 - Bug Fixes
- "Mac Salad" now correctly appears in the Deli section of the shopping list

## 2025-12-29 - New Features
- Add items manually to your shopping list with the new inline form — perfect for pantry staples and non-recipe items

## 2025-12-28 - New Features
- Quickly add saved meals to your planner from the new "Saved Meals" tab — search by name or filter by favorites
- Configure custom unit conversions for shopping list items in Settings → Shopping List (e.g., convert 51 Tbs of butter to 7 sticks)

## 2025-12-28 - Previous Features
- Favorite meals directly from the meal planner with the new Favorite button — favorited meals show a heart indicator in the weekly menu
- Customize which quick filters appear in the Recipe Browser from Settings → Recipe Preferences (choose up to 5)
- Customize the AI image generation prompt in Settings → AI Features with syntax highlighting for the {recipe_name} placeholder
- New "New" filter in Meal Planner lets you quickly find recipes added in the last 7 days
- Filter shopping list by recipe using the new sidebar that shows which recipes contribute each ingredient
- Hover over shopping list items to see a breakdown of quantities by recipe

## 2025-12-28 - Bug Fixes
- "Favorites" and "New" quick filter pills in the Recipe Browser now work correctly
- Fixed meal slot cards in the create/edit meal dialog to display at consistent sizes with proper borders and shadows
- Weekly menu in Meal Planner now scrolls properly when there are many items
- Shopping list items now uncheck automatically when their quantity increases from adding new recipes
- Meal planner now auto-selects the first uncompleted meal when you open the page
- Removed duplicate "Pico De Gallo" ingredient that appeared in wrong category
- Ingredient units like "Tbs" now display with proper capitalization on recipe pages
- Fixed loading state issues on the Recipes page with improved Suspense handling

## 2025-12-28 - Improvements
- Shopping list now intelligently combines ingredients by unit type — quantities in the same dimension (cups + tbsp, lbs + oz) are merged, while incompatible units (lbs vs cups) appear as separate items
- Print recipes with customizable options — choose to include or exclude the image, chef's notes, and cooking time to fit more content on a single page
- Ingredient quantities now accept leading decimals like .5 or .25 (no need to type 0.5)
- Clicking "Add Ingredient" now automatically focuses the new ingredient name field
- Active filter pills now stay on a single row with horizontal scrolling instead of wrapping
- Shopping list stats now display in a more logical order: Remaining → Collected → Total

## 2025-12-27 - Improvements
- Shopping list now shows quantities before item names for easier scanning while shopping
- Shopping list quantities now display as fractions (½, ¼) instead of decimals
- Added zoom-on-hover effect to side dish recipe cards in meal planner
- Improved sidebar navigation

## 2025-12-27 - Bug Fixes
- Quick filter chips no longer add duplicate entries to the active filters display
- Fixed layout shift when opening dropdowns and dialogs on scrollable pages
- The "Favorites Only" filter in Recipe Browser now works correctly
- Card shadows now display with properly rounded corners

## 2025-12-27 - New Features
- Quickly access recently viewed recipes from the sidebar

## 2024-12-27 - Latest Updates
- Drag-and-drop reordering of ingredients when adding or editing recipes
- Fixed ingredient autocomplete for multi-word ingredients like 'olive oil'
- Removed duplicate 'Ranch Seasoning' ingredient from database
`;

// ============================================
// Parser (don't edit below this line)
// ============================================
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const sections = markdown.split(/^## /gm).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const headerMatch = lines[0].match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/);
    if (!headerMatch) continue;

    const [, version, title] = headerMatch;
    const changes = lines
      .slice(1)
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).trim());

    entries.push({
      version,
      date: formatDate(version),
      title: title.trim(),
      changes,
    });
  }

  return entries;
}

export const CHANGELOG_ENTRIES = parseChangelog(CHANGELOG_MD);

// Calculate total number of individual change items
export const CHANGELOG_TOTAL_ITEMS = CHANGELOG_ENTRIES.reduce(
  (sum, entry) => sum + entry.changes.length,
  0
);

// Helper to get the cumulative item count up to (but not including) a given entry
export function getItemCountBeforeEntry(entryIndex: number): number {
  return CHANGELOG_ENTRIES.slice(0, entryIndex).reduce(
    (sum, entry) => sum + entry.changes.length,
    0
  );
}
