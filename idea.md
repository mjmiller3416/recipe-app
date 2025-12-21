# Component Breakdown

## A. Container / Page Level

### `WeeklyMenuPage` (page.tsx)

- **Responsibility:** Fetches data, holds the state for the `selectedMealId`, and manages the layout grid.
- **Next.js Specific:** Uses the `next/image` component for optimization.

---

## B. Left Column: Selected Meal View

### `SelectedMealDisplay` (Container)

Wraps the hero image, details, sides, and action buttons.

### `MealHero`

The large image component at the top.

### `MealHeader`

Contains the Title ("Chicken Tikka Masala"), Metadata (Servings, Time), and Badges (Dinner, Indian, etc.).

**Sub-components:**

- `MetaItem` — Reusable icon + text (e.g., `<UserIcon /> 4 servings`).
- `Badge` — The pill-shaped tags (e.g., "Gluten-Free").

### `SideDishGrid`

A flexible container for the side dishes.

**Sub-component:**

- `SideDishCard` — The small cards (Garlic Naan, Rice, Raita) containing a thumbnail and title.

### `MealActionBar`

Contains the primary interaction buttons.

**Buttons:**

- "Mark Complete" (Primary/Purple)
- "Edit Meal" (Secondary/Outline)
- "Remove from Menu" (Destructive/Red Outline)

---

## C. Right Column: Sidebar Menu

### `WeeklyMenuList` (Container)

Wraps the list of meals and the "Add" button.

### `MenuListItem`

The individual cards for each meal in the list.

**Props:**

- `meal: Meal`
- `isActive: boolean`
- `onClick: () => void`

**Visuals:** Needs conditional border styling (Purple border if `isActive` is true).

### `AddMealButton`

The large purple button at the bottom of the sidebar.