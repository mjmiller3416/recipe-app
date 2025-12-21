# Meal Genie - Feature Concept

## 1. The Meal Planner Page 

This is your main command center. It is designed as a **"fixed viewport"** app, meaning the window doesn't scroll like a website; instead, specific panels scroll internally.

### The Sidebar (Right Column)

**Purpose:** This is your schedule at a glance. It holds the queue of meals you planned for the week.

- **Scrollable List:** Shows your meal cards (e.g., "Monday: Tacos") in a vertical list. It uses the "shadow fix" we discussed so it looks clean while scrolling.
- **Sticky Footer:** The "Add Meal" button stays fixed at the bottom so you can always add to your plan without hunting for the button.

### The Selected Meal View (Left Column)

**Purpose:** This is the "Execution" view. When you click a card in the sidebar, this panel updates to show you the full details for cooking.

- **Hero Section:** A large, beautiful image of the main dish with the title, prep times, and serving sizes.
- **Side Dish Grid:** A row of smaller cards showing the accompanying sides (e.g., Rice, Naan, Salad).
- **Action Bar:** Buttons to "Mark Complete" (logs it to history), "Edit" (change sides), or "Remove" (delete from plan).

---

## 2. The Create Meal Dialog (The Popup)

This appears when you click "Add Meal." It is designed to bridge the gap between your database (which stores lists) and your user experience (which uses "slots").

### The Tabs (Top)

- **Create Meal:** The default view for building something new from scratch.
- **Saved Meals:** A browser for pre-configured meal templates (like your "Sunday Roast" bundle) so you don't have to rebuild them every time.

### The Composition Area (Left Side)

**Purpose:** This is your canvas. It visually represents the meal you are building.

- **Main Dish Slot:** A large, cinematic box. When empty, it asks you to "Select Main Dish." When filled, it shows the recipe image.
- **Side Dish Slots:** A row of three smaller boxes for your sides.
- **Interaction:** Clicking any of these boxes makes it the "Active" slot (it glows purple), telling the app, "The next recipe I click goes here."

### The Recipe Picker (Right Side)

**Purpose:** Your library of ingredients.

- **Search Bar:** Filters your recipe database by name or tag.
- **Recipe List:** A scrollable list of recipe cards. Clicking one instantly fills the currently "Active" slot on the left.