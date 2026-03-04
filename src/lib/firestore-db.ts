import * as admin from 'firebase-admin';
import { getFirestore as getFirestoreInstance, Timestamp } from 'firebase-admin/firestore';
import { User, Household, Recipe, WeekPlan, WeekPlanRecipe, GroceryItem, UserInvite } from './types';
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
  return getFirestoreInstance(app, 'family-recipes');
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

export async function hasAnyUsers(): Promise<boolean> {
  const db = getFirestore();
  const snapshot = await db.collection(getCollectionName('users')).limit(1).get();
  return !snapshot.empty;
}

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
  picture?: string,
  isAdmin?: boolean
): Promise<User> {
  const db = getFirestore();

  const user: User = {
    id: googleId,
    email,
    name,
    ...(picture ? { picture } : {}),
    createdAt: now(),
    lastLoginAt: now(),
    householdIds: [],
    homeInvites: [],
    ...(isAdmin !== undefined ? { isAdmin } : {}),
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

async function addPendingHomeInvite(email: string, homeId: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(getCollectionName('pendingHomeInvites')).doc(email);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({ homeIds: admin.firestore.FieldValue.arrayUnion(homeId) });
  } else {
    await ref.set({ email, homeIds: [homeId], invitedAt: now() });
  }
}

async function getPendingHomeInvitesByHomeId(homeId: string): Promise<{ email: string }[]> {
  const db = getFirestore();
  const snapshot = await db.collection(getCollectionName('pendingHomeInvites'))
    .where('homeIds', 'array-contains', homeId)
    .get();

  return snapshot.docs.map(doc => ({ email: doc.data().email as string }));
}

export async function applyPendingHomeInvites(userId: string, email: string): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(getCollectionName('pendingHomeInvites')).doc(email);
  const doc = await ref.get();

  if (!doc.exists) return;

  const data = doc.data() as { homeIds: string[] };
  if (!data.homeIds || data.homeIds.length === 0) return;

  const userRef = db.collection(getCollectionName('users')).doc(userId);
  await userRef.update({
    homeInvites: admin.firestore.FieldValue.arrayUnion(...data.homeIds)
  });

  await ref.delete();
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

  // Verify inviter has access to the home
  if (!home.memberIds.includes(invitedByUserId)) {
    throw new Error('You do not have permission to invite users to this home');
  }

  // Find user by email
  const invitee = await getUserByEmail(inviteeEmail);
  if (!invitee) {
    // User hasn't signed up yet — store as a pending home invite and also grant platform access
    const pendingRef = db.collection(getCollectionName('pendingHomeInvites')).doc(inviteeEmail);
    const pendingDoc = await pendingRef.get();
    const existingHomeIds: string[] = pendingDoc.exists ? (pendingDoc.data()!.homeIds || []) : [];

    if (existingHomeIds.includes(homeId)) {
      return { success: false, message: 'An invite for this home is already pending for that email' };
    }

    await addPendingHomeInvite(inviteeEmail, homeId);

    // Create a platform invite if one doesn't already exist so the user can sign up
    const platformInviteRef = db.collection(getCollectionName('userInvites')).doc(inviteeEmail);
    const platformInviteDoc = await platformInviteRef.get();
    if (!platformInviteDoc.exists || (platformInviteDoc.data() as UserInvite).status !== 'pending') {
      const platformInvite: UserInvite = {
        id: inviteeEmail,
        email: inviteeEmail,
        invitedBy: invitedByUserId,
        invitedAt: now(),
        status: 'pending'
      };
      await platformInviteRef.set(platformInvite);
    }

    return { success: true, message: `Invite sent — ${inviteeEmail} will receive access when they sign up` };
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

export interface OutgoingInvite {
  email: string;
  name: string;
  userId: string;
  invitedAt?: string;
  isPending?: boolean;
}

export async function getOutgoingHomeInvites(homeId: string): Promise<OutgoingInvite[]> {
  const db = getFirestore();

  // Find all users who have this homeId in their homeInvites array
  const snapshot = await db.collection(getCollectionName('users'))
    .where('homeInvites', 'array-contains', homeId)
    .get();

  const existing: OutgoingInvite[] = snapshot.docs.map(doc => {
    const user = doc.data() as User;
    return {
      email: user.email,
      name: user.name,
      userId: user.id,
      isPending: false
    };
  });

  // Also include pending invites for users who haven't signed up yet
  const pendingEmails = await getPendingHomeInvitesByHomeId(homeId);
  const pending: OutgoingInvite[] = pendingEmails.map(({ email }) => ({
    email,
    name: email,
    userId: email, // use email as identifier for pending invites
    isPending: true
  }));

  return [...existing, ...pending];
}

export async function revokeHomeInvite(homeId: string, userId: string, inviteeUserId: string): Promise<void> {
  const db = getFirestore();
  const homeDoc = await db.collection(getCollectionName('households')).doc(homeId).get();

  if (!homeDoc.exists) {
    throw new Error('Home not found');
  }

  const home = homeDoc.data() as Household;

  // Verify revoker has access to the home
  if (!home.memberIds.includes(userId)) {
    throw new Error('You do not have permission to revoke invites for this home');
  }

  // If inviteeUserId is an email, it's a pending invite (user hasn't signed up yet)
  if (inviteeUserId.includes('@')) {
    const pendingRef = db.collection(getCollectionName('pendingHomeInvites')).doc(inviteeUserId);
    await pendingRef.update({
      homeIds: admin.firestore.FieldValue.arrayRemove(homeId)
    });
    return;
  }

  const inviteeRef = db.collection(getCollectionName('users')).doc(inviteeUserId);
  const inviteeDoc = await inviteeRef.get();

  if (!inviteeDoc.exists) {
    throw new Error('User not found');
  }

  await inviteeRef.update({
    homeInvites: admin.firestore.FieldValue.arrayRemove(homeId)
  });
}

// ============================================================================
// USER INVITE OPERATIONS
// ============================================================================

export async function sendUserInvite(adminUserId: string, email: string): Promise<UserInvite> {
  const db = getFirestore();

  // Verify admin has isAdmin: true
  const admin = await getUser(adminUserId);
  if (!admin?.isAdmin) {
    throw new Error('Only admin users can send invites');
  }

  // Check email not already a user
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check email doesn't have pending invite
  const inviteRef = db.collection(getCollectionName('userInvites')).doc(email);
  const existingInviteDoc = await inviteRef.get();

  if (existingInviteDoc.exists) {
    const existingInvite = existingInviteDoc.data() as UserInvite;
    if (existingInvite.status === 'pending') {
      throw new Error('Pending invite already exists for this email');
    }
  }

  // Create UserInvite with status: 'pending'
  const invite: UserInvite = {
    id: email,
    email,
    invitedBy: adminUserId,
    invitedAt: now(),
    status: 'pending'
  };

  await inviteRef.set(invite);
  return invite;
}

export async function getUserInviteByEmail(email: string): Promise<UserInvite | null> {
  const db = getFirestore();
  const inviteDoc = await db.collection(getCollectionName('userInvites')).doc(email).get();

  if (!inviteDoc.exists) {
    return null;
  }

  return inviteDoc.data() as UserInvite;
}

export async function getPendingUserInvites(): Promise<UserInvite[]> {
  const db = getFirestore();
  const snapshot = await db.collection(getCollectionName('userInvites'))
    .where('status', '==', 'pending')
    .get();

  return snapshot.docs.map(doc => doc.data() as UserInvite);
}

export async function acceptUserInvite(email: string): Promise<void> {
  const db = getFirestore();
  const inviteRef = db.collection(getCollectionName('userInvites')).doc(email);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    throw new Error('Invite not found');
  }

  await inviteRef.update({
    status: 'accepted',
    acceptedAt: now()
  });
}

export async function sendPlatformInvite(invitedByUserId: string, email: string): Promise<UserInvite> {
  const db = getFirestore();

  // Check email not already a user
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check email doesn't have pending invite
  const inviteRef = db.collection(getCollectionName('userInvites')).doc(email);
  const existingInviteDoc = await inviteRef.get();

  if (existingInviteDoc.exists) {
    const existingInvite = existingInviteDoc.data() as UserInvite;
    if (existingInvite.status === 'pending') {
      throw new Error('Pending invite already exists for this email');
    }
  }

  // Create UserInvite with status: 'pending'
  const invite: UserInvite = {
    id: email,
    email,
    invitedBy: invitedByUserId,
    invitedAt: now(),
    status: 'pending'
  };

  await inviteRef.set(invite);
  return invite;
}

export async function revokeUserInvite(email: string): Promise<void> {
  const db = getFirestore();
  const inviteRef = db.collection(getCollectionName('userInvites')).doc(email);

  await inviteRef.delete();
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  return user?.isAdmin === true;
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

export async function deleteHousehold(homeId: string, requestingUserId: string): Promise<void> {
  const db = getFirestore();
  const homeRef = db.collection(getCollectionName('households')).doc(homeId);
  const homeDoc = await homeRef.get();

  if (!homeDoc.exists) {
    throw new Error('Home not found');
  }

  const home = homeDoc.data() as Household;

  if (home.ownerId !== requestingUserId) {
    throw new Error('Only the owner can delete this home');
  }

  const batch = db.batch();

  // Remove home from all members' householdIds; clear currentHomeId if set to this home
  for (const memberId of home.memberIds) {
    const memberRef = db.collection(getCollectionName('users')).doc(memberId);
    const memberDoc = await memberRef.get();
    if (memberDoc.exists) {
      const updates: Record<string, admin.firestore.FieldValue | null> = {
        householdIds: admin.firestore.FieldValue.arrayRemove(homeId)
      };
      if ((memberDoc.data() as User).currentHomeId === homeId) {
        updates.currentHomeId = null;
      }
      batch.update(memberRef, updates);
    }
  }

  // Delete the home
  batch.delete(homeRef);
  await batch.commit();

  // Clear homeId from any users who had a pending invite to this home
  const usersWithInvite = await db.collection(getCollectionName('users'))
    .where('homeInvites', 'array-contains', homeId)
    .get();

  if (!usersWithInvite.empty) {
    const inviteBatch = db.batch();
    for (const doc of usersWithInvite.docs) {
      inviteBatch.update(doc.ref, {
        homeInvites: admin.firestore.FieldValue.arrayRemove(homeId)
      });
    }
    await inviteBatch.commit();
  }

  // Clean up pending home invites
  const pendingSnapshot = await db.collection(getCollectionName('pendingHomeInvites'))
    .where('homeIds', 'array-contains', homeId)
    .get();

  if (!pendingSnapshot.empty) {
    const pendingBatch = db.batch();
    for (const doc of pendingSnapshot.docs) {
      pendingBatch.update(doc.ref, {
        homeIds: admin.firestore.FieldValue.arrayRemove(homeId)
      });
    }
    await pendingBatch.commit();
  }
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
  const collections = ['users', 'households', 'recipes', 'weekPlans', 'userInvites'];

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

  const [usersSnapshot, householdsSnapshot, recipesSnapshot, weekPlansSnapshot, userInvitesSnapshot] = await Promise.all([
    db.collection(getCollectionName('users')).get(),
    db.collection(getCollectionName('households')).get(),
    db.collection(getCollectionName('recipes')).get(),
    db.collection(getCollectionName('weekPlans')).get(),
    db.collection(getCollectionName('userInvites')).get()
  ]);

  return {
    users: usersSnapshot.size,
    households: householdsSnapshot.size,
    recipes: recipesSnapshot.size,
    weekPlans: weekPlansSnapshot.size,
    userInvites: userInvitesSnapshot.size
  };
}
