// Static demo data for the landing-page product vignettes. One recipe — the
// garlic butter shrimp pasta — threads through the whole page: wished for in
// the hero, saved in step 1, planned in step 2, shopped in step 3.

export interface DemoRecipe {
  name: string;
  image: string;
  servings: number;
  time: string;
  mealType?: string;
}

export const SHRIMP_PASTA: DemoRecipe = {
  name: "Garlic Butter Shrimp Pasta",
  image: "/images/landing/food/shrimp-pasta.jpg",
  servings: 4,
  time: "30m",
  mealType: "Dinner",
};

export const STUFFED_CHICKEN: DemoRecipe = {
  name: "Spinach Stuffed Chicken Thighs",
  image: "/images/landing/food/stuffed-chicken.jpg",
  servings: 4,
  time: "45m",
  mealType: "Dinner",
};

export const AVOCADO_CORN_SALAD: DemoRecipe = {
  name: "Avocado Corn Salad",
  image: "/images/landing/food/avocado-corn-salad.jpg",
  servings: 6,
  time: "10m",
  mealType: "Side",
};

export const RIBEYE_STEAK: DemoRecipe = {
  name: "Ribeye Steak",
  image: "/images/landing/food/ribeye-steak.jpg",
  servings: 2,
  time: "30m",
  mealType: "Dinner",
};

export const BBQ_CHICKEN_BOWL: DemoRecipe = {
  name: "BBQ Chicken Protein Bowl",
  image: "/images/landing/food/bbq-chicken-bowl.jpg",
  servings: 4,
  time: "20m",
  mealType: "Dinner",
};

export const APPLE_COBBLER: DemoRecipe = {
  name: "Apple Cobbler",
  image: "/images/landing/food/apple-cobbler.jpg",
  servings: 6,
  time: "1h",
  mealType: "Dessert",
};

export const AIR_FRYER_POTATOES: DemoRecipe = {
  name: "Air Fryer Potatoes",
  image: "/images/landing/food/air-fryer-potatoes.jpg",
  servings: 3,
  time: "25m",
  mealType: "Side",
};

export const FISH_SANDWICHES: DemoRecipe = {
  name: "Fish Sandwiches",
  image: "/images/landing/food/fish-sandwiches.jpg",
  servings: 4,
  time: "35m",
  mealType: "Dinner",
};

/** Wish → recipe pairs the hero cycles through. */
export const HERO_WISHES: { wish: string; recipe: DemoRecipe }[] = [
  { wish: "Garlic butter shrimp pasta, ready in 30 minutes", recipe: SHRIMP_PASTA },
  { wish: "Something cozy with chicken — no oven tonight", recipe: STUFFED_CHICKEN },
  { wish: "A fresh side to round out taco night", recipe: AVOCADO_CORN_SALAD },
];
