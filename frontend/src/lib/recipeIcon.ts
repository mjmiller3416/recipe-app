/**
 * Recipe Icon Assignment System
 *
 * Assigns icons to recipes based on title keywords first,
 * then falls back to category-based defaults, with emoji fallback
 * for items without matching icons.
 */

import type { RecipeIconData } from "@/components/common/RecipeIcon";

// ============================================================================
// KEYWORD TO ICON MAPPING (PRIORITY ORDERED)
// ============================================================================

/**
 * Food keywords mapped to icon filenames (without .png extension).
 * Checked against recipe titles (case-insensitive).
 *
 * IMPORTANT: This is an ordered array - more specific keywords must come
 * before generic ones. For example, "salmon" before "fish" ensures
 * "Salmon Fish Cakes" matches salmon, not generic fish.
 *
 * Format: [keyword, iconName] where iconName can be:
 *   - string: icon filename (without .png)
 *   - null: use emoji fallback from EMOJI_FALLBACKS
 */
const ICON_KEYWORDS: ReadonlyArray<[string, string | null]> = [
  // Proteins - Beef (specific before generic)
  ["meatball", null],
  ["meatloaf", null],
  ["hamburger", "hamburger"],
  ["burger", "hamburger"],
  ["steak", "steak"],
  ["beef", "beef"],

  // Proteins - Poultry (no good icons available)
  ["chicken", null],
  ["turkey", null],
  ["wings", null],

  // Proteins - Pork (specific before generic)
  ["hotdog", "hot-dog"],
  ["sausage", "sausages"],
  ["bacon", "bacon"],
  ["ham", "jamon"],
  ["rib", "rack-of-lamb"],
  ["pork", "cuts-of-pork"],

  // Proteins - Seafood (specific fish before generic "fish")
  ["salmon", "salmon"],
  ["tuna", "fish-fillet"],
  ["lobster", "crab"],
  ["shrimp", "prawn"],
  ["prawn", "prawn"],
  ["crab", "crab"],
  ["oyster", "caviar"],
  ["clam", "caviar"],
  ["mussel", "caviar"],
  ["fish", "fish-fillet"],

  // Italian (specific pasta types before generic "pasta")
  ["spaghetti", "spaghetti"],
  ["lasagna", "lasagna"],
  ["ravioli", "dumplings"],
  ["risotto", "grains-of-rice"],
  ["pasta", "spaghetti"],
  ["pizza", "pizza"],

  // Mexican (specific before generic)
  ["quesadilla", "quesadilla"],
  ["enchilada", "wrap"],
  ["burrito", "wrap"],
  ["fajita", "taco"],
  ["nacho", "nachos"],
  ["taco", "taco"],

  // Asian (specific before generic)
  ["springroll", "spring-roll"],
  ["dimsum", "dim-sum"],
  ["gyoza", "gyoza"],
  ["dumpling", "dumplings"],
  ["bao", "bao-bun"],
  ["ramen", "noodles"],
  ["pho", "noodles"],
  ["noodle", "noodles"],
  ["sushi", "sushi"],
  ["miso", "miso-soup"],
  ["teriyaki", "bento"],
  ["bento", "bento"],
  ["stirfry", "stir"],
  ["curry", "curry"],
  ["kimchi", "kimchi"],
  ["rice", "rice-bowl"],

  // Breakfast
  ["omelette", "omlette"],
  ["pancake", "pancake-stack"],
  ["waffle", "waffle"],
  ["croissant", "croissant"],
  ["bagel", "bagel"],
  ["cereal", "cereal"],
  ["toast", "bread"],
  ["egg", "egg"],

  // Soups & Stews (specific before generic "soup")
  ["chowder", "soup-plate"],
  ["chili", "chili-pepper"],
  ["stew", "soup-plate"],
  ["soup", "soup-plate"],

  // Salads & Vegetables
  ["salad", "salad"],
  ["broccoli", "broccoli"],
  ["carrot", "carrot"],
  ["corn", "corn"],
  ["fries", "french-fries"],
  ["potato", "potato"],

  // Sandwiches & Wraps (specific before generic)
  ["panini", "sandwich"],
  ["sandwich", "sandwich"],
  ["pretzel", "pretzel"],
  ["sub", "baguette"],
  ["wrap", "wrap"],
  ["bread", "bread"],

  // Desserts (specific before generic)
  ["cheesecake", "cheesecake"],
  ["cupcake", "cupcake"],
  ["tiramisu", "tiramisu"],
  ["macaron", "macaron"],
  ["eclair", "chocolate-eclair"],
  ["doughnut", "doughnut"],
  ["donut", "doughnut"],
  ["brownie", "chocolate-bar"],
  ["icecream", "ice-cream-cone"],
  ["gelato", "melting-ice-cream"],
  ["pudding", "dessert"],
  ["cookie", "cookies"],
  ["chocolate", "chocolate-bar"],
  ["cake", "cake"],
  ["pie", "pie"],

  // Other Dishes
  ["casserole", "dinner"],
  ["skewer", "kebab"],
  ["kebab", "kebab"],
  ["samosa", "samosa"],
  ["falafel", "falafel"],
  ["paella", "paella"],
  ["fondue", "fondue"],
  ["roast", "roast"],
  ["yogurt", "yogurt"],
  ["popcorn", "popcorn"],
];

/**
 * Emoji fallbacks for keywords without suitable icons.
 */
const EMOJI_FALLBACKS: Record<string, string> = {
  meatball: "🧆",
  meatloaf: "🥩",
  chicken: "🍗",
  turkey: "🦃",
  wings: "🍗",
};

// ============================================================================
// CATEGORY TO ICON MAPPING
// ============================================================================

/**
 * Recipe category values mapped to icons/emojis.
 */
const CATEGORY_ICON_MAP: Record<string, RecipeIconData> = {
  beef: { type: "icon", value: "beef" },
  chicken: { type: "emoji", value: "🍗" },
  pork: { type: "icon", value: "cuts-of-pork" },
  seafood: { type: "icon", value: "prawn" },
  vegetarian: { type: "icon", value: "broccoli" },
  other: { type: "emoji", value: "🍽️" },
};

const DEFAULT_ICON: RecipeIconData = { type: "emoji", value: "🍴" };

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get an icon for a recipe based on its title and category.
 *
 * Priority:
 * 1. Check if recipe title contains any food keywords with icons
 * 2. Check if recipe title contains keywords with emoji fallback
 * 3. Fall back to category-based icon
 * 4. Return default emoji if no match
 *
 * @param title - The recipe name/title
 * @param category - The recipe category (optional)
 * @returns A RecipeIconData object with type and value
 *
 * @example
 * getRecipeIcon("Grilled Salmon Tacos", "seafood") // { type: "icon", value: "salmon" }
 * getRecipeIcon("Turkey Meatballs", "chicken")     // { type: "emoji", value: "🦃" }
 * getRecipeIcon("Family Secret Recipe", "beef")    // { type: "icon", value: "beef" }
 * getRecipeIcon("Mystery Dish")                    // { type: "emoji", value: "🍴" }
 */
export function getRecipeIcon(title: string, category?: string): RecipeIconData {
  const lowerTitle = title.toLowerCase();

  // 1. Check title for keyword matches (in priority order)
  for (const [keyword, iconName] of ICON_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      // If icon exists, return it
      if (iconName !== null) {
        return { type: "icon", value: iconName };
      }
      // Otherwise check emoji fallback
      if (keyword in EMOJI_FALLBACKS) {
        return { type: "emoji", value: EMOJI_FALLBACKS[keyword] };
      }
    }
  }

  // 2. Fallback to category
  if (category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory in CATEGORY_ICON_MAP) {
      return CATEGORY_ICON_MAP[lowerCategory];
    }
  }

  // 3. Default
  return DEFAULT_ICON;
}
