/**
 * Recipe Emoji Assignment System
 *
 * Assigns emojis to recipes based on title keywords first,
 * then falls back to category-based defaults.
 */

// ============================================================================
// KEYWORD TO EMOJI MAPPING
// ============================================================================

/**
 * Food keywords mapped to their emojis.
 * Checked against recipe titles (case-insensitive).
 */
const FOOD_KEYWORDS: Record<string, string> = {
  // Proteins - Beef
  burger: "🍔",
  steak: "🥩",
  beef: "🥩",
  meatball: "🧆",
  meatloaf: "🥩",

  // Proteins - Poultry
  chicken: "🍗",
  turkey: "🦃",
  wings: "🍗",

  // Proteins - Pork
  pork: "🥓",
  bacon: "🥓",
  ham: "🍖",
  sausage: "🌭",
  hotdog: "🌭",
  rib: "🍖",

  // Proteins - Seafood
  fish: "🐟",
  salmon: "🍣",
  tuna: "🐟",
  shrimp: "🦐",
  prawn: "🦐",
  lobster: "🦞",
  crab: "🦀",
  oyster: "🦪",
  clam: "🦪",
  mussel: "🦪",

  // Italian
  pizza: "🍕",
  pasta: "🍝",
  spaghetti: "🍝",
  lasagna: "🍝",
  ravioli: "🍝",
  risotto: "🍚",

  // Mexican
  taco: "🌮",
  burrito: "🌯",
  quesadilla: "🧀",
  nacho: "🧀",
  enchilada: "🌮",
  fajita: "🌮",

  // Asian
  sushi: "🍣",
  ramen: "🍜",
  pho: "🍜",
  noodle: "🍜",
  rice: "🍚",
  curry: "🍛",
  dumpling: "🥟",
  gyoza: "🥟",
  stirfry: "🥡",
  teriyaki: "🍱",

  // Breakfast
  egg: "🍳",
  omelette: "🍳",
  pancake: "🥞",
  waffle: "🧇",
  toast: "🍞",
  cereal: "🥣",

  // Soups & Stews
  soup: "🍲",
  stew: "🍲",
  chili: "🌶️",
  chowder: "🍲",

  // Salads & Vegetables
  salad: "🥗",
  broccoli: "🥦",
  carrot: "🥕",
  corn: "🌽",
  potato: "🥔",
  fries: "🍟",

  // Sandwiches & Wraps
  sandwich: "🥪",
  sub: "🥖",
  wrap: "🌯",
  bread: "🍞",
  roll: "🍞",
  panini: "🥪",

  // Desserts
  cake: "🎂",
  cookie: "🍪",
  pie: "🥧",
  donut: "🍩",
  doughnut: "🍩",
  icecream: "🍨",
  gelato: "🍨",
  chocolate: "🍫",
  cupcake: "🧁",
  brownie: "🍫",
  cheesecake: "🍰",
  pudding: "🍮",

  // Other Dishes
  casserole: "🥘",
  roast: "🍖",
  kebab: "🍢",
  skewer: "🍢",
  sides: "🍽️"
};  

// ============================================================================
// CATEGORY TO EMOJI MAPPING
// ============================================================================

/**
 * Recipe category values mapped to fallback emojis.
 * Uses lowercase values matching the constants in constants.ts
 */
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  beef: "🥩",
  chicken: "🍗",
  pork: "🥓",
  seafood: "🦐",
  vegetarian: "🥦",
  other: "🍽️",
};

const DEFAULT_EMOJI = "🍴";

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get an emoji for a recipe based on its title and category.
 *
 * Priority:
 * 1. Check if recipe title contains any food keywords
 * 2. Fall back to category-based emoji
 * 3. Return default emoji if no match
 *
 * @param title - The recipe name/title
 * @param category - The recipe category (optional)
 * @returns An emoji string
 *
 * @example
 * getRecipeEmoji("Grilled Salmon Tacos", "seafood") // "🍣" (from "salmon")
 * getRecipeEmoji("Grandma's Casserole", "beef")     // "🥘" (from "casserole")
 * getRecipeEmoji("Family Secret Recipe", "chicken") // "🍗" (from category)
 * getRecipeEmoji("Mystery Dish")                    // "🍴" (default)
 */
export function getRecipeEmoji(title: string, category?: string): string {
  const lowerTitle = title.toLowerCase();

  // 1. Check title for keyword matches
  for (const [keyword, emoji] of Object.entries(FOOD_KEYWORDS)) {
    if (lowerTitle.includes(keyword)) {
      return emoji;
    }
  }

  // 2. Fallback to category
  if (category) {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory in CATEGORY_EMOJI_MAP) {
      return CATEGORY_EMOJI_MAP[lowerCategory];
    }
  }

  // 3. Default
  return DEFAULT_EMOJI;
}
