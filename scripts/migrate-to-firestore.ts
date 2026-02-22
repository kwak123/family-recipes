/**
 * Migration script to transfer data from JSON database to Firestore
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-firestore.ts
 *
 * This script will:
 * 1. Read the existing data/db.json file
 * 2. Transfer all users, households, recipes, and week plans to Firestore
 * 3. Preserve all IDs and relationships
 * 4. Report statistics and any errors
 */

import fs from 'fs';
import path from 'path';
import { Database } from '../src/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
function initFirebase() {
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

interface MigrationStats {
  users: { total: number; migrated: number; failed: number };
  households: { total: number; migrated: number; failed: number };
  recipes: { total: number; migrated: number; failed: number };
  weekPlans: { total: number; migrated: number; failed: number };
  errors: Array<{ collection: string; id: string; error: string }>;
}

async function migrateData() {
  console.log('🚀 Starting migration from JSON to Firestore...\n');

  // Initialize Firebase
  initFirebase();
  const db = getFirestore();

  // Read existing JSON database
  const dbPath = path.join(process.cwd(), 'data', 'db.json');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Error: data/db.json not found!');
    console.log('Please ensure the JSON database file exists before running migration.');
    process.exit(1);
  }

  console.log(`📖 Reading JSON database from: ${dbPath}`);
  const jsonData: Database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  const stats: MigrationStats = {
    users: { total: 0, migrated: 0, failed: 0 },
    households: { total: 0, migrated: 0, failed: 0 },
    recipes: { total: 0, migrated: 0, failed: 0 },
    weekPlans: { total: 0, migrated: 0, failed: 0 },
    errors: []
  };

  try {
    // ========================================================================
    // 1. Migrate Users
    // ========================================================================
    console.log('\n👤 Migrating users...');
    const users = Object.values(jsonData.users || {});
    stats.users.total = users.length;

    for (const user of users) {
      try {
        await db.collection('users').doc(user.id).set(user);
        stats.users.migrated++;
        console.log(`  ✓ Migrated user: ${user.email}`);
      } catch (error) {
        stats.users.failed++;
        stats.errors.push({
          collection: 'users',
          id: user.id,
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`  ✗ Failed to migrate user ${user.email}:`, error);
      }
    }

    // ========================================================================
    // 2. Migrate Households
    // ========================================================================
    console.log('\n🏠 Migrating households...');
    const households = Object.values(jsonData.households || {});
    stats.households.total = households.length;

    for (const household of households) {
      try {
        await db.collection('households').doc(household.id).set(household);
        stats.households.migrated++;
        console.log(`  ✓ Migrated household: ${household.name}`);
      } catch (error) {
        stats.households.failed++;
        stats.errors.push({
          collection: 'households',
          id: household.id,
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`  ✗ Failed to migrate household ${household.name}:`, error);
      }
    }

    // ========================================================================
    // 3. Migrate Recipes
    // ========================================================================
    console.log('\n🍳 Migrating recipes...');
    const recipes = Object.values(jsonData.recipes || {});
    stats.recipes.total = recipes.length;

    // Use batched writes for better performance
    const BATCH_SIZE = 500; // Firestore batch limit
    for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const recipeBatch = recipes.slice(i, i + BATCH_SIZE);

      for (const recipe of recipeBatch) {
        try {
          const recipeRef = db.collection('recipes').doc(recipe.id);
          batch.set(recipeRef, recipe);
          stats.recipes.migrated++;
          console.log(`  ✓ Migrated recipe: ${recipe.name}`);
        } catch (error) {
          stats.recipes.failed++;
          stats.errors.push({
            collection: 'recipes',
            id: recipe.id,
            error: error instanceof Error ? error.message : String(error)
          });
          console.error(`  ✗ Failed to migrate recipe ${recipe.name}:`, error);
        }
      }

      await batch.commit();
      console.log(`  📦 Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    }

    // ========================================================================
    // 4. Migrate Week Plans
    // ========================================================================
    console.log('\n📅 Migrating week plans...');
    const weekPlans = Object.values(jsonData.weekPlans || {});
    stats.weekPlans.total = weekPlans.length;

    for (const weekPlan of weekPlans) {
      try {
        await db.collection('weekPlans').doc(weekPlan.id).set(weekPlan);
        stats.weekPlans.migrated++;
        console.log(`  ✓ Migrated week plan: ${weekPlan.weekStartDate} (Household: ${weekPlan.householdId})`);
      } catch (error) {
        stats.weekPlans.failed++;
        stats.errors.push({
          collection: 'weekPlans',
          id: weekPlan.id,
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`  ✗ Failed to migrate week plan ${weekPlan.id}:`, error);
      }
    }

    // ========================================================================
    // Print Summary
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`
Users:      ${stats.users.migrated}/${stats.users.total} migrated (${stats.users.failed} failed)
Households: ${stats.households.migrated}/${stats.households.total} migrated (${stats.households.failed} failed)
Recipes:    ${stats.recipes.migrated}/${stats.recipes.total} migrated (${stats.recipes.failed} failed)
Week Plans: ${stats.weekPlans.migrated}/${stats.weekPlans.total} migrated (${stats.weekPlans.failed} failed)
    `);

    const totalMigrated = stats.users.migrated + stats.households.migrated + stats.recipes.migrated + stats.weekPlans.migrated;
    const totalFailed = stats.users.failed + stats.households.failed + stats.recipes.failed + stats.weekPlans.failed;

    console.log(`Total: ${totalMigrated} items migrated, ${totalFailed} failed`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. [${err.collection}/${err.id}] ${err.error}`);
      });
    }

    if (totalFailed === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${totalFailed} errors.`);
    }

    // Verify Firestore data
    console.log('\n📋 Verifying Firestore data...');
    const [usersSnapshot, householdsSnapshot, recipesSnapshot, weekPlansSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('households').get(),
      db.collection('recipes').get(),
      db.collection('weekPlans').get()
    ]);

    console.log(`
Firestore Collections:
  Users:      ${usersSnapshot.size}
  Households: ${householdsSnapshot.size}
  Recipes:    ${recipesSnapshot.size}
  Week Plans: ${weekPlansSnapshot.size}
    `);

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed with critical error:', error);
    throw error;
  }
}

// Run migration
console.log('🔧 Firestore Migration Tool');
console.log('='.repeat(60));

migrateData()
  .then(() => {
    console.log('\n👋 Migration process complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
