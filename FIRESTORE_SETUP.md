# Firestore Backend Setup Guide

Quick start guide to set up Firestore for the Family Recipes app.

## Step 1: Install Dependencies

The `package.json` has been updated to include `firebase-admin`. Install it by running:

```bash
npm install
```

This will install:
- `firebase-admin` - Firebase Admin SDK for server-side Firestore access
- `ts-node` - TypeScript execution for migration scripts

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" (or select existing)
3. Follow the setup wizard
4. Once created, go to "Build" → "Firestore Database"
5. Click "Create database"
6. Select "Start in production mode"
7. Choose your preferred region (e.g., `us-central1`)
8. Click "Enable"

## Step 3: Get Service Account Credentials

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Save the downloaded JSON file securely (**DO NOT commit to git**)

The JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important notes:**
- Copy `project_id` → `FIREBASE_PROJECT_ID`
- Copy `client_email` → `FIREBASE_CLIENT_EMAIL`
- Copy `private_key` → `FIREBASE_PRIVATE_KEY`
  - Keep it as ONE LINE with `\n` for newlines
  - Wrap in quotes: `"-----BEGIN...-----\n"`
  - Don't remove the `\n` characters - they're needed!

Example of properly formatted private key:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7Q...\n-----END PRIVATE KEY-----\n"
```

## Step 5: Test Connection

Run the connection test script:

```bash
npm run firestore:test
```

You should see:
```
🔧 Firestore Connection Test
============================================================

1️⃣ Checking environment variables...
   FIREBASE_PROJECT_ID: ✓ Set
   FIREBASE_CLIENT_EMAIL: ✓ Set
   FIREBASE_PRIVATE_KEY: ✓ Set

2️⃣ Initializing Firebase Admin SDK...
   ✓ Firebase Admin SDK initialized

3️⃣ Testing Firestore connection...
   ✓ Write test successful
   ✓ Read test successful
   ✓ Delete test successful

4️⃣ Fetching database statistics...

📊 Database Statistics:
   Users:      0
   Households: 0
   Recipes:    0
   Week Plans: 0
   Total:      0 documents

============================================================
✅ All tests passed! Firestore is ready to use.
============================================================
```

If you see errors, check:
- Environment variables are correct
- Private key is properly formatted (single line with `\n`)
- Firebase project has Firestore enabled
- Service account has correct permissions

## Step 6: Migrate Data (Optional)

If you have existing data in `data/db.json`, migrate it to Firestore:

```bash
# Backup your data first
cp data/db.json data/db.json.backup

# Run migration
npm run firestore:migrate
```

## Step 7: Update Your Application

The Firestore implementation is in `src/lib/firestore-db.ts`. To use it:

### Option A: Direct Replacement

Find and replace all imports in your API routes:

```typescript
// Before
import { getRecipesByHousehold } from '@/lib/json-db';

// After
import { getRecipesByHousehold } from '@/lib/firestore-db';
```

Add `await` to all database calls:

```typescript
// Before
const recipes = getRecipesByHousehold(householdId);

// After
const recipes = await getRecipesByHousehold(householdId);
```

### Option B: Using an Adapter (Recommended)

Create `src/lib/db.ts`:

```typescript
// Switch between implementations by changing this line
export * from './firestore-db';  // Use Firestore
// export * from './json-db';     // Use JSON (fallback)
```

Update your API routes to import from `@/lib/db`:

```typescript
import { getRecipesByHousehold } from '@/lib/db';

export async function GET(request: NextRequest) {
  const recipes = await getRecipesByHousehold(householdId);
  return NextResponse.json(recipes);
}
```

## Quick Reference

### Files Created

| File | Purpose |
|------|---------|
| `src/lib/firestore-db.ts` | Firestore implementation (drop-in replacement for json-db.ts) |
| `.env.example` | Template for environment variables |
| `FIRESTORE_MIGRATION.md` | Complete migration guide with detailed documentation |
| `FIRESTORE_IMPLEMENTATION_NOTES.md` | Technical reference for developers |
| `FIRESTORE_SETUP.md` | This quick setup guide |
| `scripts/test-firestore-connection.ts` | Connection test script |
| `scripts/migrate-to-firestore.ts` | Data migration script |
| `scripts/README.md` | Scripts documentation |

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run firestore:test` | Test Firestore connection and show database stats |
| `npm run firestore:migrate` | Migrate data from JSON to Firestore |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | ✅ Yes | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ Yes | Service account private key (one line with `\n`) |

## Troubleshooting

### "Missing Firebase credentials"

- Make sure `.env.local` exists in the project root
- Verify all three Firebase environment variables are set
- Check that there are no typos in variable names

### "Permission denied"

- Ensure Firestore is enabled in your Firebase project
- Verify service account has correct roles (Firebase Admin or Cloud Datastore User)
- Check that you downloaded credentials from the correct project

### "Library not loaded" or node errors

- Your system may have multiple node versions
- Try using nvm to manage node versions
- Or run: `brew reinstall node` (macOS)

### Private key format errors

The private key must be:
- One continuous line
- Include `\n` characters (not actual newlines)
- Wrapped in double quotes
- Include the full key from `-----BEGIN` to `-----END`

Correct:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Incorrect:
```env
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Create Firebase project and enable Firestore
3. ✅ Get service account credentials
4. ✅ Set environment variables in `.env.local`
5. ✅ Test connection: `npm run firestore:test`
6. ⬜ Migrate data (if applicable): `npm run firestore:migrate`
7. ⬜ Update API routes to use Firestore
8. ⬜ Test your application thoroughly
9. ⬜ Deploy Firestore security rules (see FIRESTORE_MIGRATION.md)

## Resources

- 📖 [FIRESTORE_MIGRATION.md](./FIRESTORE_MIGRATION.md) - Complete migration guide
- 📖 [FIRESTORE_IMPLEMENTATION_NOTES.md](./FIRESTORE_IMPLEMENTATION_NOTES.md) - Technical details
- 📖 [scripts/README.md](./scripts/README.md) - Scripts documentation
- 🔗 [Firebase Documentation](https://firebase.google.com/docs)
- 🔗 [Firestore Documentation](https://firebase.google.com/docs/firestore)
- 🔗 [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Need help?** Check the troubleshooting section above or review the detailed documentation in `FIRESTORE_MIGRATION.md`.
