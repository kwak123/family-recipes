# Firestore Implementation Notes

Quick reference for developers working with the Firestore backend implementation.

## File Structure

```
src/lib/
├── types.ts           # Shared TypeScript types (unchanged)
├── json-db.ts         # Original JSON file-based database
└── firestore-db.ts    # New Firestore-based database (drop-in replacement)
```

## Key Differences

### Synchronous vs Asynchronous

**JSON Database (json-db.ts)**
```typescript
// Synchronous operations
const user = getUser(userId);
const recipes = getRecipesByHousehold(householdId);
```

**Firestore Database (firestore-db.ts)**
```typescript
// Asynchronous operations - ALL functions return Promises
const user = await getUser(userId);
const recipes = await getRecipesByHousehold(householdId);
```

### API Route Updates Required

When switching to Firestore, update all API routes to use `await`:

**Before (json-db):**
```typescript
import { getRecipesByHousehold } from '@/lib/json-db';

export async function GET(request: NextRequest) {
  const recipes = getRecipesByHousehold(householdId);
  return NextResponse.json(recipes);
}
```

**After (firestore-db):**
```typescript
import { getRecipesByHousehold } from '@/lib/firestore-db';

export async function GET(request: NextRequest) {
  const recipes = await getRecipesByHousehold(householdId);
  return NextResponse.json(recipes);
}
```

## Function Interface Compatibility

Both implementations export the exact same functions with the same parameters. Only the return type changes (Firestore adds `Promise<>`):

### User Operations

| Function | JSON Return Type | Firestore Return Type |
|----------|------------------|----------------------|
| `getUser(userId)` | `User \| null` | `Promise<User \| null>` |
| `createUser(...)` | `User` | `Promise<User>` |
| `updateUserLastLogin(userId)` | `User` | `Promise<User>` |
| `getUserHouseholds(userId)` | `Household[]` | `Promise<Household[]>` |
| `getUserByEmail(email)` | `User \| null` | `Promise<User \| null>` |
| `setCurrentHome(userId, homeId)` | `User` | `Promise<User>` |
| `sendHomeInvite(...)` | `{ success, message }` | `Promise<{ success, message }>` |
| `getUserInvites(userId)` | `Household[]` | `Promise<Household[]>` |
| `acceptHomeInvite(userId, homeId)` | `Household` | `Promise<Household>` |
| `declineHomeInvite(userId, homeId)` | `void` | `Promise<void>` |

### Household Operations

| Function | JSON Return Type | Firestore Return Type |
|----------|------------------|----------------------|
| `getHousehold(householdId)` | `Household \| null` | `Promise<Household \| null>` |
| `createHousehold(name, ownerId)` | `Household` | `Promise<Household>` |
| `updateHousehold(id, updates)` | `Household` | `Promise<Household>` |
| `addFavoriteRecipe(id, recipeId)` | `Household` | `Promise<Household>` |
| `removeFavoriteRecipe(id, recipeId)` | `Household` | `Promise<Household>` |
| `addFavoriteIngredient(id, ingredient)` | `Household` | `Promise<Household>` |
| `removeFavoriteIngredient(id, ingredient)` | `Household` | `Promise<Household>` |
| `addHouseholdMember(id, userId)` | `Household` | `Promise<Household>` |
| `removeHouseholdMember(id, userId)` | `Household` | `Promise<Household>` |
| `isHouseholdOwner(id, userId)` | `boolean` | `Promise<boolean>` |
| `isHouseholdMember(id, userId)` | `boolean` | `Promise<boolean>` |

### Recipe Operations

| Function | JSON Return Type | Firestore Return Type |
|----------|------------------|----------------------|
| `getRecipe(recipeId)` | `Recipe \| null` | `Promise<Recipe \| null>` |
| `getRecipesByHousehold(id, archived?)` | `Recipe[]` | `Promise<Recipe[]>` |
| `getFavoriteRecipes(householdId)` | `Recipe[]` | `Promise<Recipe[]>` |
| `saveRecipe(recipe)` | `Recipe` | `Promise<Recipe>` |
| `saveRecipes(recipes)` | `Recipe[]` | `Promise<Recipe[]>` |
| `updateRecipe(id, updates)` | `Recipe` | `Promise<Recipe>` |
| `archiveRecipe(recipeId)` | `Recipe` | `Promise<Recipe>` |

### Week Plan Operations

| Function | JSON Return Type | Firestore Return Type |
|----------|------------------|----------------------|
| `getWeekPlan(householdId, date)` | `WeekPlan \| null` | `Promise<WeekPlan \| null>` |
| `getCurrentWeekPlan(householdId)` | `WeekPlan \| null` | `Promise<WeekPlan \| null>` |
| `createWeekPlan(householdId, date)` | `WeekPlan` | `Promise<WeekPlan>` |
| `addRecipeToWeekPlan(...)` | `WeekPlan` | `Promise<WeekPlan>` |
| `removeRecipeFromWeekPlan(...)` | `WeekPlan` | `Promise<WeekPlan>` |
| `updateGroceryItemChecked(...)` | `WeekPlan` | `Promise<WeekPlan>` |

### Dev Operations

| Function | JSON Return Type | Firestore Return Type |
|----------|------------------|----------------------|
| `purgeDatabase()` | `void` | `Promise<void>` |
| `getDatabaseStats()` | `{ users, households, recipes, weekPlans }` | `Promise<{ users, households, recipes, weekPlans }>` |

## Implementation Details

### ID Generation

Both implementations use the same ID generation format:
- Users: Google OAuth ID (externally provided)
- Households: `household-{timestamp}-{random}`
- Recipes: `recipe-{timestamp}-{random}`
- Week Plans: `weekplan-{timestamp}-{random}`

### Timestamps

Both implementations use ISO 8601 strings for timestamps:
```typescript
createdAt: "2026-02-22T12:00:00.000Z"
```

Firestore internally uses `Timestamp` objects but converts them to/from ISO strings for consistency.

### Array Operations

**JSON Database:**
```typescript
// Manually manages arrays
household.favoriteRecipeIds.push(recipeId);
household.favoriteRecipeIds = household.favoriteRecipeIds.filter(id => id !== recipeId);
```

**Firestore Database:**
```typescript
// Uses atomic array operations
await householdRef.update({
  favoriteRecipeIds: admin.firestore.FieldValue.arrayUnion(recipeId)  // Add
});

await householdRef.update({
  favoriteRecipeIds: admin.firestore.FieldValue.arrayRemove(recipeId)  // Remove
});
```

### Batch Operations

**JSON Database:**
```typescript
// Writes entire database on every operation
writeDatabase(db);
```

**Firestore Database:**
```typescript
// Uses batched writes for multiple operations
const batch = db.batch();
batch.set(docRef1, data1);
batch.update(docRef2, data2);
await batch.commit();  // Atomic operation
```

### Default Household

Both implementations automatically create a default household with ID `default-household` if it doesn't exist when accessed.

## Error Handling

Both implementations throw errors for:
- User not found
- Household not found
- Recipe not found
- Permission denied operations
- Invalid operations (e.g., removing household owner)

Firestore adds additional potential errors:
- Network failures
- Permission denied (Firestore security rules)
- Quota exceeded
- Invalid credentials

## Performance Considerations

### JSON Database
- **Reads**: Fast for small datasets (entire file in memory)
- **Writes**: Slow (writes entire file on every change)
- **Scaling**: Poor (file size grows linearly)
- **Concurrency**: Limited (file locking)

### Firestore Database
- **Reads**: Fast with proper indexing
- **Writes**: Fast (only updates affected documents)
- **Scaling**: Excellent (automatic sharding)
- **Concurrency**: Excellent (atomic operations, transactions)

### Query Optimization

**Recipes by household:**
- JSON: Filters all recipes in memory
- Firestore: Uses indexed query (`where('householdId', '==', id)`)

**Favorite recipes:**
- JSON: Simple array lookup
- Firestore: Batched queries (10 IDs per batch due to `in` operator limit)

## Migration Checklist

When switching from json-db to firestore-db:

- [ ] Install `firebase-admin` package
- [ ] Set Firebase environment variables in `.env.local`
- [ ] Test Firestore connection: `npm run firestore:test`
- [ ] Migrate data: `npm run firestore:migrate`
- [ ] Update all API routes to use `await` with database functions
- [ ] Update imports from `@/lib/json-db` to `@/lib/firestore-db`
- [ ] Test all functionality thoroughly
- [ ] Deploy Firestore security rules
- [ ] Monitor for errors and performance issues

## Security Rules Example

After migration, add Firestore security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Household members can read/write household data
    match /households/{householdId} {
      allow read, write: if request.auth.uid in resource.data.memberIds;
    }

    // Recipes accessible by household members
    match /recipes/{recipeId} {
      allow read, write: if request.auth.uid in
        get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.memberIds;
    }

    // Week plans accessible by household members
    match /weekPlans/{weekPlanId} {
      allow read, write: if request.auth.uid in
        get(/databases/$(database)/documents/households/$(resource.data.householdId)).data.memberIds;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Testing

Create parallel tests to ensure both implementations behave identically:

```typescript
import * as jsonDb from '@/lib/json-db';
import * as firestoreDb from '@/lib/firestore-db';

describe('Database parity', () => {
  it('should return same user data', async () => {
    const userId = 'test-user-123';

    const jsonUser = jsonDb.getUser(userId);
    const firestoreUser = await firestoreDb.getUser(userId);

    expect(firestoreUser).toEqual(jsonUser);
  });
});
```

## Support

For issues or questions:
1. Check [FIRESTORE_MIGRATION.md](./FIRESTORE_MIGRATION.md) for detailed migration guide
2. Review Firebase error logs in the console
3. Verify environment variables are set correctly
4. Check Firestore quotas and limits
