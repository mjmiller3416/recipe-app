import { ShoppingListView } from "./_components/ShoppingListView";

/**
 * Shopping List Page
 *
 * Route: /shopping-list
 *
 * Displays the user's shopping list with items grouped by category.
 * Auto-syncs with active planner entries on load.
 */
export default function ShoppingListPage() {
  return <ShoppingListView />;
}
