import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { User, Household, Recipe, WeekPlan, WeekPlanRecipe, GroceryItem } from './types';
import { aggregateIngredients } from '@/utils/grocery';

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let app: admin.app.App;

function getFirebaseApp(): admin.app.App {
  if (app) {
    return app;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  // Initialize Firebase Admin SDK
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return app;
}

function getFirestore(): admin.firestore.Firestore {
  const app = getFirebaseApp();
  return admin.firestore(app);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get collection name with environment suffix
 * Local: users_dev, recipes_dev, etc.
 * Production: users_prod, recipes_prod, etc.
 */
function getCollectionName(baseName: string): string {
  const env = process.env.FIRESTORE_ENV || 'dev';
  return `${baseName}_${env}`;
}

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Convert Firestore Timestamp to ISO string
 */
function timestampToISO(timestamp: Timestamp | string | undefined): string {
  if (!timestamp) return now();
  if (typeof timestamp === 'string') return timestamp;
  return timestamp.toDate().toISOString();
}

/**
 * Convert ISO string to Firestore Timestamp
 */
function isoToTimestamp(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

/**
 * Ensure default household exists, create if it doesn't
 */
async function ensureDefaultHousehold(): Promise<Household> {
  const db = getFirestore();
  const householdId = 'default-household';
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);
  const householdDoc = await householdRef.get();

  if (!householdDoc.exists) {
    const household: Household = {
      id: householdId,
      name: 'Default Household',
      createdAt: now(),
      updatedAt: now(),
      ownerId: 'default-user',
      memberIds: ['default-user'],
      settings: {
        defaultServings: 4,
        preferences: []
      },
      favoriteIngredients: [],
      favoriteRecipeIds: []
    };
    await householdRef.set(household);
    return household;
  }

  return householdDoc.data() as Household;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getUser(userId: string): Promise<User | null> {
  try {
    const db = getFirestore();
    const userDoc = await db.collection(getCollectionName('users')).doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function createUser(
  googleId: string,
  email: string,
  name: string,
  picture?: string
): Promise<User> {
  const db = getFirestore();

  const user: User = {
    id: googleId,
    email,
    name,
    picture,
    createdAt: now(),
    lastLoginAt: now(),
    householdIds: [],
    homeInvites: []
  };

  await db.collection(getCollectionName('users')).doc(user.id).set(user);
  return user;
}

export async function updateUserLastLogin(userId: string): Promise<User> {
  const db = getFirestore();
  const userRef = db.collection(getCollectionName('users')).doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const lastLoginAt = now();
  await userRef.update({ lastLoginAt });

  return {
    ...(userDoc.data() as User),
    lastLoginAt
  };
}

export async function getUserHouseholds(userId: string): Promise<Household[]> {
  const user = await getUser(userId);
  if (!user) return [];

  const db = getFirestore();
  const households: Household[] = [];

  // Fetch all households that the user is a member of
  for (const householdId of user.householdIds) {
    const householdDoc = await db.collection(getCollectionName('households')).doc(householdId).get();
    if (householdDoc.exists) {
      households.push(householdDoc.data() as Household);
    }
  }

  return households;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getFirestore();
  const usersSnapshot = await db.collection(getCollectionName('users'))
    .where('email', '==', email)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    return null;
  }

  return usersSnapshot.docs[0].data() as User;
}

export async function setCurrentHome(userId: string, homeId: string): Promise<User> {
  const db = getFirestore();
  const userRef = db.collection(getCollectionName('users')).doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as User;

  // Verify user has access to this home
  if (!user.householdIds.includes(homeId)) {
    throw new Error('User does not have access to this home');
  }

  await userRef.update({ currentHomeId: homeId });

  return {
    ...user,
    currentHomeId: homeId
  };
}

export async function sendHomeInvite(
  homeId: string,
  invitedByUserId: string,
  inviteeEmail: string
): Promise<{ success: boolean; message: string }> {
  const db = getFirestore();
  const homeDoc = await db.collection(getCollectionName('households')).doc(homeId).get();
  const invitedByUserDoc = await db.collection(getCollectionName('users')).doc(invitedByUserId).get();

  if (!homeDoc.exists || !invitedByUserDoc.exists) {
    throw new Error('Home or user not found');
  }

  const home = homeDoc.data() as Household;
  const invitedByUser = invitedByUserDoc.data() as User;

  // Verify inviter has access to the home
  if (!home.memberIds.includes(invitedByUserId)) {
    throw new Error('You do not have permission to invite users to this home');
  }

  // Find user by email
  const invitee = await getUserByEmail(inviteeEmail);
  if (!invitee) {
    return { success: false, message: 'No user found with that email address' };
  }

  // Check if already a member
  if (home.memberIds.includes(invitee.id)) {
    return { success: false, message: 'User is already a member of this home' };
  }

  // Check if already invited
  const homeInvites = invitee.homeInvites || [];
  if (homeInvites.includes(homeId)) {
    return { success: false, message: 'User has already been invited to this home' };
  }

  // Add invite
  const inviteeRef = db.collection(getCollectionName('users')).doc(invitee.id);
  await inviteeRef.update({
    homeInvites: admin.firestore.FieldValue.arrayUnion(homeId)
  });

  return { success: true, message: `Invite sent to ${invitee.name}` };
}

export async function getUserInvites(userId: string): Promise<Household[]> {
  const user = await getUser(userId);
  if (!user || !user.homeInvites) return [];

  const db = getFirestore();
  const households: Household[] = [];

  for (const homeId of user.homeInvites) {
    const homeDoc = await db.collection(getCollectionName('households')).doc(homeId).get();
    if (homeDoc.exists) {
      households.push(homeDoc.data() as Household);
    }
  }

  return households;
}

export async function acceptHomeInvite(userId: string, homeId: string): Promise<Household> {
  const db = getFirestore();
  const userRef = db.collection(getCollectionName('users')).doc(userId);
  const homeRef = db.collection(getCollectionName('households')).doc(homeId);

  const [userDoc, homeDoc] = await Promise.all([
    userRef.get(),
    homeRef.get()
  ]);

  if (!userDoc.exists || !homeDoc.exists) {
    throw new Error('User or home not found');
  }

  const user = userDoc.data() as User;
  const home = homeDoc.data() as Household;

  // Verify user has been invited
  if (!user.homeInvites || !user.homeInvites.includes(homeId)) {
    throw new Error('No invite found for this home');
  }

  // Update both user and home in a batch
  const batch = db.batch();

  // Add user to home
  if (!home.memberIds.includes(userId)) {
    batch.update(homeRef, {
      memberIds: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: now()
    });
  }

  // Add home to user's list and remove invite
  batch.update(userRef, {
    householdIds: admin.firestore.FieldValue.arrayUnion(homeId),
    homeInvites: admin.firestore.FieldValue.arrayRemove(homeId)
  });

  await batch.commit();

  // Return updated home
  const updatedHomeDoc = await homeRef.get();
  return updatedHomeDoc.data() as Household;
}

export async function declineHomeInvite(userId: string, homeId: string): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection(getCollectionName('users')).doc(userId);

  await userRef.update({
    homeInvites: admin.firestore.FieldValue.arrayRemove(homeId)
  });
}

// ============================================================================
// HOUSEHOLD OPERATIONS
// ============================================================================

export async function getHousehold(householdId: string): Promise<Household | null> {
  const db = getFirestore();

  // Ensure default household exists
  if (householdId === 'default-household') {
    const householdDoc = await db.collection(getCollectionName('households')).doc(householdId).get();
    if (!householdDoc.exists) {
      return await ensureDefaultHousehold();
    }
  }

  const householdDoc = await db.collection(getCollectionName('households')).doc(householdId).get();

  if (!householdDoc.exists) {
    return null;
  }

  return householdDoc.data() as Household;
}

export async function createHousehold(name: string, ownerId: string): Promise<Household> {
  const db = getFirestore();

  const household: Household = {
    id: generateId('household'),
    name,
    createdAt: now(),
    updatedAt: now(),
    ownerId,
    memberIds: [ownerId],
    settings: {
      defaultServings: 4,
      preferences: []
    },
    favoriteIngredients: [],
    favoriteRecipeIds: []
  };

  const batch = db.batch();

  // Create household
  const householdRef = db.collection(getCollectionName('households')).doc(household.id);
  batch.set(householdRef, household);

  // Add household to user's list
  const userRef = db.collection(getCollectionName('users')).doc(ownerId);
  batch.update(userRef, {
    householdIds: admin.firestore.FieldValue.arrayUnion(household.id)
  });

  await batch.commit();

  return household;
}

export async function updateHousehold(
  householdId: string,
  updates: Partial<Household>
): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);
  const householdDoc = await householdRef.get();

  if (!householdDoc.exists) {
    throw new Error('Household not found');
  }

  const updatedData = {
    ...updates,
    updatedAt: now()
  };

  await householdRef.update(updatedData);

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function addFavoriteRecipe(householdId: string, recipeId: string): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);

  // Ensure default household exists
  if (householdId === 'default-household') {
    const householdDoc = await householdRef.get();
    if (!householdDoc.exists) {
      await ensureDefaultHousehold();
    }
  }

  await householdRef.update({
    favoriteRecipeIds: admin.firestore.FieldValue.arrayUnion(recipeId),
    updatedAt: now()
  });

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function removeFavoriteRecipe(householdId: string, recipeId: string): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);

  // Ensure default household exists
  if (householdId === 'default-household') {
    const householdDoc = await householdRef.get();
    if (!householdDoc.exists) {
      await ensureDefaultHousehold();
    }
  }

  await householdRef.update({
    favoriteRecipeIds: admin.firestore.FieldValue.arrayRemove(recipeId),
    updatedAt: now()
  });

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function addFavoriteIngredient(householdId: string, ingredient: string): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);

  // Ensure default household exists
  if (householdId === 'default-household') {
    const householdDoc = await householdRef.get();
    if (!householdDoc.exists) {
      await ensureDefaultHousehold();
    }
  }

  const normalizedIngredient = ingredient.toLowerCase().trim();

  await householdRef.update({
    favoriteIngredients: admin.firestore.FieldValue.arrayUnion(normalizedIngredient),
    updatedAt: now()
  });

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function removeFavoriteIngredient(householdId: string, ingredient: string): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);

  // Ensure default household exists
  if (householdId === 'default-household') {
    const householdDoc = await householdRef.get();
    if (!householdDoc.exists) {
      await ensureDefaultHousehold();
    }
  }

  const normalizedIngredient = ingredient.toLowerCase().trim();

  await householdRef.update({
    favoriteIngredients: admin.firestore.FieldValue.arrayRemove(normalizedIngredient),
    updatedAt: now()
  });

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function addHouseholdMember(householdId: string, userId: string): Promise<Household> {
  const db = getFirestore();
  const batch = db.batch();

  const householdRef = db.collection(getCollectionName('households')).doc(householdId);
  const userRef = db.collection(getCollectionName('users')).doc(userId);

  batch.update(householdRef, {
    memberIds: admin.firestore.FieldValue.arrayUnion(userId),
    updatedAt: now()
  });

  batch.update(userRef, {
    householdIds: admin.firestore.FieldValue.arrayUnion(householdId)
  });

  await batch.commit();

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function removeHouseholdMember(householdId: string, userId: string): Promise<Household> {
  const db = getFirestore();
  const householdRef = db.collection(getCollectionName('households')).doc(householdId);
  const householdDoc = await householdRef.get();

  if (!householdDoc.exists) {
    throw new Error('Household not found');
  }

  const household = householdDoc.data() as Household;

  // Can't remove owner
  if (household.ownerId === userId) {
    throw new Error('Cannot remove household owner');
  }

  const batch = db.batch();

  batch.update(householdRef, {
    memberIds: admin.firestore.FieldValue.arrayRemove(userId),
    updatedAt: now()
  });

  const userRef = db.collection(getCollectionName('users')).doc(userId);
  batch.update(userRef, {
    householdIds: admin.firestore.FieldValue.arrayRemove(householdId)
  });

  await batch.commit();

  const updatedDoc = await householdRef.get();
  return updatedDoc.data() as Household;
}

export async function isHouseholdOwner(householdId: string, userId: string): Promise<boolean> {
  const household = await getHousehold(householdId);
  return household?.ownerId === userId;
}

export async function isHouseholdMember(householdId: string, userId: string): Promise<boolean> {
  const household = await getHousehold(householdId);
  return household?.memberIds.includes(userId) || false;
}

// ============================================================================
// RECIPE OPERATIONS
// ============================================================================

export async function getRecipe(recipeId: string): Promise<Recipe | null> {
  const db = getFirestore();
  const recipeDoc = await db.collection(getCollectionName('recipes')).doc(recipeId).get();

  if (!recipeDoc.exists) {
    return null;
  }

  return recipeDoc.data() as Recipe;
}

export async function getRecipesByHousehold(
  householdId: string,
  includeArchived = false
): Promise<Recipe[]> {
  const db = getFirestore();
  let query = db.collection(getCollectionName('recipes'))
    .where('householdId', '==', householdId);

  if (!includeArchived) {
    query = query.where('isArchived', '==', false);
  }

  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => doc.data() as Recipe);
}

export async function getFavoriteRecipes(householdId: string): Promise<Recipe[]> {
  const household = await getHousehold(householdId);
  if (!household) return [];

  const db = getFirestore();
  const recipes: Recipe[] = [];

  // Firestore has a limit of 10 items per 'in' query, so we need to batch
  const batchSize = 10;
  for (let i = 0; i < household.favoriteRecipeIds.length; i += batchSize) {
    const batch = household.favoriteRecipeIds.slice(i, i + batchSize);

    if (batch.length > 0) {
      const snapshot = await db.collection(getCollectionName('recipes'))
        .where(admin.firestore.FieldPath.documentId(), 'in', batch)
        .where('isArchived', '==', false)
        .get();

      recipes.push(...snapshot.docs.map(doc => doc.data() as Recipe));
    }
  }

  return recipes;
}

export async function saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
  const db = getFirestore();

  const newRecipe: Recipe = {
    ...recipe,
    id: generateId('recipe'),
    createdAt: now()
  };

  await db.collection(getCollectionName('recipes')).doc(newRecipe.id).set(newRecipe);
  return newRecipe;
}

export async function saveRecipes(recipes: Omit<Recipe, 'createdAt'>[]): Promise<Recipe[]> {
  const db = getFirestore();
  const batch = db.batch();
  const savedRecipes: Recipe[] = [];

  for (const recipe of recipes) {
    const newRecipe: Recipe = {
      ...recipe,
      createdAt: now()
    };

    const recipeRef = db.collection(getCollectionName('recipes')).doc(newRecipe.id);
    batch.set(recipeRef, newRecipe);
    savedRecipes.push(newRecipe);
  }

  await batch.commit();
  return savedRecipes;
}

export async function updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
  const db = getFirestore();
  const recipeRef = db.collection(getCollectionName('recipes')).doc(recipeId);
  const recipeDoc = await recipeRef.get();

  if (!recipeDoc.exists) {
    throw new Error('Recipe not found');
  }

  await recipeRef.update(updates);

  const updatedDoc = await recipeRef.get();
  return updatedDoc.data() as Recipe;
}

export async function archiveRecipe(recipeId: string): Promise<Recipe> {
  return updateRecipe(recipeId, { isArchived: true });
}

// ============================================================================
// WEEK PLAN OPERATIONS
// ============================================================================

export async function getWeekPlan(householdId: string, weekStartDate: string): Promise<WeekPlan | null> {
  const db = getFirestore();
  const snapshot = await db.collection(getCollectionName('weekPlans'))
    .where('householdId', '==', householdId)
    .where('weekStartDate', '==', weekStartDate)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as WeekPlan;
}

export async function getCurrentWeekPlan(householdId: string): Promise<WeekPlan | null> {
  const weekStart = getCurrentWeekStart();
  return getWeekPlan(householdId, weekStart);
}

export async function createWeekPlan(householdId: string, weekStartDate: string): Promise<WeekPlan> {
  const db = getFirestore();
  const weekEndDate = getWeekEnd(weekStartDate);

  const weekPlan: WeekPlan = {
    id: generateId('weekplan'),
    householdId,
    weekStartDate,
    weekEndDate,
    recipes: [],
    generatedGroceryList: [],
    createdAt: now(),
    updatedAt: now()
  };

  await db.collection(getCollectionName('weekPlans')).doc(weekPlan.id).set(weekPlan);
  return weekPlan;
}

export async function addRecipeToWeekPlan(
  householdId: string,
  recipeId: string,
  dayOfWeek: WeekPlanRecipe['dayOfWeek'],
  mealType: WeekPlanRecipe['mealType'],
  addedBy: string
): Promise<WeekPlan> {
  const weekStart = getCurrentWeekStart();
  let weekPlan = await getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    weekPlan = await createWeekPlan(householdId, weekStart);
  }

  // Check if recipe exists
  const recipe = await getRecipe(recipeId);
  if (!recipe) {
    throw new Error('Recipe not found');
  }

  // Add recipe to week plan
  const newRecipeEntry: WeekPlanRecipe = {
    recipeId,
    dayOfWeek,
    mealType,
    addedBy,
    addedAt: now()
  };

  weekPlan.recipes.push(newRecipeEntry);

  // Regenerate grocery list
  const recipeIds = weekPlan.recipes.map(r => r.recipeId);
  const recipes = await Promise.all(
    recipeIds.map(id => getRecipe(id))
  );
  const validRecipes = recipes.filter(r => r !== null) as Recipe[];
  weekPlan.generatedGroceryList = aggregateIngredients(validRecipes);

  weekPlan.updatedAt = now();

  const db = getFirestore();
  await db.collection(getCollectionName('weekPlans')).doc(weekPlan.id).update({
    recipes: weekPlan.recipes,
    generatedGroceryList: weekPlan.generatedGroceryList,
    updatedAt: weekPlan.updatedAt
  });

  return weekPlan;
}

export async function removeRecipeFromWeekPlan(
  householdId: string,
  recipeId: string
): Promise<WeekPlan> {
  const weekStart = getCurrentWeekStart();
  const weekPlan = await getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    throw new Error('Week plan not found');
  }

  // Remove recipe
  weekPlan.recipes = weekPlan.recipes.filter(r => r.recipeId !== recipeId);

  // Regenerate grocery list
  const recipeIds = weekPlan.recipes.map(r => r.recipeId);
  const recipes = await Promise.all(
    recipeIds.map(id => getRecipe(id))
  );
  const validRecipes = recipes.filter(r => r !== null) as Recipe[];
  weekPlan.generatedGroceryList = aggregateIngredients(validRecipes);

  weekPlan.updatedAt = now();

  const db = getFirestore();
  await db.collection(getCollectionName('weekPlans')).doc(weekPlan.id).update({
    recipes: weekPlan.recipes,
    generatedGroceryList: weekPlan.generatedGroceryList,
    updatedAt: weekPlan.updatedAt
  });

  return weekPlan;
}

export async function updateGroceryItemChecked(
  householdId: string,
  ingredientName: string,
  checked: boolean
): Promise<WeekPlan> {
  const weekStart = getCurrentWeekStart();
  const weekPlan = await getWeekPlan(householdId, weekStart);

  if (!weekPlan) {
    throw new Error('Week plan not found');
  }

  const item = weekPlan.generatedGroceryList.find(
    i => i.name.toLowerCase() === ingredientName.toLowerCase()
  );

  if (item) {
    item.checkedOff = checked;
    weekPlan.updatedAt = now();

    const db = getFirestore();
    await db.collection(getCollectionName('weekPlans')).doc(weekPlan.id).update({
      generatedGroceryList: weekPlan.generatedGroceryList,
      updatedAt: weekPlan.updatedAt
    });
  }

  return weekPlan;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentWeekStart(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}

// ============================================================================
// DEV OPERATIONS
// ============================================================================

export async function purgeDatabase(): Promise<void> {
  const db = getFirestore();

  // Delete all documents in each collection
  const collections = ['users', 'households', 'recipes', 'weekPlans'];

  for (const collectionName of collections) {
    const snapshot = await db.collection(getCollectionName(collectionName)).get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}

export async function getDatabaseStats() {
  const db = getFirestore();

  const [usersSnapshot, householdsSnapshot, recipesSnapshot, weekPlansSnapshot] = await Promise.all([
    db.collection(getCollectionName('users')).get(),
    db.collection(getCollectionName('households')).get(),
    db.collection(getCollectionName('recipes')).get(),
    db.collection(getCollectionName('weekPlans')).get()
  ]);

  return {
    users: usersSnapshot.size,
    households: householdsSnapshot.size,
    recipes: recipesSnapshot.size,
    weekPlans: weekPlansSnapshot.size
  };
}
