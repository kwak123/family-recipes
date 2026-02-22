# Firestore Backend Integration - Complete Guide

This directory contains a complete Firestore backend implementation for the Family Recipes app, ready to replace the current JSON file-based database.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase** (see [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md))

3. **Test connection:**
   ```bash
   npm run firestore:test
   ```

4. **Migrate data:**
   ```bash
   npm run firestore:migrate
   ```

## Documentation Overview

### Setup & Migration

| File | Purpose | When to Read |
|------|---------|--------------|
| **[FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)** | Quick setup guide | Start here - step-by-step setup instructions |
| **[FIRESTORE_MIGRATION.md](./FIRESTORE_MIGRATION.md)** | Complete migration guide | Before migrating from JSON to Firestore |
| **[.env.example](./.env.example)** | Environment variable template | When configuring Firebase credentials |

### Technical Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| **[FIRESTORE_IMPLEMENTATION_NOTES.md](./FIRESTORE_IMPLEMENTATION_NOTES.md)** | API comparison & developer guide | When updating code to use Firestore |
| **[FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md)** | Firestore schema documentation | For understanding data structure |
| **[scripts/README.md](./scripts/README.md)** | Migration scripts documentation | Before running migration scripts |

### Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/firestore-db.ts` | Firestore database implementation (drop-in replacement) |
| `scripts/test-firestore-connection.ts` | Connection test script |
| `scripts/migrate-to-firestore.ts` | Data migration script |

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Next.js API Routes                    │
│  (src/app/api/recipes/route.ts, etc.)          │
└───────────────┬─────────────────────────────────┘
                │
                │ Import database functions
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  json-db.ts  │  │firestore-db.ts│
│  (Current)   │  │   (New)      │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ data/db.json │  │  Firestore   │
│  (File)      │  │  (Cloud DB)  │
└──────────────┘  └──────────────┘
```

## Key Features

### ✅ Implemented

- **Complete function parity** - All functions from json-db.ts are implemented
- **Identical interface** - Only difference is async/await requirement
- **User management** - Create, read, update users
- **Household management** - Multi-user households with invites
- **Recipe storage** - AI-generated and manual recipes
- **Week planning** - Meal plans with automatic grocery list generation
- **Favorites** - Favorite recipes and ingredients per household
- **Migration tools** - Automated data migration from JSON to Firestore
- **Testing scripts** - Connection test and database stats

### 🔄 Migration Path

The implementation provides three migration strategies:

1. **Direct replacement** - Find/replace imports (fastest, all-or-nothing)
2. **Adapter pattern** - Single point of switching (recommended)
3. **Feature flag** - Environment variable toggle (safest for testing)

See [FIRESTORE_IMPLEMENTATION_NOTES.md](./FIRESTORE_IMPLEMENTATION_NOTES.md) for details.

## Important Schema Notes

### Current vs. Planned Schema

**⚠️ Note:** There's a schema difference between the existing documentation and current implementation:

**Current Implementation (json-db.ts & firestore-db.ts):**
```typescript
interface Household {
  ownerId: string;           // Single owner user ID
  memberIds: string[];       // Array of all member IDs (including owner)
  // ...
}
```

**FIRESTORE_SCHEMA.md (future consideration):**
```typescript
interface Household {
  members: {                 // Map of userId -> member details
    [userId]: {
      role: 'owner' | 'member';
      name: string;
      email: string;
      // ...
    }
  }
}
```

**Current implementation uses the simpler array-based approach** for easier compatibility with the existing JSON database. The map-based approach in FIRESTORE_SCHEMA.md is a future consideration for more robust member management.

### Users Collection

**Important:** The current implementation does NOT use a separate `users` collection like a traditional auth system. Instead:
- User data is stored in the `users` collection with Google OAuth IDs
- Users belong to households via `householdIds` array
- Home invites are stored in user documents

This matches the existing json-db.ts implementation.

## NPM Scripts

```bash
# Development
npm run dev              # Start Next.js dev server

# Firestore operations
npm run firestore:test   # Test Firestore connection
npm run firestore:migrate # Migrate data from JSON to Firestore

# Build & deployment
npm run build            # Build for production
npm run start            # Start production server
```

## Environment Variables Required

```env
# Firebase Admin SDK (required for Firestore)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Existing variables (already configured)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
GEMINI_API_KEY=...
```

## Database Operations Comparison

| Operation | JSON Database | Firestore Database |
|-----------|---------------|-------------------|
| **Read user** | Synchronous file read | Async document get |
| **Create recipe** | Read entire file → modify → write entire file | Single document write |
| **Update household** | Read entire file → modify → write entire file | Single document update |
| **Query recipes** | Filter all recipes in memory | Indexed query (fast) |
| **Batch operations** | Multiple file writes | Single atomic batch write |
| **Concurrency** | File locking issues | Optimistic locking |
| **Scalability** | Limited by file size | Unlimited (auto-sharding) |

## Common Tasks

### Testing Firestore Connection

```bash
npm run firestore:test
```

Expected output:
```
✅ All tests passed! Firestore is ready to use.
📊 Database Statistics: 0 documents
```

### Migrating Existing Data

```bash
# Backup first
cp data/db.json data/db.json.backup

# Run migration
npm run firestore:migrate
```

### Updating a Single API Route

**Before:**
```typescript
import { getRecipesByHousehold } from '@/lib/json-db';

export async function GET(request: NextRequest) {
  const recipes = getRecipesByHousehold(householdId);
  return NextResponse.json(recipes);
}
```

**After:**
```typescript
import { getRecipesByHousehold } from '@/lib/firestore-db';

export async function GET(request: NextRequest) {
  const recipes = await getRecipesByHousehold(householdId);
  return NextResponse.json(recipes);
}
```

### Switching All Routes at Once (Adapter Pattern)

1. Create `src/lib/db.ts`:
   ```typescript
   // Toggle between implementations here
   export * from './firestore-db';  // Use Firestore
   // export * from './json-db';     // Use JSON (rollback)
   ```

2. Update all routes to import from `@/lib/db`:
   ```typescript
   import { getRecipesByHousehold } from '@/lib/db';
   ```

3. To switch back, just change the export in `db.ts`

## Troubleshooting

### "Missing Firebase credentials"

1. Check `.env.local` exists in project root
2. Verify all three Firebase variables are set
3. Ensure private key is one line with `\n` characters

### "Permission denied" errors

1. Verify Firestore is enabled in Firebase Console
2. Check service account has correct permissions
3. Ensure you're using the right project credentials

### Migration shows 0 items

1. Verify `data/db.json` exists
2. Check the file has actual data
3. Ensure you're in the project root directory

### Node/npm errors

This worktree had some node environment issues. If `npm install` fails:
1. Try using a different node version manager
2. Or install packages one at a time:
   ```bash
   npm install firebase-admin
   npm install ts-node --save-dev
   ```

## Security Considerations

### Current State (Development)

The Firestore implementation currently has **no security rules** applied. This is fine for development but **must be addressed before production**.

### Before Production

1. Deploy security rules (see FIRESTORE_MIGRATION.md)
2. Ensure all users are authenticated
3. Test permission boundaries
4. Set up Firestore indexes for performance

### Security Rules Location

The FIRESTORE_SCHEMA.md file contains example security rules. Deploy them with:
```bash
firebase deploy --only firestore:rules
```

## Performance Optimization

### JSON Database (Current)
- Good for: Small datasets, simple development
- Issues: Reads entire file on every operation, poor concurrency

### Firestore Database (New)
- Good for: Production, multiple users, scalability
- Optimization tips:
  - Add composite indexes for complex queries
  - Use batch operations for multiple writes
  - Cache frequently accessed data (e.g., current user)
  - Monitor quota usage in Firebase Console

## Next Steps

1. ✅ **Setup** - Follow [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)
2. ✅ **Test** - Run `npm run firestore:test`
3. ✅ **Migrate** - Run `npm run firestore:migrate`
4. ⬜ **Update Routes** - Switch API routes to use firestore-db
5. ⬜ **Test App** - Verify all features work with Firestore
6. ⬜ **Deploy Rules** - Add security rules before production
7. ⬜ **Monitor** - Watch for errors and performance issues
8. ⬜ **Optimize** - Add indexes as needed

## Support

For detailed information on specific topics:

- **Getting started**: [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)
- **Migration process**: [FIRESTORE_MIGRATION.md](./FIRESTORE_MIGRATION.md)
- **Code changes**: [FIRESTORE_IMPLEMENTATION_NOTES.md](./FIRESTORE_IMPLEMENTATION_NOTES.md)
- **Data structure**: [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md)
- **Scripts usage**: [scripts/README.md](./scripts/README.md)

## Contributing

When updating the Firestore implementation:

1. Maintain function signature parity with json-db.ts
2. Add appropriate error handling
3. Use batch operations for multiple writes
4. Test with the migration scripts
5. Update documentation if schema changes

---

**Ready to get started?** Head to [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for step-by-step instructions.
