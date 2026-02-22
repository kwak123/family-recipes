# Firestore Migration Scripts

This directory contains utility scripts for migrating from the JSON database to Firestore.

## Scripts

### 1. test-firestore-connection.ts

Tests your Firestore connection and displays database statistics.

**Usage:**
```bash
npm run firestore:test
```

**What it does:**
- Validates environment variables are set correctly
- Initializes Firebase Admin SDK
- Tests read/write operations to Firestore
- Displays current database statistics (document counts per collection)

**When to use:**
- After setting up Firebase credentials for the first time
- To verify your Firestore connection is working
- To check current database state

---

### 2. migrate-to-firestore.ts

Migrates all data from `data/db.json` to Firestore.

**Usage:**
```bash
# First, make sure your Firebase credentials are set in .env.local
# Then run the migration
npm run firestore:migrate
```

**What it does:**
- Reads all data from `data/db.json`
- Transfers users, households, recipes, and week plans to Firestore
- Preserves all IDs and relationships
- Uses batched writes for better performance
- Reports detailed migration statistics
- Lists any errors encountered during migration

**Important notes:**
- Creates a backup of your JSON database before running: `cp data/db.json data/db.json.backup`
- The migration is idempotent - you can run it multiple times
- Existing Firestore documents with the same ID will be overwritten
- Does not delete the original `data/db.json` file

**Example output:**
```
🚀 Starting migration from JSON to Firestore...

📖 Reading JSON database from: /path/to/data/db.json

👤 Migrating users...
  ✓ Migrated user: user1@example.com
  ✓ Migrated user: user2@example.com

🏠 Migrating households...
  ✓ Migrated household: Smith Family
  ✓ Migrated household: Jones Family

🍳 Migrating recipes...
  ✓ Migrated recipe: Spaghetti Carbonara
  ✓ Migrated recipe: Caesar Salad
  📦 Committed batch 1

📅 Migrating week plans...
  ✓ Migrated week plan: 2026-02-17 (Household: household-123)

============================================================
📊 MIGRATION SUMMARY
============================================================

Users:      2/2 migrated (0 failed)
Households: 2/2 migrated (0 failed)
Recipes:    2/2 migrated (0 failed)
Week Plans: 1/1 migrated (0 failed)

Total: 7 items migrated, 0 failed

📋 Verifying Firestore data...

Firestore Collections:
  Users:      2
  Households: 2
  Recipes:    2
  Week Plans: 1

============================================================
✅ Migration completed successfully!
```

---

## Prerequisites

Before running these scripts, ensure you have:

1. **Firebase project created** with Firestore enabled
2. **Service account credentials** (see [FIRESTORE_MIGRATION.md](../FIRESTORE_MIGRATION.md))
3. **Environment variables set** in `.env.local`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
4. **Dependencies installed**:
   ```bash
   npm install
   ```

---

## Workflow

Here's the recommended workflow for migrating to Firestore:

### Step 1: Setup Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Generate service account credentials
4. Add credentials to `.env.local`

### Step 2: Test Connection

```bash
npm run firestore:test
```

Verify that all checks pass and you can connect to Firestore.

### Step 3: Backup Your Data

```bash
cp data/db.json data/db.json.backup
```

### Step 4: Run Migration

```bash
npm run firestore:migrate
```

Review the migration summary to ensure all data was transferred successfully.

### Step 5: Verify Data

1. Check the Firestore console to see your data
2. Run the test script again to see updated statistics:
   ```bash
   npm run firestore:test
   ```

### Step 6: Update Application

Once migration is complete and verified, update your API routes to use `firestore-db` instead of `json-db`. See [FIRESTORE_MIGRATION.md](../FIRESTORE_MIGRATION.md) for details.

---

## Troubleshooting

### Error: "Missing Firebase credentials"

Make sure all three environment variables are set in `.env.local`:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Error: "Permission denied"

Your service account may not have the correct permissions. Ensure:
1. Firestore Database is enabled in your Firebase project
2. Your service account has "Cloud Datastore User" or "Firebase Admin" role

### Error: "ENOENT: no such file or directory, open 'data/db.json'"

The JSON database file doesn't exist. Make sure:
1. You're running the script from the project root directory
2. The `data/db.json` file exists
3. The path is correct

### Migration shows failed items

Check the error output for specific issues. Common causes:
- Network connectivity issues
- Invalid data format
- Missing required fields
- Firestore quota limits

---

## Additional Resources

- [FIRESTORE_MIGRATION.md](../FIRESTORE_MIGRATION.md) - Complete migration guide
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [.env.example](../.env.example) - Environment variable template
