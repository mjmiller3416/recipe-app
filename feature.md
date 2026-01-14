# Feature Summary: Smart Pantry Inference

## What It Is

An automated system that infers what ingredients a user likely still has in their pantry based on their shopping and cooking behavior — without requiring them to manually track inventory.

## Core Premise

> "If you bought it but didn't cook the meal, you probably still have it."

## The Behavioral Signals

| User Action | System Interpretation |
|-------------|----------------------|
| Checks shopping item as "have" | Acquired — ingredient entered the home |
| Meal marked as "cooked/complete" | Consumed — ingredients were used |
| Meal cleared/removed without cooking | Retained — ingredients likely still available |
| Time passes beyond shelf life | Expired — reduce confidence or exclude |

## How It Would Work (User Experience)

### Scenario 1: Shopping List Flag

User plans "Italian Subs" for Week 1, buys Prosciutto, never cooks it. Week 2 rolls around, they plan a Charcuterie Board that also needs Prosciutto.

> Shopping list shows: 🏠 You might already have this (bought 5 days ago)

### Scenario 2: Meal Genie Suggestion

User opens Meal Genie to plan meals.

> Meal Genie says: "I noticed you have Olive Oil, Pasta, and Garlic from last week that didn't get used. Want me to suggest a quick pasta dish?"

### Scenario 3: Prevent Duplicate Purchase

User manually adds "Olive Oil" to shopping list.

> System shows subtle hint: "You bought Olive Oil 4 days ago — still need more?"

---

## Technical Implementation Outline

### 1. Database Schema Changes

#### Option A: New PantryAcquisition Table (Recommended)

Track acquisition events separately from shopping items:

```python
class PantryAcquisition(Base):
    __tablename__ = "pantry_acquisitions"

    id: int                     # Primary key
    state_key: str              # Normalized ingredient key (e.g., "olive oil::cup")
    ingredient_name: str        # Display name
    ingredient_category: str    # For shelf-life rules (pantry, produce, dairy, etc.)

    # Acquisition tracking
    acquired_at: datetime       # When user checked "have"
    quantity: float | None      # How much they bought
    unit: str | None            # Unit of measurement

    # Meal linkage
    planner_entry_id: int | None  # FK to planner entry (nullable for manual adds)
    recipe_id: int | None         # FK to recipe (nullable)

    # Consumption tracking
    consumed_at: datetime | None  # When meal was marked complete
    is_consumed: bool = False     # Was this ingredient used?

    # Inference state
    is_expired: bool = False      # Past shelf life?
    confidence: str = "high"      # high/medium/low based on category + time
```

#### Option B: Extend Existing ShoppingItemState

Add columns to existing table (simpler but less flexible):

```python
# Add to ShoppingItemState
acquired_at: datetime | None      # When checked as "have"
for_planner_entry_id: int | None  # Which meal it was for
meal_was_completed: bool = False  # Did they cook the meal?
```

**Recommendation:** Option A is cleaner because it separates concerns — shopping list state vs. pantry inference are different concepts.

---

### 2. Shelf-Life Configuration

A simple mapping of ingredient categories to expected shelf life:

```python
# backend/app/config/pantry_config.py

SHELF_LIFE_DAYS = {
    # Long shelf life (high confidence for weeks)
    "pantry": 90,        # Pasta, rice, canned goods
    "spices": 180,       # Spices, dried herbs
    "oils-and-vinegars": 90,
    "condiments": 60,
    "baking": 90,

    # Medium shelf life
    "frozen": 30,
    "bakery": 5,
    "beverages": 14,

    # Short shelf life (low confidence quickly)
    "produce": 7,
    "dairy": 10,
    "meat": 3,
    "seafood": 2,
    "deli": 5,
}

# Confidence decay
def get_confidence(category: str, days_since_acquired: int) -> str:
    shelf_life = SHELF_LIFE_DAYS.get(category, 7)
    ratio = days_since_acquired / shelf_life

    if ratio < 0.5:
        return "high"      # Less than half shelf life
    elif ratio < 0.8:
        return "medium"    # Getting close
    elif ratio < 1.0:
        return "low"       # Almost expired
    else:
        return "expired"   # Past shelf life
```

---

### 3. Backend Service Changes

#### A. Shopping Service Updates

**`shopping_service.py`**

When item is checked as "have":

```python
def mark_item_as_have(self, state_key: str, planner_entry_id: int | None):
    # Existing logic to update ShoppingItemState...

    # NEW: Record acquisition for pantry inference
    self.pantry_service.record_acquisition(
        state_key=state_key,
        ingredient_name=...,
        ingredient_category=...,
        planner_entry_id=planner_entry_id,
        quantity=...,
        unit=...
    )
```

#### B. Planner Service Updates

**`planner_service.py`** (assumed location)

When meal is marked as complete:

```python
def mark_meal_complete(self, planner_entry_id: int):
    # Existing logic...

    # NEW: Mark related pantry acquisitions as consumed
    self.pantry_service.mark_consumed_by_planner_entry(planner_entry_id)
```

When meal is cleared without cooking:

```python
def clear_meal(self, planner_entry_id: int):
    # Existing logic...

    # NEW: Pantry acquisitions remain with is_consumed=False
    # (No action needed — they stay in "probably have" state)
```

#### C. New Pantry Inference Service

```python
# backend/app/services/pantry_service.py

class PantryService:
    def record_acquisition(self, state_key: str, ...):
        """Record that user acquired an ingredient."""

    def mark_consumed_by_planner_entry(self, planner_entry_id: int):
        """Mark all acquisitions for a meal as consumed."""

    def get_inferred_pantry(self, min_confidence: str = "low") -> List[PantryItem]:
        """
        Get ingredients user probably still has.

        Returns items where:
        - is_consumed = False
        - is_expired = False
        - confidence >= min_confidence
        - acquired_at within shelf life window
        """

    def check_if_likely_have(self, state_key: str) -> PantryMatch | None:
        """
        Check if user likely already has this ingredient.
        Returns acquisition info if found, None otherwise.
        """

    def cleanup_expired(self):
        """Periodic job to mark old acquisitions as expired."""
```

#### D. Update UserContextBuilder for Meal Genie

**`user_context_builder.py`**

```python
def _build_pantry_context(self) -> str:
    """NEW: Build inferred pantry context for AI."""
    items = self.pantry_service.get_inferred_pantry(min_confidence="medium")

    if not items:
        return ""

    lines = ["INGREDIENTS YOU PROBABLY STILL HAVE:"]
    for item in items:
        days_ago = (datetime.now() - item.acquired_at).days
        lines.append(f"- {item.ingredient_name} ({item.confidence} confidence, bought {days_ago} days ago)")

    return "\n".join(lines)
```

Then include in `build_context()`:

```python
def build_context(self) -> str:
    sections = [
        self._build_recipes_context(),
        self._build_meal_plan_context(),
        self._build_shopping_context(),
        self._build_pantry_context(),  # NEW
    ]
    return "\n\n".join(filter(None, sections))
```

---

### 4. API Endpoints

#### New Pantry Endpoints

```python
# backend/app/api/pantry.py (new file)

@router.get("/inferred")
def get_inferred_pantry() -> List[PantryItemDTO]:
    """Get list of ingredients user probably still has."""

@router.get("/check/{state_key}")
def check_ingredient(state_key: str) -> PantryMatchDTO | None:
    """Check if user likely has a specific ingredient."""

@router.delete("/{acquisition_id}")
def dismiss_acquisition(acquisition_id: int):
    """User says 'I don't have this anymore' — remove from inference."""
```

#### Update Shopping Endpoints

```python
# Modify existing check/uncheck endpoint
@router.patch("/items/{state_key}/check")
def check_item(state_key: str, planner_entry_id: int | None = None):
    """Check item as 'have' and record acquisition."""
```

---

### 5. Frontend Changes

#### A. Shopping List UI Updates

**`ShoppingList.tsx`** (assumed location)

Add indicator for "might already have":

```tsx
interface ShoppingItemProps {
  item: ShoppingItem;
  pantryMatch?: PantryMatch;  // NEW: from API check
}

function ShoppingItemRow({ item, pantryMatch }: ShoppingItemProps) {
  return (
    <div className="shopping-item">
      {/* Existing UI */}

      {/* NEW: Pantry inference hint */}
      {pantryMatch && (
        <Tooltip content={`Bought ${pantryMatch.daysAgo} days ago for ${pantryMatch.mealName}`}>
          <span className="pantry-hint">
            🏠 You might still have this
          </span>
        </Tooltip>
      )}
    </div>
  );
}
```

#### B. Meal Genie Integration

The AI already gets context via `UserContextBuilder`, so Meal Genie would automatically be able to reference the inferred pantry. You might also add:

**Proactive suggestion on open:**

```tsx
// In MealGenieChatContent.tsx
useEffect(() => {
  const pantryItems = await api.pantry.getInferred();
  if (pantryItems.length > 0 && !hasGreeted) {
    // Trigger AI to mention available ingredients
    setInitialPrompt(`User has these unused ingredients: ${pantryItems.map(i => i.name).join(', ')}`);
  }
}, []);
```

#### C. Optional: Simple Pantry View

A lightweight "What's in my pantry?" section (could be a tab or expandable section):

```tsx
function InferredPantryPanel() {
  const { data: pantryItems } = useQuery(['inferred-pantry'], api.pantry.getInferred);

  return (
    <div className="pantry-panel">
      <h3>Probably in your pantry</h3>
      <p className="subtitle">Based on what you bought but haven't cooked</p>

      {pantryItems?.map(item => (
        <div key={item.id} className="pantry-item">
          <span>{item.ingredientName}</span>
          <span className="meta">{item.daysAgo} days ago</span>
          <button onClick={() => dismiss(item.id)}>✕ Don't have</button>
        </div>
      ))}
    </div>
  );
}
```

---

### 6. Background Jobs (Optional)

Cleanup expired acquisitions:

```python
# Run daily via cron/scheduler
def cleanup_expired_pantry_items():
    """Mark acquisitions past shelf life as expired."""
    pantry_service.cleanup_expired()
```

---

## Summary: What Gets Added/Changed

| Layer | Changes |
|-------|---------|
| Database | New `PantryAcquisition` table (or extend `ShoppingItemState`) |
| Config | New `pantry_config.py` with shelf-life mappings |
| Backend Services | New `PantryService`, updates to `ShoppingService` and `PlannerService` |
| AI Context | New `_build_pantry_context()` in `UserContextBuilder` |
| API | New `/api/pantry` endpoints, modify shopping check endpoint |
| Frontend | Shopping list hints, optional pantry panel, Meal Genie integration |
