/**
 * Test script to verify Firebase/Firestore connection
 *
 * Usage:
 *   npx ts-node scripts/test-firestore-connection.ts
 *
 * This script will:
 * 1. Check if environment variables are set
 * 2. Initialize Firebase Admin SDK
 * 3. Test connection to Firestore
 * 4. Display database statistics
 */

import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

async function testConnection() {
  console.log('🔧 Firestore Connection Test');
  console.log('='.repeat(60));

  // Check environment variables
  console.log('\n1️⃣ Checking environment variables...');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log(`   FIREBASE_PROJECT_ID: ${projectId ? '✓ Set' : '✗ Not set'}`);
  console.log(`   FIREBASE_CLIENT_EMAIL: ${clientEmail ? '✓ Set' : '✗ Not set'}`);
  console.log(`   FIREBASE_PRIVATE_KEY: ${privateKey ? '✓ Set' : '✗ Not set'}`);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('\n❌ Error: Missing Firebase credentials!');
    console.log('\nPlease set the following in your .env.local file:');
    console.log('  - FIREBASE_PROJECT_ID');
    console.log('  - FIREBASE_CLIENT_EMAIL');
    console.log('  - FIREBASE_PRIVATE_KEY');
    console.log('\nSee .env.example for reference.');
    process.exit(1);
  }

  // Initialize Firebase
  console.log('\n2️⃣ Initializing Firebase Admin SDK...');
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('   ✓ Firebase Admin SDK initialized');
    } else {
      console.log('   ✓ Firebase Admin SDK already initialized');
    }
  } catch (error) {
    console.error('   ✗ Failed to initialize Firebase:', error);
    process.exit(1);
  }

  // Test Firestore connection
  console.log('\n3️⃣ Testing Firestore connection...');
  try {
    const db = getFirestore();
    console.log('   ✓ Firestore client created');

    // Try to access Firestore
    const testRef = db.collection('_connection_test').doc('test');
    await testRef.set({ timestamp: new Date().toISOString(), test: true });
    console.log('   ✓ Write test successful');

    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log('   ✓ Read test successful');
    }

    // Clean up test document
    await testRef.delete();
    console.log('   ✓ Delete test successful');

  } catch (error) {
    console.error('   ✗ Firestore connection failed:', error);
    process.exit(1);
  }

  // Get database statistics
  console.log('\n4️⃣ Fetching database statistics...');
  try {
    const db = getFirestore();

    const [usersSnapshot, householdsSnapshot, recipesSnapshot, weekPlansSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('households').get(),
      db.collection('recipes').get(),
      db.collection('weekPlans').get()
    ]);

    console.log('\n📊 Database Statistics:');
    console.log(`   Users:      ${usersSnapshot.size}`);
    console.log(`   Households: ${householdsSnapshot.size}`);
    console.log(`   Recipes:    ${recipesSnapshot.size}`);
    console.log(`   Week Plans: ${weekPlansSnapshot.size}`);

    const total = usersSnapshot.size + householdsSnapshot.size + recipesSnapshot.size + weekPlansSnapshot.size;
    console.log(`   Total:      ${total} documents`);

  } catch (error) {
    console.error('   ✗ Failed to fetch statistics:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests passed! Firestore is ready to use.');
  console.log('='.repeat(60));
}

// Run the test
testConnection()
  .then(() => {
    console.log('\n👋 Test complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
