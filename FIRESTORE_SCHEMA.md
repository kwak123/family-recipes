# Firestore Database Schema

## Overview

Multi-household meal planning with environment separation (dev/live).

---

## Environment Strategy

### Collection Naming
- **Development:** `dev-households`, `dev-recipes`, `dev-weekPlans`
- **Production:** `households`, `recipes`, `weekPlans`

Set via environment variable:
```bash
# .env.local
NODE_ENV=development  # or production
```

---

## Collections Structure

### 1. **households** (or dev-households)

Represents a family/group that plans meals together.

```typescript
{
  id: string;                    // Auto-generated document ID
  name: string;                  // "Smith Family", "Roommates Apt 4B"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  members: {
    [userId: string]: {
      name: string;              // "John Smith"
      email: string;             // "john@example.com"
      role: 'owner' | 'member';  // owner can manage members
      joinedAt: Timestamp;
    }
  };
  settings: {
    defaultServings: number;     // Default servings for recipes
    preferences: string[];       // ["vegetarian", "nut-free"]
  };
  favoriteIngredients: string[]; // ["chicken", "broccoli", "pasta"]
  favoriteRecipeIds: string[];   // ["recipe-123", "recipe-456"]
}
```

**Example:**
```json
{
  "id": "household-abc123",
  "name": "Smith Family",
  "createdAt": "2026-02-07T12:00:00Z",
  "updatedAt": "2026-02-07T12:00:00Z",
  "members": {
    "user-123": {
      "name": "Samuel Kwak",
      "email": "kwak123@gmail.com",
      "role": "owner",
      "joinedAt": "2026-02-07T12:00:00Z"
    },
    "user-456": {
      "name": "Jane Kwak",
      "email": "jane@example.com",
      "role": "member",
      "joinedAt": "2026-02-07T13:00:00Z"
    }
  },
  "settings": {
    "defaultServings": 4,
    "preferences": ["healthy", "quick meals"]
  },
  "favoriteIngredients": ["chicken", "broccoli", "pasta", "garlic", "olive oil"],
  "favoriteRecipeIds": ["recipe-xyz789", "recipe-abc111"]
}
```

---

### 2. **recipes** (or dev-recipes)

Stores both AI-generated and user-saved recipes.

```typescript
{
  id: string;                    // Auto-generated or AI-provided
  householdId: string;           // Which household saved this
  name: string;
  description: string;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  instructions: string[];
  tags: string[];
  source: 'ai' | 'manual';       // How it was created
  createdBy: string;             // userId
  createdAt: Timestamp;
  isArchived: boolean;           // Soft delete
}
```

**Example:**
```json
{
  "id": "recipe-xyz789",
  "householdId": "household-abc123",
  "name": "Quick Veggie Stir-Fry",
  "description": "A fast and healthy vegetarian stir-fry",
  "cookTimeMinutes": 20,
  "servings": 4,
  "ingredients": [
    { "name": "broccoli", "quantity": 2, "unit": "cups" },
    { "name": "soy sauce", "quantity": 3, "unit": "tbsp" }
  ],
  "instructions": [
    "Heat oil in wok",
    "Add vegetables",
    "Stir-fry for 5 minutes"
  ],
  "tags": ["vegetarian", "quick", "Asian"],
  "source": "ai",
  "createdBy": "user-123",
  "createdAt": "2026-02-07T14:00:00Z",
  "isArchived": false
}
```

---

### 3. **weekPlans** (or dev-weekPlans)

A household's meal plan for a specific week.

```typescript
{
  id: string;                    // Auto-generated
  householdId: string;
  weekStartDate: string;         // "2026-02-10" (Monday, ISO format)
  weekEndDate: string;           // "2026-02-16" (Sunday)
  recipes: Array<{
    recipeId: string;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    addedBy: string;             // userId
    addedAt: Timestamp;
  }>;
  generatedGroceryList: Array<{
    name: string;
    totalQuantity: number;
    unit: string;
    checkedOff: boolean;         // User can check off items
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Example:**
```json
{
  "id": "weekplan-def456",
  "householdId": "household-abc123",
  "weekStartDate": "2026-02-10",
  "weekEndDate": "2026-02-16",
  "recipes": [
    {
      "recipeId": "recipe-xyz789",
      "dayOfWeek": "monday",
      "mealType": "dinner",
      "addedBy": "user-123",
      "addedAt": "2026-02-07T15:00:00Z"
    },
    {
      "recipeId": "recipe-abc111",
      "dayOfWeek": "tuesday",
      "mealType": "dinner",
      "addedBy": "user-456",
      "addedAt": "2026-02-07T16:00:00Z"
    }
  ],
  "generatedGroceryList": [
    {
      "name": "broccoli",
      "totalQuantity": 4,
      "unit": "cups",
      "checkedOff": false
    },
    {
      "name": "soy sauce",
      "totalQuantity": 6,
      "unit": "tbsp",
      "checkedOff": true
    }
  ],
  "createdAt": "2026-02-07T15:00:00Z",
  "updatedAt": "2026-02-07T16:30:00Z"
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: check if user is household member
    function isMember(householdId, userId) {
      return exists(/databases/$(database)/documents/households/$(householdId))
        && get(/databases/$(database)/documents/households/$(householdId)).data.members[userId] != null;
    }

    // Helper function: check if user is household owner
    function isOwner(householdId, userId) {
      return exists(/databases/$(database)/documents/households/$(householdId))
        && get(/databases/$(database)/documents/households/$(householdId)).data.members[userId].role == 'owner';
    }

    // Households
    match /households/{householdId} {
      allow read: if request.auth != null && isMember(householdId, request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && isOwner(householdId, request.auth.uid);
      allow delete: if request.auth != null && isOwner(householdId, request.auth.uid);
    }

    // Dev Households (same rules)
    match /dev-households/{householdId} {
      allow read: if request.auth != null && isMember(householdId, request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && isOwner(householdId, request.auth.uid);
      allow delete: if request.auth != null && isOwner(householdId, request.auth.uid);
    }

    // Recipes
    match /recipes/{recipeId} {
      allow read: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow create: if request.auth != null
        && isMember(request.resource.data.householdId, request.auth.uid);
      allow update, delete: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
    }

    // Dev Recipes (same rules)
    match /dev-recipes/{recipeId} {
      allow read: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow create: if request.auth != null
        && isMember(request.resource.data.householdId, request.auth.uid);
      allow update, delete: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
    }

    // Week Plans
    match /weekPlans/{planId} {
      allow read: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow create: if request.auth != null
        && isMember(request.resource.data.householdId, request.auth.uid);
      allow update: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow delete: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
    }

    // Dev Week Plans (same rules)
    match /dev-weekPlans/{planId} {
      allow read: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow create: if request.auth != null
        && isMember(request.resource.data.householdId, request.auth.uid);
      allow update: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
      allow delete: if request.auth != null
        && isMember(resource.data.householdId, request.auth.uid);
    }
  }
}
```

---

## TypeScript Interfaces

Update `src/lib/types.ts`:

```typescript
import { Timestamp } from 'firebase/firestore';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  householdId: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  source: 'ai' | 'manual';
  createdBy: string;
  createdAt: Timestamp | Date;
  isArchived: boolean;
}

export interface HouseholdMember {
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp | Date;
}

export interface Household {
  id: string;
  name: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  members: {
    [userId: string]: HouseholdMember;
  };
  settings: {
    defaultServings: number;
    preferences: string[];
  };
  favoriteIngredients: string[];
  favoriteRecipeIds: string[];
}

export interface WeekPlanRecipe {
  recipeId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  addedBy: string;
  addedAt: Timestamp | Date;
}

export interface GroceryItem {
  name: string;
  totalQuantity: number;
  unit: string;
  checkedOff?: boolean;
}

export interface WeekPlan {
  id: string;
  householdId: string;
  weekStartDate: string;
  weekEndDate: string;
  recipes: WeekPlanRecipe[];
  generatedGroceryList: GroceryItem[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}
```

---

## Indexes (Firestore Composite Indexes)

Create these in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "recipes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "householdId", "order": "ASCENDING" },
        { "fieldPath": "isArchived", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "weekPlans",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "householdId", "order": "ASCENDING" },
        { "fieldPath": "weekStartDate", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Query Examples

### Get household's recipes
```typescript
const recipesQuery = query(
  collection(db, 'recipes'),
  where('householdId', '==', householdId),
  where('isArchived', '==', false),
  orderBy('createdAt', 'desc')
);
```

### Get current week plan
```typescript
const weekPlanQuery = query(
  collection(db, 'weekPlans'),
  where('householdId', '==', householdId),
  where('weekStartDate', '==', getCurrentWeekStart()),
  limit(1)
);
```

### Get household members
```typescript
const householdDoc = await getDoc(doc(db, 'households', householdId));
const members = householdDoc.data()?.members;
```

---

## Migration from In-Memory to Firestore

### Current Flow:
1. User generates recipes → stored in memory
2. User adds to week plan → stored in memory
3. Grocery list generated on-the-fly

### New Flow:
1. User generates recipes → **saved to Firestore `recipes` collection**
2. User adds to week plan → **updates Firestore `weekPlans` document**
3. Grocery list → **calculated and stored in `weekPlans.generatedGroceryList`**

---

## Favorite Features

### Favorite Ingredients
Stored in `household.favoriteIngredients` array.

**UI Flow:**
1. Home page shows multi-select dropdown with favorite ingredients
2. User selects ingredients they want to use (e.g., "chicken", "broccoli", "pasta")
3. Selected ingredients are injected into AI prompt
4. AI generates recipes that prioritize those ingredients

**Prompt Enhancement:**
```typescript
function buildUserPrompt(preferences: string, favoriteIngredients: string[]): string {
  let prompt = `Generate recipes based on these preferences: ${preferences}`;

  if (favoriteIngredients.length > 0) {
    prompt += `\n\nIMPORTANT: Try to incorporate these favorite ingredients: ${favoriteIngredients.join(', ')}. These are ingredients the household loves and wants to use regularly.`;
  }

  return prompt;
}
```

**Managing Favorites:**
- Add ingredient: Button on home page or recipe detail
- Remove ingredient: Manage in household settings page
- Suggested ingredients: Show common ingredients from saved recipes

### Favorite Recipes
Stored in `household.favoriteRecipeIds` array.

**UI Flow:**
1. Recipe cards show a "⭐ Favorite" button
2. Click to add/remove from favorites
3. Week Plan page shows "Favorites" tab to quickly add favorite recipes
4. Recipe generation can be biased toward similar recipes

**Features:**
- Quick add to week plan from favorites
- "Generate similar recipes" button on favorite recipes
- Show favorite count/ranking
- Filter recipes by favorites

**API Endpoints:**
- `POST /api/households/{id}/favorites/recipes` - Add recipe to favorites
- `DELETE /api/households/{id}/favorites/recipes/{recipeId}` - Remove from favorites
- `POST /api/households/{id}/favorites/ingredients` - Add ingredient
- `DELETE /api/households/{id}/favorites/ingredients/{ingredient}` - Remove ingredient

---

## Query Examples (Updated)

### Get household with favorites
```typescript
const householdDoc = await getDoc(doc(db, 'households', householdId));
const household = householdDoc.data();
const favoriteRecipeIds = household?.favoriteRecipeIds || [];
const favoriteIngredients = household?.favoriteIngredients || [];
```

### Get favorite recipes
```typescript
// Query recipes where id is in favoriteRecipeIds
const favoriteRecipesQuery = query(
  collection(db, 'recipes'),
  where('id', 'in', favoriteRecipeIds),
  where('isArchived', '==', false)
);
```

### Add favorite ingredient
```typescript
await updateDoc(doc(db, 'households', householdId), {
  favoriteIngredients: arrayUnion('chicken')
});
```

### Remove favorite recipe
```typescript
await updateDoc(doc(db, 'households', householdId), {
  favoriteRecipeIds: arrayRemove('recipe-xyz789')
});
```

---

## Next Steps

1. Set up Firebase project in Google Cloud Console
2. Install Firebase SDK: `npm install firebase firebase-admin`
3. Add Firebase config to `.env.local`
4. Update `src/lib/types.ts` with new interfaces
5. Create `src/lib/firebase.ts` for initialization
6. Implement `src/lib/firestore-db.ts` to replace `db.ts`
7. Update API routes to use Firestore
8. Add authentication (Firebase Auth)
9. Deploy Firestore security rules
10. Update recipe prompt to use favorite ingredients
11. Add favorite management UI components
