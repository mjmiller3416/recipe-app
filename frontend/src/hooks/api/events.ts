// src/hooks/api/events.ts
// Event constants and dispatch helpers for cross-component communication
//
// Events allow components that aren't directly connected through props
// to react to data changes. For example, the sidebar widgets can listen
// for planner updates without being passed callbacks from every component.

export const PLANNER_EVENTS = {
  UPDATED: "planner-updated",
} as const;

export const SHOPPING_EVENTS = {
  UPDATED: "shopping-list-updated",
} as const;

export const RECIPE_EVENTS = {
  UPDATED: "recipes-updated",
} as const;

// Dispatch helpers - call these after mutations to notify listeners
export const dispatchPlannerUpdate = () =>
  window.dispatchEvent(new Event(PLANNER_EVENTS.UPDATED));

export const dispatchShoppingUpdate = () =>
  window.dispatchEvent(new Event(SHOPPING_EVENTS.UPDATED));

export const dispatchRecipeUpdate = () =>
  window.dispatchEvent(new Event(RECIPE_EVENTS.UPDATED));
