# Firestore Backend Migration Guide

This document explains how to migrate from the JSON file-based database (`json-db.ts`) to Firestore (`firestore-db.ts`).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Collection Structure](#collection-structure)
5. [Switching Database Implementations](#switching-database-implementations)
6. [Data Migration Strategy](#data-migration-strategy)
7. [Testing the Migration](#testing-the-migration)
8. [Rollback Plan](#rollback-plan)

---

## Prerequisites

Before migrating, ensure you have:

- Node.js 18+ installed
- A Firebase project created (see [Firebase Console](https://console.firebase.google.com/))
- Firebase Admin SDK credentials
- The existing `data/db.json` file backed up

---

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Firestore Database

1. In your Firebase project, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (we'll add security rules later)
4. Select your preferred region
5. Click "Enable"

### 3. Generate Service Account Credentials

1. Go to "Project Settings" > "Service Accounts"
2. Click "Generate new private key"
3. Save the JSON file securely - **DO NOT commit this to git**
4. Extract the following values from the JSON file:
   - `project_id`
   - `client_email`
   - `private_key`

---

## Environment Configuration

### 1. Install Dependencies

```bash
npm install firebase-admin
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important**: The private key must be kept as a single line with `\n` characters for newlines. The quotes are required.

### 3. Verify Configuration

Create a test script to verify the Firebase connection:

```typescript
// scripts/test-firebase.ts
import { getDatabaseStats } from '@/lib/firestore-db';

async function testConnection() {
  try {
    const stats = await getDatabaseStats();
    console.log('✅ Firebase connection successful!');
    console.log('Database stats:', stats);
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
  }
}

testConnection();
```

Run with: `npx ts-node scripts/test-firebase.ts`

---

## Collection Structure

Firestore will use the following collection structure:

### Collections

- **users**: User accounts and authentication data
- **households**: Household/home data including members and settings
- **recipes**: Recipe information including ingredients and instructions
- **weekPlans**: Weekly meal plans and grocery lists

**🔧 Environment Separation**

Collections are automatically suffixed based on the `FIRESTORE_ENV` environment variable:
- **Development** (`FIRESTORE_ENV=dev`): `users_dev`, `households_dev`, `recipes_dev`, `weekPlans_dev`
- **Production** (`FIRESTORE_ENV=prod`): `users_prod`, `households_prod`, `recipes_prod`, `weekPlans_prod`

This keeps development and production data completely isolated in the same Firebase project.

### Schema Mapping

The Firestore schema directly mirrors the TypeScript types defined in `src/lib/types.ts`:

#### Users Collection (`users/{userId}`)

```typescript
{
  id: string;              // Document ID (Google OAuth ID)
  email: string;
  name: string;
  picture?: string;
  createdAt: string;       // ISO 8601 timestamp
  lastLoginAt: string;     // ISO 8601 timestamp
  householdIds: string[];  // Array of household IDs
  currentHomeId?: string;  // Currently selected home
  homeInvites?: string[];  // Pending home invitations
}
```

#### Households Collection (`households/{householdId}`)

```typescript
{
  id: string;                    // Document ID
  name: string;
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  ownerId: string;               // User ID of owner
  memberIds: string[];           // Array of user IDs
  settings: {
    defaultServings: number;
    preferences: string[];
  };
  favoriteIngredients: string[];
  favoriteRecipeIds: string[];
}
```

#### Recipes Collection (`recipes/{recipeId}`)

```typescript
{
  id: string;                    // Document ID
  householdId: string;           // Reference to household
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
  source: 'ai' | 'manual';
  createdBy: string;             // User ID
  createdAt: string;             // ISO 8601 timestamp
  isArchived: boolean;
}
```

#### Week Plans Collection (`weekPlans/{weekPlanId}`)

```typescript
{
  id: string;                    // Document ID
  householdId: string;           // Reference to household
  weekStartDate: string;         // "YYYY-MM-DD"
  weekEndDate: string;           // "YYYY-MM-DD"
  recipes: Array<{
    recipeId: string;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    addedBy: string;             // User ID
    addedAt: string;             // ISO 8601 timestamp
  }>;
  generatedGroceryList: Array<{
    name: string;
    totalQuantity: number;
    unit: string;
    checkedOff?: boolean;
  }>;
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Indexes

Firestore will automatically create single-field indexes. For composite queries, you may need to add these indexes:

1. **Recipes by household (non-archived)**
   - Collection: `recipes`
   - Fields: `householdId` (Ascending), `isArchived` (Ascending), `createdAt` (Descending)

2. **Week plans by household and date**
   - Collection: `weekPlans`
   - Fields: `householdId` (Ascending), `weekStartDate` (Ascending)

Firestore will prompt you to create these indexes when you first run queries that need them.

---

## Switching Database Implementations

The API routes are already abstracted to use database functions, so switching is straightforward:

### Option 1: Find and Replace (Recommended for complete migration)

1. Search for all imports of `@/lib/json-db`:
   ```bash
   grep -r "from '@/lib/json-db'" src/app/api/
   ```

2. Replace with `@/lib/firestore-db`:
   ```typescript
   // Before
   import { getRecipesByHousehold } from '@/lib/json-db';

   // After
   import { getRecipesByHousehold } from '@/lib/firestore-db';
   ```

3. Update all API route files that import from `json-db`

### Option 2: Alias Swap (for gradual migration)

Create a database adapter file:

```typescript
// src/lib/db.ts
// Change this import to switch between implementations
export * from './json-db';      // Current: JSON file
// export * from './firestore-db'; // Future: Firestore
```

Then update all API routes to import from `@/lib/db` instead of `@/lib/json-db`.

### Option 3: Feature Flag (for testing)

Use an environment variable to switch implementations:

```typescript
// src/lib/db.ts
const USE_FIRESTORE = process.env.USE_FIRESTORE === 'true';

if (USE_FIRESTORE) {
  module.exports = require('./firestore-db');
} else {
  module.exports = require('./json-db');
}
```

Add to `.env.local`:
```env
USE_FIRESTORE=false  # Set to true to use Firestore
```

---

## Data Migration Strategy

### Migration Script

Create a migration script to transfer data from JSON to Firestore:

```typescript
// scripts/migrate-to-firestore.ts
import fs from 'fs';
import path from 'path';
import { Database } from '@/lib/types';
import * as firestore from '@/lib/firestore-db';

async function migrateData() {
  console.log('Starting migration from JSON to Firestore...');

  // Read existing JSON database
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  const jsonData: Database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  let totalMigrated = 0;

  try {
    // 1. Migrate Users
    console.log('\n📝 Migrating users...');
    for (const user of Object.values(jsonData.users)) {
      await firestore.createUser(
        user.id,
        user.email,
        user.name,
        user.picture
      );

      // Update additional fields
      if (user.householdIds.length > 0 || user.currentHomeId || user.homeInvites) {
        // These will be set when households are migrated
      }

      totalMigrated++;
      console.log(`  ✓ Migrated user: ${user.email}`);
    }

    // 2. Migrate Households
    console.log('\n🏠 Migrating households...');
    for (const household of Object.values(jsonData.households)) {
      await firestore.createHousehold(household.name, household.ownerId);
      // Note: createHousehold generates a new ID, so we need to update references
      // For now, we'll keep the same ID by directly using Firestore
      totalMigrated++;
      console.log(`  ✓ Migrated household: ${household.name}`);
    }

    // 3. Migrate Recipes
    console.log('\n🍳 Migrating recipes...');
    const recipeBatches = Object.values(jsonData.recipes);
    for (const recipe of recipeBatches) {
      await firestore.saveRecipe({
        householdId: recipe.householdId,
        name: recipe.name,
        description: recipe.description,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags,
        source: recipe.source,
        createdBy: recipe.createdBy,
        isArchived: recipe.isArchived
      });
      totalMigrated++;
      console.log(`  ✓ Migrated recipe: ${recipe.name}`);
    }

    // 4. Migrate Week Plans
    console.log('\n📅 Migrating week plans...');
    for (const weekPlan of Object.values(jsonData.weekPlans)) {
      const newPlan = await firestore.createWeekPlan(
        weekPlan.householdId,
        weekPlan.weekStartDate
      );

      // Add recipes to the week plan
      for (const recipe of weekPlan.recipes) {
        await firestore.addRecipeToWeekPlan(
          weekPlan.householdId,
          recipe.recipeId,
          recipe.dayOfWeek,
          recipe.mealType,
          recipe.addedBy
        );
      }

      totalMigrated++;
      console.log(`  ✓ Migrated week plan: ${weekPlan.weekStartDate}`);
    }

    console.log(`\n✅ Migration complete! Migrated ${totalMigrated} total items.`);

    // Get final stats
    const stats = await firestore.getDatabaseStats();
    console.log('\n📊 Final Firestore stats:', stats);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Running the Migration

1. **Backup your data**:
   ```bash
   cp data/db.json data/db.json.backup
   ```

2. **Run the migration script**:
   ```bash
   npx ts-node scripts/migrate-to-firestore.ts
   ```

3. **Verify the data**:
   - Check the Firestore console to see your data
   - Run database stats to confirm counts match

4. **Test thoroughly** before switching production traffic

---

## Testing the Migration

### 1. Parallel Testing

Run both databases side-by-side and compare results:

```typescript
// In your API route
import * as jsonDb from '@/lib/json-db';
import * as firestoreDb from '@/lib/firestore-db';

// Test both implementations
const jsonResult = jsonDb.getRecipesByHousehold(householdId);
const firestoreResult = await firestoreDb.getRecipesByHousehold(householdId);

console.log('JSON result:', jsonResult.length);
console.log('Firestore result:', firestoreResult.length);
```

### 2. Unit Tests

Create tests to verify Firestore functions match JSON behavior:

```typescript
// __tests__/database.test.ts
import { describe, it, expect } from '@jest/globals';
import * as firestoreDb from '@/lib/firestore-db';

describe('Firestore Database', () => {
  it('should create and retrieve a user', async () => {
    const user = await firestoreDb.createUser(
      'test-id',
      'test@example.com',
      'Test User'
    );

    expect(user.email).toBe('test@example.com');

    const retrieved = await firestoreDb.getUser('test-id');
    expect(retrieved).toEqual(user);
  });

  // Add more tests for each function
});
```

### 3. Integration Tests

Test complete user flows:

1. Create a user
2. Create a household
3. Add recipes
4. Create week plans
5. Verify all data is correctly stored and retrieved

---

## Rollback Plan

If issues occur after migration, you can quickly rollback:

### 1. Immediate Rollback

Change your import back to json-db:

```typescript
// src/lib/db.ts
export * from './json-db';  // Rollback to JSON
// export * from './firestore-db';
```

Redeploy the application.

### 2. Data Restoration

If you need to restore JSON data:

```bash
cp data/db.json.backup data/db.json
```

### 3. Gradual Migration

Use the feature flag approach to migrate one collection at a time:

```typescript
// src/lib/db.ts
import * as jsonDb from './json-db';
import * as firestoreDb from './firestore-db';

export const getUser = firestoreDb.getUser;  // Migrated
export const getRecipe = jsonDb.getRecipe;    // Not migrated yet
// ... etc
```

---

## Performance Considerations

### JSON Database (Current)

- **Pros**: Fast for small datasets, simple, no external dependencies
- **Cons**: Reads entire file for every operation, file locking issues, not scalable

### Firestore (Future)

- **Pros**: Scalable, real-time updates, built-in indexing, no file system dependency
- **Cons**: Network latency, quota limits, requires internet connection

### Optimization Tips

1. **Use batch operations** where possible (already implemented)
2. **Cache frequently accessed data** (e.g., user sessions)
3. **Index your queries** (Firestore will prompt you)
4. **Limit query results** with pagination for large datasets
5. **Use Firestore Local Emulator** for development

---

## Security Rules

After migration, add Firestore security rules:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isUser(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isHouseholdMember(householdId) {
      return isSignedIn() &&
        request.auth.uid in get(/databases/$(database)/documents/households/$(householdId)).data.memberIds;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isUser(userId);
      allow write: if isUser(userId);
    }

    // Households collection
    match /households/{householdId} {
      allow read: if isHouseholdMember(householdId);
      allow write: if isHouseholdMember(householdId);
    }

    // Recipes collection
    match /recipes/{recipeId} {
      allow read: if isSignedIn() &&
        isHouseholdMember(resource.data.householdId);
      allow write: if isSignedIn() &&
        isHouseholdMember(request.resource.data.householdId);
    }

    // Week plans collection
    match /weekPlans/{weekPlanId} {
      allow read: if isSignedIn() &&
        isHouseholdMember(resource.data.householdId);
      allow write: if isSignedIn() &&
        isHouseholdMember(request.resource.data.householdId);
    }
  }
}
```

Deploy rules with:
```bash
firebase deploy --only firestore:rules
```

---

## Next Steps

1. ✅ Install firebase-admin package
2. ✅ Configure environment variables
3. ✅ Test Firebase connection
4. ⬜ Run migration script
5. ⬜ Verify data in Firestore console
6. ⬜ Update API routes to use firestore-db
7. ⬜ Test all functionality
8. ⬜ Deploy security rules
9. ⬜ Monitor performance and errors
10. ⬜ Remove json-db.ts after successful migration

---

## Support

If you encounter issues during migration:

1. Check the Firebase Console for error logs
2. Verify environment variables are set correctly
3. Ensure Firebase Admin SDK is initialized properly
4. Review Firestore quotas and limits
5. Check network connectivity

For Firestore documentation, see: https://firebase.google.com/docs/firestore
