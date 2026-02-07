# Favorites Feature - Implementation Guide

## Overview

Added two new favorite features to enhance meal planning:
1. **Favorite Recipes** - Quick access to household's favorite recipes
2. **Favorite Ingredients** - Prioritize recipes with preferred ingredients

---

## Database Changes

### Updated Household Schema

```typescript
interface Household {
  // ... existing fields
  favoriteIngredients: string[];  // NEW: ["chicken", "broccoli", "pasta"]
  favoriteRecipeIds: string[];    // NEW: ["recipe-123", "recipe-456"]
}
```

**Example:**
```json
{
  "id": "household-abc123",
  "name": "Smith Family",
  "favoriteIngredients": ["chicken", "broccoli", "pasta", "garlic", "olive oil"],
  "favoriteRecipeIds": ["recipe-xyz789", "recipe-abc111"]
}
```

---

## Favorite Ingredients Feature

### How It Works

1. **User Flow:**
   - Home page has multi-select dropdown with favorite ingredients
   - User selects which ingredients they want to use
   - Selected ingredients + preferences → sent to API
   - AI generates recipes prioritizing those ingredients

2. **AI Prompt Enhancement:**
   ```
   "IMPORTANT: Try to incorporate these favorite ingredients: chicken, broccoli, pasta.
   These are ingredients the household loves and wants to use regularly.
   Prioritize recipes that use one or more of these ingredients."
   ```

3. **Management:**
   - Add ingredients from recipe detail pages
   - Manage in household settings
   - Show suggested ingredients from saved recipes

### API Changes

**Updated Endpoint:**
```typescript
POST /api/recipes/generate
{
  "preferences": "quick weeknight meals",
  "favoriteIngredients": ["chicken", "broccoli", "garlic"]  // NEW
}
```

**Response:** Same as before, but recipes prioritize favorite ingredients.

---

## Favorite Recipes Feature

### How It Works

1. **User Flow:**
   - Recipe cards show "⭐ Favorite" button
   - Click to toggle favorite status
   - Week Plan page has "Favorites" tab
   - Quick-add favorite recipes to week plan

2. **Features:**
   - Filter recipes by favorites
   - "Generate similar" button on favorites
   - Show favorite count/popularity
   - One-click add to week plan

### New API Endpoints

```typescript
// Add recipe to favorites
POST /api/households/{householdId}/favorites/recipes
Body: { recipeId: "recipe-123" }

// Remove from favorites
DELETE /api/households/{householdId}/favorites/recipes/{recipeId}

// Add favorite ingredient
POST /api/households/{householdId}/favorites/ingredients
Body: { ingredient: "chicken" }

// Remove favorite ingredient
DELETE /api/households/{householdId}/favorites/ingredients/{ingredient}

// Get favorite recipes (full data)
GET /api/households/{householdId}/favorites/recipes
```

---

## UI Components to Build

### 1. Favorite Ingredients Selector (Home Page)

```typescript
// components/FavoriteIngredientsSelector/FavoriteIngredientsSelector.tsx
interface Props {
  availableIngredients: string[];
  selectedIngredients: string[];
  onSelectionChange: (ingredients: string[]) => void;
}

// Shows multi-select dropdown
// Loads from household.favoriteIngredients
// User can select multiple to use in search
```

### 2. Manage Ingredients (Settings Page)

```typescript
// components/ManageIngredients/ManageIngredients.tsx
// Add/remove favorite ingredients
// Show ingredient usage frequency
// Suggest popular ingredients
```

### 3. Favorite Button (Recipe Card)

```typescript
// Update RecipeCard component
// Add ⭐ button that toggles favorite
// Show filled star if favorited
// onClick → POST/DELETE to favorites API
```

### 4. Favorites Tab (Week Plan Page)

```typescript
// New tab in Week Plan page
// Shows only favorite recipes
// Quick "Add to Week" button
// Filter by day/meal type
```

---

## Firestore Operations

### Add Favorite Recipe
```typescript
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

await updateDoc(doc(db, 'households', householdId), {
  favoriteRecipeIds: arrayUnion(recipeId)
});
```

### Remove Favorite Recipe
```typescript
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

await updateDoc(doc(db, 'households', householdId), {
  favoriteRecipeIds: arrayRemove(recipeId)
});
```

### Query Favorite Recipes
```typescript
import { collection, query, where } from 'firebase/firestore';

const favoriteIds = household.favoriteRecipeIds;

// Option 1: Get all recipes, filter in memory
const allRecipes = await getDocs(
  query(collection(db, 'recipes'), where('householdId', '==', householdId))
);
const favorites = allRecipes.docs
  .filter(doc => favoriteIds.includes(doc.id))
  .map(doc => doc.data());

// Option 2: Use 'in' operator (max 10 IDs at a time)
const favorites = await getDocs(
  query(
    collection(db, 'recipes'),
    where('id', 'in', favoriteIds.slice(0, 10))
  )
);
```

### Add Favorite Ingredient
```typescript
await updateDoc(doc(db, 'households', householdId), {
  favoriteIngredients: arrayUnion('chicken')
});
```

---

## Code Files Updated

1. ✅ **FIRESTORE_SCHEMA.md**
   - Added `favoriteIngredients` and `favoriteRecipeIds` to Household
   - Added query examples
   - Added API endpoint specs

2. ✅ **src/lib/recipe-prompt.ts**
   - Updated `buildUserPrompt()` to accept `favoriteIngredients` parameter
   - Injects ingredients into prompt

3. ✅ **src/lib/ai-providers/gemini.ts**
   - Updated `generateRecipesWithGemini()` signature
   - Passes favorite ingredients to prompt builder

---

## Implementation Checklist

### Phase 1: Backend (Priority)
- [ ] Update `src/lib/types.ts` with new Household fields
- [ ] Create API routes for favorites management
- [ ] Update recipe generation API to accept favoriteIngredients
- [ ] Test Firestore operations (add/remove favorites)

### Phase 2: UI Components
- [ ] Create `FavoriteIngredientsSelector` component
- [ ] Add favorite button to `RecipeCard`
- [ ] Create favorites tab in Week Plan page
- [ ] Add ingredient management in settings

### Phase 3: Integration
- [ ] Connect ingredients selector to recipe generation
- [ ] Wire up favorite toggle buttons
- [ ] Implement favorites filtering
- [ ] Add loading/error states

### Phase 4: Polish
- [ ] Add animations (star fill, selection)
- [ ] Show ingredient usage stats
- [ ] "Generate similar" feature
- [ ] Keyboard shortcuts

---

## Example User Flow

### Scenario: Family wants quick chicken recipes

1. **Setup Favorites (one-time):**
   - Go to Settings → Manage Ingredients
   - Add: chicken, broccoli, garlic, pasta
   - Save

2. **Generate Recipes:**
   - Home page → see dropdown with saved ingredients
   - Select: chicken, broccoli
   - Type preferences: "quick weeknight meals"
   - Click "Generate"
   - AI returns recipes featuring chicken AND/OR broccoli

3. **Save Favorites:**
   - Love "Lemon Garlic Chicken" → click ⭐
   - Now in favorites list

4. **Next Week:**
   - Week Plan → Favorites tab
   - See "Lemon Garlic Chicken"
   - Click "Add to Monday Dinner"
   - Done!

---

## Benefits

✅ **Faster meal planning** - Quick access to proven recipes
✅ **Better AI results** - Recipes match household preferences
✅ **Less waste** - Use ingredients family already likes
✅ **Consistency** - Easy to repeat successful meals
✅ **Discovery** - "Generate similar" expands favorites
✅ **Collaboration** - All household members see/use favorites
